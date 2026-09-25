import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../shared/ui/icon.component';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent {
  protected readonly menuOpen = signal(false);
  protected readonly links = [
    { label: 'Como funciona', fragment: 'como-funciona' },
    { label: 'Serviços', fragment: 'servicos' },
    { label: 'Combos', fragment: 'combos' },
    { label: 'Segurança', fragment: 'seguranca' },
    { label: 'Dúvidas', fragment: 'faq' },
  ];
}
