import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, IconComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container-page grid items-center gap-12 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
      <div class="animate-fade-up">
        <app-badge tone="success" [dot]="true" [pulse]="true">Sistema operacional · entregas ativas agora</app-badge>
        <h1 class="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          Crescimento que parece
          <span class="bg-gradient-to-r from-accent-soft via-accent to-success bg-clip-text text-transparent">orgânico</span>.
          Porque é entregue como tal.
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          Entrega gradual por <strong class="font-medium text-ink">drip-feed</strong>, que acompanha o ritmo natural do algoritmo.
          Sem senha, sem queda brusca e com reposição automática por 30 dias.
        </p>
        <div class="mt-9 flex flex-wrap items-center gap-3">
          <a routerLink="/" fragment="servicos" class="btn-primary">
            Escolher serviço <app-icon name="arrow-right" class="h-4 w-4" />
          </a>
          <a routerLink="/" fragment="seguranca" class="btn-ghost">
            <app-icon name="shield" class="h-4 w-4 text-success" /> Como garantimos a segurança
          </a>
        </div>
        <dl class="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line/60 pt-6">
          @for (stat of stats; track stat.label) {
            <div>
              <dt class="text-xs text-ink-faint">{{ stat.label }}</dt>
              <dd class="mt-1 text-2xl font-semibold tracking-tight">{{ stat.value }}</dd>
            </div>
          }
        </dl>
      </div>

      <!-- Visual: curva de entrega drip-feed vs. turbo -->
      <div class="card relative overflow-hidden p-6 animate-fade-up [animation-delay:120ms]">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-ink-faint">Novos seguidores · últimos 7 dias</p>
            <p class="mt-1 text-2xl font-semibold">+2.480 <span class="text-sm font-medium text-success">↑ estável</span></p>
          </div>
          <app-badge tone="accent"><app-icon name="drip" class="h-3 w-3" /> Drip-feed</app-badge>
        </div>
        <svg viewBox="0 0 320 150" class="mt-6 w-full" role="img" aria-label="Gráfico ilustrativo de crescimento gradual">
          <defs>
            <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgb(99 102 241)" stop-opacity="0.35" />
              <stop offset="100%" stop-color="rgb(99 102 241)" stop-opacity="0" />
            </linearGradient>
          </defs>
          @for (y of [30, 70, 110]; track y) {
            <line x1="0" x2="320" [attr.y1]="y" [attr.y2]="y" stroke="rgb(38 48 68)" stroke-dasharray="3 5" />
          }
          <path d="M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20 L320 150 L0 150Z" fill="url(#heroFill)" />
          <path d="M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20" fill="none" stroke="rgb(99 102 241)" stroke-width="2.5" />
          <path d="M0 140 L150 140 L158 40 L320 36" fill="none" stroke="rgb(244 91 105)" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7" />
        </svg>
        <div class="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
          <span class="flex items-center gap-2"><span class="h-0.5 w-5 rounded bg-accent"></span> Pulse drip-feed</span>
          <span class="flex items-center gap-2"><span class="h-0.5 w-5 rounded border-t border-dashed border-danger"></span> Pico artificial (evitamos)</span>
        </div>
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl"></div>
      </div>
    </section>
  `,
})
export class HeroSectionComponent {
  protected readonly stats = [
    { label: 'Pedidos entregues', value: '184 mil' },
    { label: 'Taxa de retenção', value: '97,8%' },
    { label: 'Senhas pedidas', value: '0' },
  ];
}
