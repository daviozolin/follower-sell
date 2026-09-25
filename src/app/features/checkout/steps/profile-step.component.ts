import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, startWith, switchMap, tap } from 'rxjs';
import { PLATFORM_LABEL, ProfilePreview } from '../../../core/models';
import { BundleService } from '../../../core/services/bundle.service';
import { MockProfileService } from '../../../core/services/mock-profile.service';
import {
  emailValidator,
  postUrlValidator,
  sanitizeEmail,
  sanitizeHandle,
  sanitizeUrl,
  socialHandleValidator,
} from '../../../core/validators';
import { AvatarComponent } from '../../../shared/ui/avatar.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';
import { CheckoutStore } from '../checkout.store';

type LookupState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; profile: ProfilePreview }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-profile-step',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, IconComponent, AvatarComponent, BadgeComponent, TooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-6">
      <div>
        <h2 class="font-display text-2xl font-bold tracking-tight">Dados do {{ isProfile() ? 'perfil' : 'conteúdo' }}</h2>
        <p class="mt-1 text-sm text-ink-muted">
          @if (isProfile()) {
            Informe o &#64;usuario do {{ platformLabel() }}. Não pedimos senha.
          } @else {
            Cole o link da publicação do {{ platformLabel() }} que receberá o engajamento.
          }
        </p>
      </div>

      <div>
        <label for="target" class="label flex items-center gap-1.5">
          {{ isProfile() ? 'Usuário' : 'Link da publicação' }}
          <app-tooltip text="Usamos apenas dados públicos. Nunca solicitamos senha, código SMS ou acesso à sua conta." />
        </label>
        <div class="relative">
          @if (isProfile()) {
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-faint">&#64;</span>
          }
          <input id="target" formControlName="target" class="input font-mono" autocomplete="off" autocapitalize="none" spellcheck="false"
                 [class.pl-9]="isProfile()" [class.input-invalid]="showError('target')"
                 [attr.maxlength]="isProfile() ? 31 : 300"
                 [placeholder]="isProfile() ? 'seuperfil' : examplePostUrl()" (blur)="normalizeTarget()"
                 [attr.aria-invalid]="showError('target')" aria-describedby="target-hint" />
          @if (lookup().kind === 'loading') {
            <app-icon name="loader" class="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent-soft" />
          }
        </div>
        <p id="target-hint" class="field-error" [class.invisible]="!showError('target')">{{ targetError() }}</p>
      </div>

      <!-- Preview do perfil (mock de busca pública) -->
      @switch (lookup().kind) {
        @case ('loading') {
          <div class="flex animate-pulse items-center gap-4 rounded-xl border border-line bg-canvas/40 p-4">
            <div class="h-12 w-12 rounded-full bg-surface-raised"></div>
            <div class="flex-1 space-y-2"><div class="h-3 w-1/3 rounded bg-surface-raised"></div><div class="h-3 w-1/2 rounded bg-surface-raised"></div></div>
          </div>
        }
        @case ('found') {
          @if (foundProfile(); as p) {
            <div class="flex animate-fade-up items-center gap-4 rounded-xl border p-4"
                 [class]="p.isPrivate ? 'border-danger/40 bg-danger/5' : 'border-success/40 bg-success/5'">
              <app-avatar class="h-12 w-12" [name]="p.displayName" [hue]="p.avatarHue" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ p.displayName }}</p>
                <p class="truncate font-mono text-xs text-ink-muted">&#64;{{ p.handle }} · {{ p.followers | number }} seguidores · {{ p.posts }} posts</p>
              </div>
              @if (p.isPrivate) {
                <app-badge tone="danger"><app-icon name="lock" class="h-3 w-3" /> Privado</app-badge>
              } @else {
                <app-badge tone="success"><app-icon name="globe" class="h-3 w-3" /> Público</app-badge>
              }
            </div>
            @if (p.isPrivate) {
              <p class="flex items-start gap-2 text-sm text-danger">
                <app-icon name="alert" class="mt-0.5 h-4 w-4" />
                Este perfil está privado. Torne-o público nas configurações do app e busque novamente.
              </p>
            }
            @if (comboFit(); as fit) {
              @if (fit.compatible) {
                <p class="flex animate-fade-up items-center gap-2 text-sm text-accent">
                  <app-icon name="check-circle" class="h-4 w-4" />
                  Combo {{ fit.current }} compatível com o tamanho deste perfil.
                </p>
              } @else {
                <div class="animate-fade-up rounded-xl border border-magenta/50 bg-magenta/5 p-4">
                  <p class="flex items-start gap-2 text-sm">
                    <app-icon name="sparkles" class="mt-0.5 h-4 w-4 text-magenta" />
                    <span>
                      O combo foi simulado para {{ fit.simulatedBase | number }} seguidores, mas este perfil tem
                      <strong>{{ p.followers | number }}</strong>. Para parecer orgânico, recomendamos o
                      <strong class="text-magenta-soft">Combo {{ fit.suggested.tier.name }}</strong>
                      (+{{ fit.suggested.followers | number }} seguidores · {{ fit.suggested.total | currency }}).
                    </span>
                  </p>
                  <button type="button" class="btn-magenta mt-3 !py-2 text-xs" (click)="store.setComboBase(p.followers)">
                    Ajustar plano ao meu perfil
                  </button>
                </div>
              }
            }
          }
        }
        @case ('error') {
          <p class="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
            <app-icon name="alert" class="h-4 w-4" /> {{ lookupError() }}
          </p>
        }
      }

      @if (!isProfile() && form.controls.target.valid && form.controls.target.value) {
        <div class="flex animate-fade-up items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-4 text-sm">
          <app-icon [name]="store.platform()" class="h-5 w-5 text-success" />
          <span class="text-ink-muted">Link de publicação válido.</span>
          <app-badge class="ml-auto" tone="success">Verificado</app-badge>
        </div>
      }

      <div>
        <label for="email" class="label">E-mail para acompanhamento</label>
        <input id="email" type="email" formControlName="email" class="input" autocomplete="email" placeholder="voce@email.com"
               maxlength="254" [class.input-invalid]="showError('email')" (blur)="normalizeEmail()" [attr.aria-invalid]="showError('email')" />
        <p class="field-error" [class.invisible]="!showError('email')">Informe um e-mail válido.</p>
      </div>

      <button type="submit" class="btn-primary w-full" [disabled]="!canContinue()">
        Continuar <app-icon name="arrow-right" class="h-4 w-4" />
      </button>
      <p class="text-center text-xs text-ink-faint">Ambiente de teste: use um &#64; com "privado" ou "naoexiste" para testar os estados.</p>
    </form>
  `,
})
export class ProfileStepComponent {
  protected readonly store = inject(CheckoutStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly profiles = inject(MockProfileService);
  private readonly bundles = inject(BundleService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly platform = () => this.store.platform();
  protected readonly isProfile = computed(() => this.store.targetKind() === 'profile');
  protected readonly platformLabel = computed(() => PLATFORM_LABEL[this.store.platform()]);
  protected readonly examplePostUrl = computed(() =>
    this.platform() === 'instagram' ? 'https://www.instagram.com/p/C1a2B3c4D5e/' : 'https://www.tiktok.com/@perfil/video/7312345678901234567',
  );

  protected readonly form = this.fb.group({
    target: [
      this.store.profile()?.target ?? '',
      [
        Validators.required,
        this.isProfile() ? socialHandleValidator(this.platform) : postUrlValidator(this.platform),
      ],
    ],
    email: [this.store.profile()?.email ?? '', [Validators.required, emailValidator]],
  });

  protected readonly lookup = signal<LookupState>(
    this.store.profile()?.preview ? { kind: 'found', profile: this.store.profile()!.preview! } : { kind: 'idle' },
  );
  protected readonly foundProfile = computed(() => {
    const l = this.lookup();
    return l.kind === 'found' ? l.profile : null;
  });
  /**
   * Combo: compara a base real do perfil com a simulada. Fora da mesma faixa ou
   * com diferença > 30%, sugere recalcular o plano.
   */
  protected readonly comboFit = computed(() => {
    const plan = this.store.bundle();
    const profile = this.foundProfile();
    if (!plan || !profile || profile.isPrivate) return null;
    const suggested = this.bundles.plan(plan.platform, profile.followers, plan.pace);
    const drift = Math.abs(profile.followers - plan.baseFollowers) / Math.max(1, profile.followers);
    return {
      compatible: suggested.tier.id === plan.tier.id && drift <= 0.3,
      current: plan.tier.name,
      simulatedBase: plan.baseFollowers,
      suggested,
    };
  });

  protected readonly lookupError = computed(() => {
    const l = this.lookup();
    return l.kind === 'error' ? l.message : '';
  });

  /** Status do form como signal (Reactive Forms ainda não expõe signals nativamente). */
  private readonly formValid = signal(this.form.valid);

  protected readonly canContinue = computed(() => {
    if (!this.formValid()) return false;
    if (!this.isProfile()) return true;
    const p = this.foundProfile();
    return !!p && !p.isPrivate;
  });

  constructor() {
    this.form.statusChanges
      .pipe(startWith(this.form.status), takeUntilDestroyed())
      .subscribe(() => this.formValid.set(this.form.valid));

    if (this.isProfile()) this.watchHandleLookup();
  }

  /** Busca simulada do perfil: debounce → só handles válidos → cancela buscas anteriores. */
  private watchHandleLookup(): void {
    const control = this.form.controls.target;
    control.valueChanges
      .pipe(
        map((v) => sanitizeHandle(v)),
        debounceTime(550),
        distinctUntilChanged(),
        tap(() => this.lookup.set({ kind: 'idle' })),
        filter((handle) => !!handle && control.valid),
        tap(() => this.lookup.set({ kind: 'loading' })),
        switchMap((handle) =>
          this.profiles.lookup(this.platform(), handle).pipe(
            map((profile): LookupState => ({ kind: 'found', profile })),
            catchError((err: Error) => of<LookupState>({ kind: 'error', message: err.message })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.lookup.set(state));
  }

  protected showError(name: 'target' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected targetError(): string {
    const errors = this.form.controls.target.errors;
    if (!errors) return '';
    if (errors['required']) return this.isProfile() ? 'Informe o @usuario.' : 'Informe o link da publicação.';
    if (errors['handle']) {
      return this.platform() === 'instagram'
        ? 'Usuário inválido: até 30 caracteres, letras, números, "." e "_" (sem pontos seguidos ou no fim).'
        : 'Usuário inválido: 2 a 24 caracteres, letras, números, "." e "_".';
    }
    if (errors['postUrl']) return `Link inválido. Exemplo: ${this.examplePostUrl()}`;
    return 'Valor inválido.';
  }

  protected normalizeTarget(): void {
    const c = this.form.controls.target;
    const clean = this.isProfile() ? sanitizeHandle(c.value) : sanitizeUrl(c.value);
    if (clean !== c.value) c.setValue(clean);
  }

  protected normalizeEmail(): void {
    const c = this.form.controls.email;
    const clean = sanitizeEmail(c.value);
    if (clean !== c.value) c.setValue(clean);
  }

  protected submit(): void {
    this.normalizeTarget();
    this.normalizeEmail();
    this.form.markAllAsTouched();
    if (!this.canContinue()) return;
    const { target, email } = this.form.getRawValue();
    this.store.saveProfile({ target, email, preview: this.foundProfile() });
  }
}
