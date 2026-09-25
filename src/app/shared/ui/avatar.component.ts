import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Avatar gerado (iniciais + gradiente), evitando buscar imagens de terceiros. */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly hue = input(240);
  protected readonly initials = computed(() =>
    this.name().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
  );
  protected readonly background = computed(
    () => `linear-gradient(135deg, hsl(${this.hue()} 85% 58%), hsl(${(this.hue() + 70) % 360} 90% 45%))`,
  );
}
