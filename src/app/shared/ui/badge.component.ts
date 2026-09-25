import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'accent' | 'magenta' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  accent: 'border-accent/35 bg-accent/10 text-accent',
  magenta: 'border-magenta/40 bg-magenta/10 text-magenta-soft',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  neutral: 'border-line bg-surface-raised/60 text-ink-muted',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide"
          [class]="toneClass()">
      @if (dot()) {
        <span class="relative flex h-1.5 w-1.5">
          @if (pulse()) {
            <span class="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-current"></span>
          }
          <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-current"></span>
        </span>
      }
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
  readonly dot = input(false);
  readonly pulse = input(false);
  protected readonly toneClass = computed(() => TONES[this.tone()]);
}
