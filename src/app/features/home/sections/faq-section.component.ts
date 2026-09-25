import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [IconComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-section.component.html',
})
export class FaqSectionComponent {
  protected readonly openIndex = signal<number | null>(0);

  protected readonly items: FaqItem[] = [
    {
      q: 'Por que a entrega gradual custa mais que a rápida?',
      a: 'Na entrega gradual, dividimos o pedido em pequenas partes e entregamos um pouco por dia, acompanhando e ajustando o ritmo o tempo todo. Dá mais trabalho do que entregar tudo de uma vez — em troca, o crescimento parece natural e é mais discreto.',
    },
    {
      q: 'Meu perfil pode ser banido?',
      a: 'Não pedimos senha nem acesso, então não há login suspeito na sua conta. A entrega gradual respeita ritmos compatíveis com crescimento orgânico, o que reduz drasticamente sinais de atividade atípica.',
    },
    {
      q: 'Meu perfil pode ficar escondido (shadowban)?',
      a: 'Shadowban é quando a rede esconde seus posts sem avisar. Isso costuma estar ligado a automações na própria conta, hashtags proibidas ou denúncias. Como nada é executado de dentro do seu perfil, o risco é mínimo. Para perfis novos, recomendamos o modo orgânico com ritmo diário baixo.',
    },
    {
      q: 'Quanto tempo leva para começar?',
      a: 'Na entrega rápida, começamos em até 15 minutos após o pagamento e terminamos em poucas horas. Na gradual, começamos em até 1 hora e entregamos um pouco por dia, no ritmo escolhido. Pix é aprovado em segundos; cartão, em até 2 minutos.',
    },
    {
      q: 'Como funciona a reposição?',
      a: 'Durante 30 dias após a conclusão, monitoramos o pedido. Se houver queda, você pode solicitar reposição com um clique na página de rastreio — sem custo e sem precisar abrir chamado.',
    },
    {
      q: 'Preciso deixar o perfil público?',
      a: 'Sim, durante toda a entrega. Perfis privados impedem a entrega e o pedido fica pausado até o perfil voltar a ser público.',
    },
    {
      q: 'Posso trocar o @ durante a entrega?',
      a: 'Não recomendamos. A troca de usuário interrompe a entrega e pode invalidar a garantia de reposição daquele pedido.',
    },
  ];

  protected toggle(i: number): void {
    this.openIndex.update((current) => (current === i ? null : i));
  }
}
