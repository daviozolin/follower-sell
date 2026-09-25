import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';

/** Explicação do processo em linguagem simples, para quem nunca comprou algo assim. */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [IconComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-it-works-section.component.html',
})
export class HowItWorksSectionComponent {
  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    { icon: 'package', title: 'Escolha o que quer', text: 'Seguidores, curtidas, visualizações — ou um combo com os três, na medida do seu perfil.' },
    { icon: 'users', title: 'Informe seu @', text: 'Só o nome do perfil (ou o link do post). Nunca pedimos senha nem acesso à sua conta.' },
    { icon: 'qr', title: 'Pague com Pix ou cartão', text: 'Pix aprova na hora. Você recebe o código do pedido por e-mail.' },
    { icon: 'trending', title: 'Acompanhe crescer', text: 'Entregamos aos poucos e você vê o progresso em tempo real. Se algo cair em 30 dias, repomos.' },
  ];
}
