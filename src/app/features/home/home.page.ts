import { ChangeDetectionStrategy, Component } from '@angular/core';
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
 *  hero (grid + glows) → faixa magenta → como funciona → serviços (canvas) → combos (diagonal magenta)
 *  → calculadora (banda com pontos)
 *  → segurança (limão, invertida) → FAQ (canvas com acento magenta).
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroSectionComponent,
    MarqueeComponent,
    HowItWorksSectionComponent,
    ServiceSelectorComponent,
    PackageGridComponent,
    ComboSectionComponent,
    OrderCalculatorComponent,
    SecuritySectionComponent,
    FaqSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-section />

    <app-marquee class="-rotate-1 border-y-2 border-canvas bg-magenta py-4 text-white" [items]="marquee" />

    <section id="como-funciona" class="scroll-mt-16 pb-8 pt-24 lg:pt-32">
      <div class="container-page">
        <app-how-it-works-section />
      </div>
    </section>

    <section id="servicos" class="scroll-mt-16 py-24 lg:py-32">
      <div class="container-page">
        <app-service-selector />
        <app-package-grid />
      </div>
    </section>

    <!-- Combos: faixa escura com diagonal magenta, identidade "premium" -->
    <section id="combos" class="relative scroll-mt-16 overflow-hidden border-y border-magenta/25 bg-surface/60 py-24 lg:py-32">
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(var(--color-magenta)/0.14)_0%,transparent_45%)]"></div>
      <div aria-hidden="true" class="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-magenta/20 blur-[120px]"></div>
      <div class="container-page relative">
        <app-combo-section />
      </div>
    </section>

    <section id="calculadora" class="bg-dots relative scroll-mt-16 border-y border-line/70 bg-surface/40 py-24 lg:py-32">
      <div class="container-page">
        <app-order-calculator />
      </div>
    </section>

    <section id="seguranca" class="scroll-mt-16 bg-accent py-24 text-accent-ink lg:py-32">
      <div class="container-page">
        <app-security-section />
      </div>
    </section>

    <section id="faq" class="relative scroll-mt-16 overflow-hidden py-24 lg:py-32">
      <div aria-hidden="true" class="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-magenta/15 blur-[120px]"></div>
      <div class="container-page relative">
        <app-faq-section />
      </div>
    </section>
  `,
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
