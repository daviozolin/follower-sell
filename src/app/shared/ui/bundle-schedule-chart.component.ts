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
  template: `
    <div class="space-y-4" role="group" aria-label="Cronograma diário de entrega do combo">
      @for (row of rows(); track row.key) {
        <div>
          <div class="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span class="flex items-center gap-1.5 font-medium text-ink">
              <span class="h-2 w-2 rounded-sm" [style.background]="row.color"></span>
              <app-icon [name]="row.icon" class="h-3.5 w-3.5 text-ink-muted" /> {{ row.label }}
            </span>
            <span class="font-mono tabular-nums text-ink-muted">
              @if (hover()?.key === row.key) {
                Dia {{ hover()!.day }} · <span class="text-ink">{{ hover()!.value | number }}</span>
              } @else {
                pico {{ row.max | number }}/dia
              }
            </span>
          </div>
          <div class="flex h-12 items-end gap-[2px]" (mouseleave)="hover.set(null)">
            @for (d of row.values; track $index) {
              <button type="button" class="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
                      [attr.aria-label]="'Dia ' + ($index + 1) + ': ' + d + ' ' + row.label.toLowerCase()"
                      (mouseenter)="hover.set({ key: row.key, day: $index + 1, value: d })"
                      (focus)="hover.set({ key: row.key, day: $index + 1, value: d })">
                <span class="block w-full rounded-t-[3px] transition-opacity duration-150"
                      [style.height.%]="row.max ? Math.max(4, (d / row.max) * 100) : 4"
                      [style.background]="row.color"
                      [style.opacity]="hover() && (hover()!.key !== row.key || hover()!.day !== $index + 1) ? 0.45 : 1"></span>
              </button>
            }
          </div>
        </div>
      }
      <div class="flex justify-between font-mono text-[10px] text-ink-faint">
        <span>Dia 1</span><span>Dia {{ days().length }}</span>
      </div>

      <details class="group text-xs text-ink-muted">
        <summary class="cursor-pointer select-none hover:text-ink">Ver cronograma em tabela</summary>
        <div class="mt-3 max-h-56 overflow-auto rounded-xl border border-line">
          <table class="w-full text-right font-mono tabular-nums">
            <thead class="sticky top-0 bg-surface-raised text-ink-faint">
              <tr><th class="px-3 py-2 text-left font-normal">Dia</th><th class="px-3 py-2 font-normal">Seguidores</th><th class="px-3 py-2 font-normal">Curtidas</th><th class="px-3 py-2 font-normal">Visualizações</th></tr>
            </thead>
            <tbody>
              @for (d of days(); track d.day) {
                <tr class="border-t border-line/60">
                  <td class="px-3 py-1.5 text-left">{{ d.day }}</td>
                  <td class="px-3 py-1.5">{{ d.followers | number }}</td>
                  <td class="px-3 py-1.5">{{ d.likes | number }}</td>
                  <td class="px-3 py-1.5">{{ d.views | number }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    </div>
  `,
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
