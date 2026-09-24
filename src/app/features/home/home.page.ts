import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FaqSectionComponent } from './sections/faq-section.component';
import { HeroSectionComponent } from './sections/hero-section.component';
import { OrderCalculatorComponent } from './sections/order-calculator.component';
import { PackageGridComponent } from './sections/package-grid.component';
import { SecuritySectionComponent } from './sections/security-section.component';
import { ServiceSelectorComponent } from './sections/service-selector.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroSectionComponent,
    ServiceSelectorComponent,
    PackageGridComponent,
    OrderCalculatorComponent,
    SecuritySectionComponent,
    FaqSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-section />

    <section id="servicos" class="container-page scroll-mt-24 py-16">
      <app-service-selector />
      <app-package-grid />
    </section>

    <section id="calculadora" class="container-page scroll-mt-24 py-16">
      <app-order-calculator />
    </section>

    <section id="seguranca" class="container-page scroll-mt-24 py-16">
      <app-security-section />
    </section>

    <section id="faq" class="container-page scroll-mt-24 py-16">
      <app-faq-section />
    </section>
  `,
})
export class HomePage {}
