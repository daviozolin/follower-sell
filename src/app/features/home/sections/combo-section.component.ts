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
  templateUrl: './combo-section.component.html',
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

