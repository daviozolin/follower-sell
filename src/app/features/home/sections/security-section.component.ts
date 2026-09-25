import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';

/** Seção invertida: renderizada sobre fundo limão (ver home.page). */
@Component({
  selector: 'app-security-section',
  standalone: true,
  imports: [IconComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './security-section.component.html',
})
export class SecuritySectionComponent {
  protected readonly pillars: { icon: IconName; title: string; text: string }[] = [
    { icon: 'key', title: 'Zero acesso à conta', text: 'Não pedimos senha, código SMS ou login. Sua conta permanece 100% sob seu controle.' },
    { icon: 'drip', title: 'Entrega no seu ritmo', text: 'Entrega rápida para quem tem pressa, gradual para crescer aos poucos — sempre dentro dos limites das redes.' },
    { icon: 'refresh', title: 'Reposição garantida', text: 'Qualquer queda nos primeiros 30 dias é reposta automaticamente ou sob solicitação.' },
  ];

  protected readonly tilt = ['md:-rotate-1', '', 'md:rotate-1'];

  protected readonly checklist = [
    { ok: true, text: 'Perfil público durante toda a entrega' },
    { ok: true, text: '@usuario correto e sem alterações até concluir' },
    { ok: true, text: 'Publicação disponível (curtidas e visualizações)' },
    { ok: false, text: 'Nunca envie sua senha ou códigos de verificação' },
  ];
}
