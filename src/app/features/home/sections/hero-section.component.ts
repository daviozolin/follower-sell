import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block overflow-hidden' },
  template: `
    <!-- Fundo exclusivo do hero: grid + glows -->
    <div aria-hidden="true" class="bg-grid pointer-events-none absolute inset-0"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[120px]"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -right-32 top-40 h-[26rem] w-[26rem] rounded-full bg-magenta/25 blur-[120px]"></div>

    <div class="container-page relative grid items-center gap-14 pb-20 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:pb-28 lg:pt-24">
      <div class="animate-fade-up">
        <app-badge tone="accent" [dot]="true" [pulse]="true">Entregas ativas agora</app-badge>
        <h1 class="display mt-7 text-[2.9rem] leading-[0.95] sm:text-6xl lg:text-[5.25rem]">
          Cresça no ritmo
          <span class="relative whitespace-nowrap">
            <span class="relative z-10 text-accent-ink">do algoritmo</span>
            <span aria-hidden="true" class="absolute -inset-x-2 inset-y-1 -z-0 -rotate-1 rounded-lg bg-accent sm:inset-y-2"></span>
          </span><span class="text-magenta">.</span>
        </h1>
        <p class="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted">
          Entrega gradual por <strong class="font-semibold text-ink">drip-feed</strong> que imita crescimento orgânico —
          ou tudo de <strong class="font-semibold text-ink">uma tacada</strong>, se você tem pressa.
          Sem senha, sem queda brusca e com reposição por 30 dias.
        </p>
        <div class="mt-10 flex flex-wrap items-center gap-3">
          <a routerLink="/" fragment="servicos" class="btn-primary !px-6 !py-3.5 text-base">
            Escolher serviço <app-icon name="arrow-right" class="h-4 w-4" [stroke]="2.4" />
          </a>
          <a routerLink="/" fragment="seguranca" class="btn-ghost !py-3.5">
            <app-icon name="shield" class="h-4 w-4 text-accent" /> Por que é seguro
          </a>
        </div>
        <dl class="mt-14 grid max-w-lg grid-cols-3 divide-x divide-line/70 border-y border-line/70">
          @for (stat of stats; track stat.label) {
            <div class="flex flex-col-reverse py-5 pl-5 first:pl-0">
              <dt class="mt-1 text-xs text-ink-faint">{{ stat.label }}</dt>
              <dd class="display text-3xl" [class.text-magenta]="stat.highlight">{{ stat.value }}</dd>
            </div>
          }
        </dl>
      </div>

      <!-- Visual: curva de entrega drip-feed vs. pico artificial -->
      <div class="relative animate-fade-up [animation-delay:120ms]">
        <div class="card relative rotate-1 p-6 transition-transform duration-500 hover:rotate-0">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-ink-faint">Novos seguidores · 7 dias</p>
              <p class="display mt-1 text-4xl">+2.480</p>
            </div>
            <app-badge tone="accent"><app-icon name="drip" class="h-3 w-3" /> Drip-feed</app-badge>
          </div>
          <svg viewBox="0 0 320 150" class="mt-6 w-full" role="img" aria-label="Gráfico ilustrativo: crescimento gradual comparado a um pico artificial">
            <defs>
              <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="rgb(var(--color-accent))" stop-opacity="0.35" />
                <stop offset="100%" stop-color="rgb(var(--color-accent))" stop-opacity="0" />
              </linearGradient>
            </defs>
            @for (y of [30, 70, 110]; track y) {
              <line x1="0" x2="320" [attr.y1]="y" [attr.y2]="y" stroke="rgb(var(--color-line))" stroke-dasharray="3 5" />
            }
            <path d="M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20 L320 150 L0 150Z" fill="url(#heroFill)" />
            <path d="M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20" fill="none" stroke="rgb(var(--color-accent))" stroke-width="3" />
            <path d="M0 140 L150 140 L158 40 L320 36" fill="none" stroke="rgb(var(--color-magenta))" stroke-width="2" stroke-dasharray="5 5" />
          </svg>
          <div class="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
            <span class="flex items-center gap-2"><span class="h-1 w-5 rounded bg-accent"></span> Drip-feed</span>
            <span class="flex items-center gap-2"><span class="h-0.5 w-5 border-t-2 border-dashed border-magenta"></span> Pico artificial (evitamos)</span>
          </div>
        </div>
        <div class="absolute -bottom-6 -left-4 flex -rotate-3 items-center gap-2 rounded-xl bg-magenta px-4 py-2.5 text-sm font-semibold text-white shadow-glow-magenta sm:-left-8">
          <app-icon name="key" class="h-4 w-4" [stroke]="2.2" /> 0 senhas pedidas
        </div>
      </div>
    </div>
  `,
})
export class HeroSectionComponent {
  protected readonly stats = [
    { label: 'Pedidos entregues', value: '184k', highlight: false },
    { label: 'Retenção média', value: '97,8%', highlight: false },
    { label: 'Senhas pedidas', value: '0', highlight: true },
  ];
}
