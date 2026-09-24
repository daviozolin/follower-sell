import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Pulse Growth — Crescimento seguro para Instagram e TikTok',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'checkout',
    title: 'Checkout seguro — Pulse Growth',
    loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'rastreio',
    title: 'Rastrear pedido — Pulse Growth',
    loadComponent: () => import('./features/tracking/tracking.page').then((m) => m.TrackingPage),
  },
  {
    path: 'rastreio/:orderId',
    title: 'Acompanhamento do pedido — Pulse Growth',
    loadComponent: () => import('./features/tracking/tracking.page').then((m) => m.TrackingPage),
  },
  { path: 'tracking/:orderId', redirectTo: 'rastreio/:orderId' },
  {
    path: '**',
    title: 'Página não encontrada — Pulse Growth',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
