import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AnimatedBackgroundComponent } from '../../shared/three/animated-background.component';
import { MarqueeComponent } from '../../shared/ui/marquee.component';
import { ComboSectionComponent } from './sections/combo-section.component';
import { HowItWorksSectionComponent } from './sections/how-it-works-section.component';
import { FaqSectionComponent } from './sections/faq-section.component';
import { HeroSectionComponent } from './sections/hero-section.component';
import { OrderCalculatorComponent } from './sections/order-calculator.component';
import { PackageGridComponent } from './sections/package-grid.component';
import { SecuritySectionComponent } from './sections/security-section.component';
import { ServiceSelectorComponent } from './sections/service-selector.component';

/**
 * Cada seção tem uma identidade visual própria, para o ritmo da página ficar claro:
 *  hero (onda de partículas 3D) → faixa magenta → como funciona → serviços (canvas) → combos (diagonal magenta)
 *  → calculadora (banda com pontos)
 *  Fundos animados (Three.js) só no hero, combos, segurança e dúvidas — seções de leitura ficam calmas.
 *  → segurança (limão, invertida) → FAQ (canvas com acento magenta).
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroSectionComponent,
    MarqueeComponent,
    AnimatedBackgroundComponent,
    HowItWorksSectionComponent,
    ServiceSelectorComponent,
    PackageGridComponent,
    ComboSectionComponent,
    OrderCalculatorComponent,
    SecuritySectionComponent,
    FaqSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
})
export class HomePage {
  protected readonly marquee = [
    'Sem senha',
    'Garantia 30 dias',
    'Entrega gradual',
    'Entrega rápida',
    'Combos orgânicos',
    'Reposição automática',
    'Pix instantâneo',
  ];
}
