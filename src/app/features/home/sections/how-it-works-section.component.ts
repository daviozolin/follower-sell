import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';

/** Explicação do processo em linguagem simples, para quem nunca comprou algo assim. */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [IconComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-heading index="01" eyebrow="Como funciona">
      <span title>Simples assim.<br /><span class="title-accent text-accent">4 passos</span>, sem senha.</span>
      <span subtitle>Você não precisa entender de algoritmo. A gente cuida do ritmo para o crescimento parecer natural.</span>
    </app-section-heading>

    <ol class="relative mt-14 grid gap-4 md:grid-cols-4">
      <span aria-hidden="true" class="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-accent via-magenta to-accent/0 md:block"></span>
      @for (step of steps; track step.title; let i = $index) {
        <li class="relative rounded-3xl border border-line bg-surface/70 p-6">
          <div class="flex items-center gap-3">
            <span class="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl font-display text-xl font-extrabold"
                  [class]="i === 3 ? 'bg-magenta text-white' : 'bg-accent text-accent-ink'">{{ i + 1 }}</span>
            <app-icon [name]="step.icon" class="h-5 w-5 text-ink-muted" />
          </div>
          <h3 class="mt-5 font-display text-xl font-bold tracking-tight">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-ink-muted">{{ step.text }}</p>
        </li>
      }
    </ol>
  `,
})
export class HowItWorksSectionComponent {
  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    { icon: 'package', title: 'Escolha o que quer', text: 'Seguidores, curtidas, visualizações — ou um combo com os três, na medida do seu perfil.' },
    { icon: 'users', title: 'Informe seu @', text: 'Só o nome do perfil (ou o link do post). Nunca pedimos senha nem acesso à sua conta.' },
    { icon: 'qr', title: 'Pague com Pix ou cartão', text: 'Pix aprova na hora. Você recebe o código do pedido por e-mail.' },
    { icon: 'trending', title: 'Acompanhe crescer', text: 'Entregamos aos poucos e você vê o progresso em tempo real. Se algo cair em 30 dias, repomos.' },
  ];
}
