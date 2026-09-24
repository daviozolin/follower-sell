# Pulse Growth — Frontend (Angular 18)

Frontend premium para crescimento de Instagram e TikTok. Usa **somente Standalone Components**, **Signals**, o novo control flow (`@if`/`@for`/`@switch`/`@let`), `inject()`, **Reactive Forms (NonNullableFormBuilder)** e **Tailwind CSS** com design tokens em CSS variables.

> Nada aqui chama uma API real. Toda a comunicação externa fica atrás de services mockados (`of/timer + delay`) com a mesma assinatura que a versão HTTP terá.

## Rodando

```bash
npm install
npm start          # http://localhost:4200
npm run build
```

## Árvore de diretórios

```
src/
├── styles.scss                     # design tokens (:root) + camadas Tailwind (.btn, .card, .input…)
└── app/
    ├── app.component.ts            # shell: header + <router-outlet> + footer + toasts
    ├── app.config.ts               # router (lazy, input binding, view transitions, anchor scroll), locale pt-BR/BRL
    ├── app.routes.ts               # todas as páginas com loadComponent (lazy)
    ├── core/
    │   ├── models/                 # platform, package, order, payment, profile, pricing (+ index.ts)
    │   ├── services/
    │   │   ├── pricing.service.ts          # regras de preço/prazo (puras, usadas em computed)
    │   │   ├── package-catalog.service.ts  # catálogo de pacotes
    │   │   ├── mock-order.service.ts       # createOrder / getOrderStatus / requestRefill + simulação de entrega
    │   │   ├── mock-payment.service.ts     # Pix (BR Code c/ CRC16) e cartão (mock)
    │   │   ├── mock-profile.service.ts     # busca pública de perfil (preview)
    │   │   ├── toast.service.ts · clipboard.service.ts
    │   ├── state/order-selection.store.ts  # seleção plataforma/serviço/quantidade/velocidade (signals)
    │   ├── validators/             # regex IG/TikTok, URLs de post, Luhn, validade, e-mail, sanitização
    │   └── utils/                  # format, hash/PRNG determinístico, localStorage defensivo
    ├── shared/ui/                  # icon, badge, order-status-badge, tooltip, modal (<dialog>), segmented-control,
    │                               # avatar, qr-code (ilustrativo), toast-outlet
    ├── layout/                     # site-header, site-footer
    └── features/
        ├── home/                   # "/" — hero, seletor, pacotes, calculadora, segurança, FAQ
        ├── checkout/               # "/checkout" — CheckoutStore (escopo da página) + etapas
        │   └── steps/              # profile, delivery, payment, pix-payment, checkout-success, stepper, summary
        ├── tracking/               # "/rastreio" e "/rastreio/:orderId" — timeline + modal de refill
        └── not-found/
```

## Fluxos para testar

| Onde | O que fazer |
|---|---|
| Home | Alternar Instagram/TikTok, serviço, Orgânica/Turbo; arrastar o slider da calculadora (escala log) |
| Checkout · Perfil | `@qualquer.coisa` → preview público · `@perfil.privado` → bloqueia · `@naoexiste` → erro |
| Checkout · Pagamento | Pix → QR + copia e cola + countdown 15 min → **"Simular pagamento aprovado"** |
| | Cartão `4242 4242 4242 4242` → aprovado · final `0002` → recusado |
| Rastreio | `PG-DEMO01` (concluído, refill disponível) · `PG-DEMO02` (em entrega) · e-mail `demo@pulsegrowth.app` |

Pedidos ficam no `localStorage` (`pg.orders.v1`) e a simulação continua de onde parou após recarregar a página. A entrega é acelerada para demo (`SIM` em `mock-order.service.ts`).

## Onde integrar depois

| Mock | Troque por |
|---|---|
| `MockOrderService.createOrder/getOrderStatus/findOrders/requestRefill` | `HttpClient` do seu backend (que fala com o painel SMM). Remova `runDelivery/runRefill`; use polling/SSE/WebSocket para atualizar o `store` |
| `MockPaymentService.createPixCharge` | Endpoint do seu backend que cria a cobrança no PSP; exiba o QR base64 retornado no lugar de `<app-qr-code>` |
| `MockPaymentService.simulatePixPaid` | Webhook do PSP → backend → push/polling para o front |
| `MockPaymentService.payWithCard` | **Tokenização no SDK do gateway** (os dados do cartão nunca devem passar pelo seu servidor) |
| `MockProfileService.lookup` | Endpoint do backend (nunca chame APIs de terceiros direto do browser) |
| `PricingService` (tabela) | Preços vindos do backend; mantenha o cálculo no front só para exibição e **revalide no servidor** |
