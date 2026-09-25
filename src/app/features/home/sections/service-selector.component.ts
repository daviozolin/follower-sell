import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PLATFORM_LABEL, Platform, SERVICE_LABEL, SERVICE_TYPES, ServiceType } from '../../../core/models';
import { OrderSelectionStore } from '../../../core/state/order-selection.store';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';
import { SegmentOption, SegmentedControlComponent } from '../../../shared/ui/segmented-control.component';

const SERVICE_META: Record<ServiceType, { icon: IconName; description: string }> = {
  followers: { icon: 'users', description: 'Perfis com foto e publicações seguindo você.' },
  likes: { icon: 'heart', description: 'Mais curtidas na publicação que você escolher.' },
  views: { icon: 'eye', description: 'Mais pessoas assistindo aos seus vídeos.' },
};

@Component({
  selector: 'app-service-selector',
  standalone: true,
  imports: [SegmentedControlComponent, IconComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <app-section-heading index="02" eyebrow="Serviços">
        <span title>Escolha a plataforma<br class="hidden sm:block" /> e o <span class="text-accent">objetivo</span>.</span>
        <span subtitle>Todos os serviços com garantia de reposição e sem acesso à conta.</span>
      </app-section-heading>
      <app-segmented-control class="w-full max-w-xs" ariaLabel="Plataforma" [options]="platformOptions"
                             [value]="store.platform()" (valueChange)="store.setPlatform($event)" />
    </div>

    <div role="radiogroup" aria-label="Tipo de serviço" class="mt-8 grid gap-3 sm:grid-cols-3">
      @for (service of services(); track service.value) {
        @let active = service.value === store.serviceType();
        <button type="button" role="radio" [attr.aria-checked]="active" (click)="store.setServiceType(service.value)"
                class="group card flex items-start gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50"
                [class]="active ? '!border-accent shadow-glow' : ''">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors"
                [class]="active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-canvas/60 text-ink-muted group-hover:text-ink'">
            <app-icon [name]="service.icon" class="h-5 w-5" />
          </span>
          <span>
            <span class="block font-semibold">{{ service.label }}</span>
            <span class="mt-1 block text-sm leading-snug text-ink-muted">{{ service.description }}</span>
          </span>
        </button>
      }
    </div>
  `,
})
export class ServiceSelectorComponent {
  protected readonly store = inject(OrderSelectionStore);

  protected readonly platformOptions: SegmentOption<Platform>[] = [
    { value: 'instagram', label: PLATFORM_LABEL.instagram, icon: 'instagram' },
    { value: 'tiktok', label: PLATFORM_LABEL.tiktok, icon: 'tiktok' },
  ];

  protected readonly services = computed(() =>
    SERVICE_TYPES.map((value) => ({ value, label: SERVICE_LABEL[value], ...SERVICE_META[value] })),
  );
}
