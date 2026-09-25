import { Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';

/**
 * Dá um "pulo" no elemento sempre que o valor vinculado muda (ex.: contadores ao vivo).
 * Usa a Web Animations API — sem recriar o DOM. Respeita `prefers-reduced-motion`.
 *
 * Uso: `<span [appPopOnChange]="count()">{{ count() }}</span>`
 */
@Directive({
  selector: '[appPopOnChange]',
  standalone: true,
})
export class PopOnChangeDirective {
  readonly appPopOnChange = input<unknown>();
  private readonly el = inject(ElementRef<HTMLElement>);
  private initialized = false;

  constructor() {
    effect(() => {
      this.appPopOnChange(); // rastreia o valor
      untracked(() => this.play());
    });
  }

  private play(): void {
    if (!this.initialized) {
      this.initialized = true; // não anima o valor inicial
      return;
    }
    const host = this.el.nativeElement as HTMLElement;
    if (typeof host.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    host.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)', color: 'rgb(var(--color-accent))', offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      { duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }
}
