import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastTone } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-outlet.component.html',
})
export class ToastOutletComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly toneBorder: Record<ToastTone, string> = {
    success: 'border-success/40',
    error: 'border-danger/40',
    info: 'border-line',
  };
}
