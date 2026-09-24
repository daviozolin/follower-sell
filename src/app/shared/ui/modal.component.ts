import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { IconComponent } from './icon.component';

let nextId = 0;

/** Modal acessível baseado em <dialog> nativo (foco preso, Esc fecha, backdrop). */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog [attr.aria-labelledby]="titleId" (close)="closed.emit()" (click)="onBackdrop($event)"
            class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-canvas/80 backdrop:backdrop-blur-sm open:animate-fade-up">
      <div class="p-6">
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 [id]="titleId" class="text-lg font-semibold">{{ title() }}</h2>
          <button type="button" (click)="closed.emit()" aria-label="Fechar"
                  class="-m-1 rounded-lg p-1 text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink">
            <app-icon name="x" class="h-5 w-5" />
          </button>
        </div>
        <ng-content />
      </div>
    </dialog>
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
  protected readonly titleId = `modal-title-${++nextId}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.closed.emit();
  }
}
