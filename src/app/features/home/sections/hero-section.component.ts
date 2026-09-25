import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AnimatedBackgroundComponent } from '../../../shared/three/animated-background.component';
import { HeroGrowthChartComponent } from '../components/hero-growth-chart.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent, HeroGrowthChartComponent, AnimatedBackgroundComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block overflow-hidden' },
  templateUrl: './hero-section.component.html',
})
export class HeroSectionComponent {
  protected readonly stats = [
    { label: 'Pedidos entregues', value: '184k', highlight: false },
    { label: 'Retenção média', value: '97,8%', highlight: false },
    { label: 'Senhas pedidas', value: '0', highlight: true },
  ];
}
