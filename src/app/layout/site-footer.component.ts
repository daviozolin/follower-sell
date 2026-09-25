import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../shared/ui/icon.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="mt-24 border-t border-line/60">
      <div class="container-page flex flex-col gap-6 py-10 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <app-icon name="shield" class="h-4 w-4 text-success" />
          <span>Nunca solicitamos sua senha. Pagamentos processados por parceiros certificados.</span>
        </div>
        <div class="flex gap-5">
          <a routerLink="/rastreio" class="hover:text-ink">Rastrear pedido</a>
          <a routerLink="/" fragment="faq" class="hover:text-ink">Dúvidas</a>
          <span class="text-ink-faint">© {{ year }} Pulse Growth</span>
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {
  protected readonly year = new Date().getFullYear();
}
