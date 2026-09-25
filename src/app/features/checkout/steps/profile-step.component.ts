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
  templateUrl: './profile-step.component.html',
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
