import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { hashString, seededRandom } from '../../core/utils/format';

const SIZE = 29;

/**
 * QR Code ILUSTRATIVO (mock): padrão determinístico a partir do payload, com
 * os três "finder patterns" de um QR real. Não é escaneável — substitua pela
 * imagem/base64 retornada pelo seu PSP na integração real.
 */
@Component({
  selector: 'app-qr-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'-2 -2 ' + (size + 4) + ' ' + (size + 4)" class="h-full w-full" shape-rendering="crispEdges" role="img"
         [attr.aria-label]="'QR Code ilustrativo do pagamento'">
      <rect x="-2" y="-2" [attr.width]="size + 4" [attr.height]="size + 4" rx="1.5" fill="#fff" />
      <path [attr.d]="path()" fill="#0B0F19" />
    </svg>
  `,
})
export class QrCodeComponent {
  readonly payload = input.required<string>();
  protected readonly size = SIZE;

  protected readonly path = computed(() => {
    const rand = seededRandom(hashString(this.payload()));
    const cells: string[] = [];
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= SIZE - 8 && y < 8) || (x < 8 && y >= SIZE - 8);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!inFinder(x, y) && rand() > 0.52) cells.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    for (const [ox, oy] of [[0, 0], [SIZE - 7, 0], [0, SIZE - 7]]) {
      cells.push(`M${ox} ${oy}h7v7h-7zM${ox + 1} ${oy + 1}v5h5v-5z`, `M${ox + 2} ${oy + 2}h3v3h-3z`);
    }
    return cells.join('');
  });
}
