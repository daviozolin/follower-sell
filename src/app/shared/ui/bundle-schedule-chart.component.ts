import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { BundleDay } from '../../core/models';
import { IconComponent, IconName } from './icon.component';

type Metric = 'followers' | 'likes' | 'views';

/**
 * Cores de série validadas para o fundo escuro (faixa de luminosidade e separação para daltonismo).
 * O limão da marca é claro demais para marca de dado — por isso um tom mais escuro aqui.
 */
const SERIES: Array<{ key: Metric; label: string; icon: IconName; color: string }> = [
  { key: 'followers', label: 'Seguidores', icon: 'users', color: '#78A416' },
  { key: 'likes', label: 'Curtidas', icon: 'heart', color: '#FF2E93' },
  { key: 'views', label: 'Visualizações', icon: 'eye', color: '#1C9FD0' },
];

/**
 * Cronograma diário do combo em small multiples: uma linha por métrica, cada uma com a
 * própria escala (as grandezas são muito diferentes — nunca empilhar ou usar eixo duplo).
 */
@Component({
  selector: 'app-bundle-schedule-chart',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bundle-schedule-chart.component.html',
})
export class BundleScheduleChartComponent {
  readonly days = input.required<BundleDay[]>();
  protected readonly Math = Math;
  protected readonly hover = signal<{ key: Metric; day: number; value: number } | null>(null);

  protected readonly rows = computed(() =>
    SERIES.map((s) => {
      const values = this.days().map((d) => d[s.key]);
      return { ...s, values, max: Math.max(0, ...values) };
    }),
  );
}
