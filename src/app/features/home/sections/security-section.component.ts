import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';

@Component({
  selector: 'app-security-section',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center">
      <p class="eyebrow">Segurança &amp; transparência</p>
      <h2 class="section-title mx-auto mt-2 max-w-2xl">Nós nunca pedimos sua senha. Nunca.</h2>
      <p class="mx-auto mt-4 max-w-2xl text-ink-muted">
        Só precisamos do seu <span class="font-mono text-ink">&#64;usuario</span> ou do link da publicação — as mesmas informações que qualquer visitante vê.
        Se alguém pedir sua senha em nosso nome, é golpe.
      </p>
    </div>

    <div class="mt-12 grid gap-4 md:grid-cols-3">
      @for (pillar of pillars; track pillar.title) {
        <div class="card p-6 transition-colors hover:border-success/40">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
            <app-icon [name]="pillar.icon" class="h-5 w-5" />
          </span>
          <h3 class="mt-5 font-semibold">{{ pillar.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-ink-muted">{{ pillar.text }}</p>
        </div>
      }
    </div>

    <div class="card mt-4 grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h3 class="text-lg font-semibold">Checklist antes de comprar</h3>
        <p class="mt-2 text-sm text-ink-muted">Para a entrega funcionar sem interrupções, seu perfil precisa atender:</p>
      </div>
      <ul class="grid gap-3 sm:grid-cols-2">
        @for (item of checklist; track item.text) {
          <li class="flex items-start gap-3 rounded-xl border border-line bg-canvas/40 p-3 text-sm">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  [class]="item.ok ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'">
              <app-icon [name]="item.ok ? 'check' : 'x'" class="h-3 w-3" [stroke]="3" />
            </span>
            <span class="text-ink-muted">{{ item.text }}</span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class SecuritySectionComponent {
  protected readonly pillars: { icon: IconName; title: string; text: string }[] = [
    { icon: 'key', title: 'Zero acesso à conta', text: 'Não pedimos senha, código SMS ou login. Sua conta permanece 100% sob seu controle.' },
    { icon: 'drip', title: 'Entrega gradual', text: 'O drip-feed distribui o volume ao longo dos dias, respeitando limites e evitando picos.' },
    { icon: 'refresh', title: 'Reposição garantida', text: 'Qualquer queda nos primeiros 30 dias é reposta automaticamente ou sob solicitação.' },
  ];

  protected readonly checklist = [
    { ok: true, text: 'Perfil público durante toda a entrega' },
    { ok: true, text: '@usuario correto e sem alterações até concluir' },
    { ok: true, text: 'Publicação disponível (para curtidas e views)' },
    { ok: false, text: 'Nunca envie sua senha ou códigos de verificação' },
  ];
}
