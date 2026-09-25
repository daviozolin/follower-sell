import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BUNDLE_PACE_LABEL, BundlePace, BundlePlan, BundleTier, PLATFORM_LABEL, Platform } from '../../../core/models';
import { BundleService } from '../../../core/services/bundle.service';
import { MockProfileService } from '../../../core/services/mock-profile.service';
import { OrderSelectionStore } from '../../../core/state/order-selection.store';
import { digitsOnly, sanitizeHandle, socialHandleValidator } from '../../../core/validators';
import { compactNumber } from '../../../core/utils/format';
import { BundleScheduleChartComponent } from '../../../shared/ui/bundle-schedule-chart.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';
import { SegmentOption, SegmentedControlComponent } from '../../../shared/ui/segmented-control.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';

const MAX_BASE = 5_000_000;

@Component({
  selector: 'app-combo-section',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    IconComponent,
    SectionHeadingComponent,
    SegmentedControlComponent,
    TooltipComponent,
    BundleScheduleChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <app-section-heading index="03" eyebrow="Combos orgânicos">
        <span title>Seguidores, curtidas e visualizações<br class="hidden sm:block" /><span class="text-magenta"> no mesmo compasso.</span></span>
        <span subtitle>
          Um perfil que ganha seguidores mas ninguém curte parece falso. O combo entrega os três juntos,
          na medida certa para o tamanho do seu perfil — como acontece com quem cresce de verdade.
        </span>
      </app-section-heading>
      <app-segmented-control class="w-full max-w-xs shrink-0" ariaLabel="Plataforma do combo" [options]="platformOptions"
                             [value]="selection.platform()" (valueChange)="selection.setPlatform($event)" />
    </div>

    <!-- Recomendador -->
    <div class="mt-12 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div class="rounded-3xl border border-line bg-canvas/70 p-6 sm:p-8">
        <label for="combo-base" class="font-display text-2xl font-bold tracking-tight">Quantos seguidores você tem hoje?</label>
        <p class="mt-2 text-sm text-ink-muted">Calibramos o volume para parecer crescimento natural da sua base atual.</p>

        <div class="relative mt-6">
          <input id="combo-base" inputmode="numeric" class="input !py-4 pr-28 font-display !text-3xl font-bold tabular-nums"
                 [value]="baseLabel()" (input)="onBaseInput($event)" (blur)="onBaseBlur($event)" aria-describedby="combo-base-hint" />
          <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">seguidores</span>
        </div>
        <div id="combo-base-hint" class="mt-3 flex flex-wrap gap-2">
          @for (preset of presets; track preset) {
            <button type="button" (click)="setBase(preset)"
                    class="rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors"
                    [class]="base() === preset ? 'border-magenta bg-magenta/10 text-magenta-soft' : 'border-line text-ink-muted hover:border-ink-faint'">
              {{ compact(preset) }}
            </button>
          }
        </div>

        <form class="mt-6 border-t border-line/70 pt-6" [formGroup]="lookupForm" (ngSubmit)="lookup()" novalidate>
          <label for="combo-handle" class="label">Ou busque pelo &#64;usuario</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-faint">&#64;</span>
              <input id="combo-handle" formControlName="handle" class="input pl-9 font-mono" autocomplete="off" autocapitalize="none"
                     spellcheck="false" maxlength="31" placeholder="seuperfil" />
            </div>
            <button type="submit" class="btn-ghost shrink-0" [disabled]="lookingUp()">
              @if (lookingUp()) { <app-icon name="loader" class="h-4 w-4 animate-spin" /> } @else { <app-icon name="search" class="h-4 w-4" /> }
              Buscar
            </button>
          </div>
          @if (lookupMessage(); as msg) {
            <p class="mt-2 text-xs" [class]="msg.ok ? 'text-accent' : 'text-danger'">{{ msg.text }}</p>
          }
        </form>

        <div class="mt-6 border-t border-line/70 pt-6">
          <p class="label flex items-center gap-1.5">
            Ritmo
            <app-tooltip text="Intenso conclui mais rápido (−7%). Suave espalha por mais dias, com mais orquestração (+8%). Natural é o recomendado." />
          </p>
          <app-segmented-control ariaLabel="Ritmo do combo" [options]="paceOptions" [value]="pace()" (valueChange)="pace.set($event)" />
        </div>

        <div class="mt-6 rounded-2xl border border-line bg-surface/60 p-5">
          <p class="font-display text-lg font-bold tracking-tight">Por que esse tamanho?</p>
          <ul class="mt-3 space-y-2.5 text-sm text-ink-muted">
            <li class="flex gap-2.5"><app-icon name="users" class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>Perfis pequenos podem crescer mais rápido; perfis grandes, em passos menores. Aqui: <strong class="text-ink">+{{ plan().growthPct }}%</strong>.</span></li>
            <li class="flex gap-2.5"><app-icon name="heart" class="mt-0.5 h-4 w-4 shrink-0 text-magenta" />
              <span>Curtidas e visualizações acompanham o novo número de seguidores, para os posts não parecerem "vazios".</span></li>
            <li class="flex gap-2.5"><app-icon name="clock" class="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span>Tudo espalhado em <strong class="text-ink">{{ plan().durationDays }} dias</strong>, sem picos que chamam atenção.</span></li>
          </ul>
        </div>
      </div>

      <!-- Plano recomendado -->
      @let p = plan();
      <article class="relative overflow-hidden rounded-3xl border-2 border-magenta bg-surface p-6 shadow-glow-magenta sm:p-8" aria-live="polite">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span class="inline-flex -rotate-1 rounded-md bg-magenta px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Recomendado para você
            </span>
            <h3 class="display mt-3 text-4xl">Combo {{ p.tier.name }}</h3>
            <p class="mt-1 text-sm text-ink-muted">{{ platformLabel() }} · {{ p.tier.tagline }}</p>
          </div>
          <div class="text-right">
            <p class="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">Crescimento projetado</p>
            <p class="mt-1 font-display text-xl font-bold tabular-nums">
              {{ compact(p.baseFollowers) }} <span class="text-ink-faint">→</span> <span class="text-accent">{{ compact(p.projectedFollowers) }}</span>
            </p>
            <p class="text-xs text-ink-muted">+{{ p.growthPct }}% em {{ p.durationDays }} dias</p>
          </div>
        </div>

        <ul class="mt-6 grid gap-3 sm:grid-cols-3">
          @for (c of components(); track c.service) {
            <li class="rounded-2xl border border-line bg-canvas/60 p-4">
              <p class="flex items-center gap-1.5 text-xs text-ink-muted"><app-icon [name]="c.icon" class="h-3.5 w-3.5" /> {{ c.label }}</p>
              <p class="display mt-1 text-3xl tabular-nums">+{{ c.amount | number }}</p>
              <p class="mt-1 text-xs text-ink-faint">{{ c.detail }}</p>
            </li>
          }
        </ul>

        <div class="mt-6 rounded-2xl border border-line bg-canvas/60 p-4">
          <p class="mb-3 text-xs text-ink-muted">Como a entrega fica, dia a dia: seguidores chegam aos poucos; curtidas e visualizações sobem quando há post novo — igual a um perfil que cresce de verdade.</p>
          <app-bundle-schedule-chart [days]="p.schedule" />
        </div>

        <div class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm text-ink-faint">
              Avulso <span class="line-through">{{ p.standaloneTotal | currency }}</span>
              · <span class="font-medium text-accent">economize {{ p.savings | currency }}</span>
            </p>
            <p class="display mt-1 text-5xl tabular-nums">{{ p.total | currency }}</p>
            <p class="mt-1 text-xs text-ink-faint">
              Combo −{{ p.discountPct }}%
              @if (p.paceAdjustmentPct) { · ritmo {{ paceLabel() }} {{ p.paceAdjustmentPct > 0 ? '+' : '' }}{{ p.paceAdjustmentPct }}% }
              · garantia 30 dias
            </p>
          </div>
          <button type="button" class="btn-magenta !px-6 !py-3.5 text-base" (click)="checkout(p.baseFollowers)">
            Quero este combo <app-icon name="arrow-right" class="h-4 w-4" [stroke]="2.4" />
          </button>
        </div>
      </article>
    </div>

    <!-- Planos fixos por faixa -->
    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      @for (t of tierCards(); track t.tier.id) {
        @let current = t.tier.id === p.tier.id;
        <button type="button" (click)="setBase(t.tier.referenceBase)"
                class="group rounded-3xl border bg-canvas/60 p-6 text-left transition-all duration-200 hover:-translate-y-1"
                [class]="current ? 'border-magenta/70' : 'border-line hover:border-ink-faint'" [attr.aria-pressed]="current">
          <div class="flex items-center justify-between">
            <p class="font-display text-2xl font-extrabold tracking-tight">{{ t.tier.name }}</p>
            @if (current) { <span class="h-2 w-2 rounded-full bg-magenta"></span> }
          </div>
          <p class="mt-1 text-xs text-ink-faint">Perfis com {{ rangeLabel(t.tier) }} seguidores</p>
          <dl class="mt-5 space-y-1.5 text-sm">
            <div class="flex justify-between"><dt class="text-ink-muted">Seguidores</dt><dd class="font-mono tabular-nums">+{{ t.plan.followers | number }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Curtidas</dt><dd class="font-mono tabular-nums">+{{ t.plan.likes | number }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Visualizações</dt><dd class="font-mono tabular-nums">+{{ t.plan.views | number }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Duração</dt><dd class="font-mono tabular-nums">{{ t.plan.durationDays }} dias</dd></div>
          </dl>
          <p class="mt-5 text-xs text-ink-faint">a partir de</p>
          <p class="font-display text-2xl font-bold tracking-tight">{{ t.plan.total | currency }}</p>
          <p class="mt-4 flex items-center gap-1 text-xs font-medium text-ink-muted group-hover:text-ink">
            Simular com {{ compact(t.tier.referenceBase) }} <app-icon name="arrow-right" class="h-3 w-3" />
          </p>
        </button>
      }
    </div>
  `,
})
export class ComboSectionComponent {
  protected readonly selection = inject(OrderSelectionStore);
  private readonly bundles = inject(BundleService);
  private readonly profiles = inject(MockProfileService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly presets = [500, 2_000, 5_000, 10_000, 50_000, 150_000];
  protected readonly base = signal(5_000);
  protected readonly pace = signal<BundlePace>('natural');
  protected readonly compact = compactNumber;

  protected readonly plan = computed<BundlePlan>(() => this.bundles.plan(this.selection.platform(), this.base(), this.pace()));
  protected readonly baseLabel = computed(() => this.base().toLocaleString('pt-BR'));
  protected readonly platformLabel = computed(() => PLATFORM_LABEL[this.selection.platform()]);
  protected readonly paceLabel = computed(() => BUNDLE_PACE_LABEL[this.pace()].toLowerCase());

  protected readonly components = computed(() => {
    const p = this.plan();
    const postNoun = p.platform === 'instagram' ? 'posts' : 'vídeos';
    const reelNoun = 'vídeos';
    const [f, l, v] = p.components;
    return [
      { service: 'followers', label: 'Seguidores', icon: 'users' as const, amount: f.amount, detail: `~${Math.round(f.amount / p.durationDays)}/dia com variação natural` },
      { service: 'likes', label: 'Curtidas', icon: 'heart' as const, amount: l.amount, detail: `${l.perPost?.toLocaleString('pt-BR')} em cada um dos ${l.posts} últimos ${postNoun}` },
      { service: 'views', label: 'Visualizações', icon: 'eye' as const, amount: v.amount, detail: `${v.perPost?.toLocaleString('pt-BR')} em cada um dos ${v.posts} últimos ${reelNoun}` },
    ];
  });

  protected readonly tierCards = computed(() =>
    this.bundles.tiers.map((tier) => ({ tier, plan: this.bundles.plan(this.selection.platform(), tier.referenceBase, 'natural') })),
  );

  protected readonly platformOptions: SegmentOption<Platform>[] = [
    { value: 'instagram', label: PLATFORM_LABEL.instagram, icon: 'instagram' },
    { value: 'tiktok', label: PLATFORM_LABEL.tiktok, icon: 'tiktok' },
  ];
  protected readonly paceOptions: SegmentOption<BundlePace>[] = [
    { value: 'intense', label: 'Intenso' },
    { value: 'natural', label: 'Natural' },
    { value: 'gentle', label: 'Suave' },
  ];

  // --- busca pelo @ (mock) -------------------------------------------------
  protected readonly lookupForm = this.fb.group({
    handle: ['', [Validators.required, socialHandleValidator(() => this.selection.platform())]],
  });
  protected readonly lookingUp = signal(false);
  protected readonly lookupMessage = signal<{ ok: boolean; text: string } | null>(null);

  protected lookup(): void {
    const control = this.lookupForm.controls.handle;
    control.setValue(sanitizeHandle(control.value));
    if (control.invalid) {
      this.lookupMessage.set({ ok: false, text: 'Informe um @usuario válido.' });
      return;
    }
    this.lookingUp.set(true);
    this.profiles
      .lookup(this.selection.platform(), control.value)
      .pipe(finalize(() => this.lookingUp.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.setBase(profile.followers);
          this.lookupMessage.set({
            ok: !profile.isPrivate,
            text: profile.isPrivate
              ? `@${profile.handle} está privado — torne-o público antes da entrega.`
              : `@${profile.handle} tem ${profile.followers.toLocaleString('pt-BR')} seguidores. Plano ajustado.`,
          });
        },
        error: (err: Error) => this.lookupMessage.set({ ok: false, text: err.message }),
      });
  }

  // --- base -----------------------------------------------------------------
  protected setBase(value: number): void {
    this.base.set(Math.min(MAX_BASE, Math.max(0, Math.round(value))));
  }

  protected onBaseInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = digitsOnly(input.value).slice(0, 7);
    this.setBase(Number(digits || 0));
  }

  protected onBaseBlur(event: Event): void {
    (event.target as HTMLInputElement).value = this.baseLabel();
  }

  protected rangeLabel(t: BundleTier): string {
    return t.maxFollowers === null ? `${compactNumber(t.minFollowers)}+` : `${compactNumber(t.minFollowers)}–${compactNumber(t.maxFollowers)}`;
  }

  protected checkout(base: number): void {
    this.router.navigate(['/checkout'], {
      queryParams: { combo: 1, platform: this.selection.platform(), base, pace: this.pace() },
    });
  }
}

