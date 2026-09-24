import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="pointer-events-auto flex max-w-sm animate-fade-up items-center gap-3 rounded-xl border bg-surface-raised px-4 py-3 text-sm shadow-card"
             [class]="toneBorder[toast.tone]">
          @switch (toast.tone) {
            @case ('success') { <app-icon name="check-circle" class="h-5 w-5 text-success" /> }
            @case ('error') { <app-icon name="alert" class="h-5 w-5 text-danger" /> }
            @default { <app-icon name="info" class="h-5 w-5 text-accent-soft" /> }
          }
          <span class="text-ink">{{ toast.message }}</span>
          <button type="button" (click)="toasts.dismiss(toast.id)" aria-label="Fechar aviso" class="ml-1 text-ink-faint hover:text-ink">
            <app-icon name="x" class="h-4 w-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly toneBorder: Record<ToastTone, string> = {
    success: 'border-success/40',
    error: 'border-danger/40',
    info: 'border-line',
  };
}
