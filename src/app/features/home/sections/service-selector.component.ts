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
  templateUrl: './service-selector.component.html',
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
