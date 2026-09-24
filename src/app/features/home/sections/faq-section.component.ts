import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon.component';

interface FaqItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p class="eyebrow">FAQ</p>
        <h2 class="section-title mt-2">Dúvidas frequentes</h2>
        <p class="mt-4 text-ink-muted">Transparência sobre riscos, prazos e garantias — sem letras miúdas.</p>
      </div>
      <div class="space-y-3">
        @for (item of items; track item.q; let i = $index) {
          @let open = openIndex() === i;
          <div class="card overflow-hidden transition-colors" [class]="open ? '!border-accent/50' : ''">
            <h3>
              <button type="button" class="flex w-full items-center justify-between gap-4 p-5 text-left font-medium"
                      [attr.aria-expanded]="open" [attr.aria-controls]="'faq-' + i" (click)="toggle(i)">
                {{ item.q }}
                <app-icon name="chevron-down" class="h-5 w-5 text-ink-faint transition-transform duration-300" [class.rotate-180]="open" />
              </button>
            </h3>
            <div [id]="'faq-' + i" role="region" class="grid transition-[grid-template-rows] duration-300 ease-out"
                 [style.grid-template-rows]="open ? '1fr' : '0fr'">
              <div class="overflow-hidden">
                <p class="px-5 pb-5 text-sm leading-relaxed text-ink-muted">{{ item.a }}</p>
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
      q: 'Meu perfil pode ser banido?',
      a: 'Não pedimos senha nem acesso, então não há login suspeito na sua conta. A entrega gradual (drip-feed) respeita ritmos compatíveis com crescimento orgânico, o que reduz drasticamente sinais de atividade atípica.',
    },
    {
      q: 'E o shadowban?',
      a: 'Shadowban costuma estar ligado a automações na própria conta, hashtags proibidas ou denúncias. Como nada é executado de dentro do seu perfil, o risco é mínimo. Para perfis novos, recomendamos o modo orgânico com ritmo diário baixo.',
    },
    {
      q: 'Quanto tempo leva para começar?',
      a: 'No modo turbo, a entrega inicia em até 15 minutos após a aprovação do pagamento. No modo orgânico, em até 1 hora, seguindo o ritmo diário escolhido. Pix é aprovado em segundos; cartão, em até 2 minutos.',
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
