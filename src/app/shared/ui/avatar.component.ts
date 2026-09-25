import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Avatar gerado (iniciais + gradiente), evitando buscar imagens de terceiros. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="flex h-full w-full items-center justify-center rounded-full text-lg font-semibold text-white ring-2 ring-accent/40 ring-offset-2 ring-offset-surface"
          [style.background]="background()">{{ initials() }}</span>
  `,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly hue = input(240);
  protected readonly initials = computed(() =>
    this.name().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
  );
  protected readonly background = computed(
    () => `linear-gradient(135deg, hsl(${this.hue()} 85% 58%), hsl(${(this.hue() + 70) % 360} 90% 45%))`,
  );
}
