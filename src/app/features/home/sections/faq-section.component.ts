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
  template: `
    <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div class="lg:sticky lg:top-28 lg:self-start">
        <app-section-heading index="06" eyebrow="Dúvidas">
          <span title>Perguntas <span class="text-magenta">sem</span> letras miúdas.</span>
          <span subtitle>Riscos, prazos e garantias explicados de forma direta.</span>
        </app-section-heading>
      </div>
      <div class="space-y-3">
        @for (item of items; track item.q; let i = $index) {
          @let open = openIndex() === i;
          <div class="overflow-hidden rounded-2xl border bg-surface/80 transition-all duration-300"
               [class]="open ? 'border-magenta/60 shadow-glow-magenta' : 'border-line hover:border-ink-faint'">
            <h3>
              <button type="button" class="flex w-full items-center gap-4 p-5 text-left font-display text-lg font-semibold tracking-tight"
                      [attr.aria-expanded]="open" [attr.aria-controls]="'faq-' + i" (click)="toggle(i)">
                <span class="font-mono text-xs font-normal text-ink-faint">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <span class="flex-1">{{ item.q }}</span>
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
                      [class]="open ? 'rotate-180 border-magenta bg-magenta text-white' : 'border-line text-ink-faint'">
                  <app-icon name="chevron-down" class="h-4 w-4" [stroke]="2.2" />
                </span>
              </button>
            </h3>
            <div [id]="'faq-' + i" role="region" class="grid transition-[grid-template-rows] duration-300 ease-out"
                 [style.grid-template-rows]="open ? '1fr' : '0fr'">
              <div class="overflow-hidden">
                <p class="pb-6 pl-[3.25rem] pr-6 text-sm leading-relaxed text-ink-muted">{{ item.a }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
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
