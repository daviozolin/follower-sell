import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-success.component.html',
})
export class CheckoutSuccessComponent {
  protected readonly store = inject(CheckoutStore);
  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);

  protected async copy(id: string): Promise<void> {
    if (await this.clipboard.copy(id)) this.toast.success('Código do pedido copiado.');
  }
}
