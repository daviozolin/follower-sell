import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info' | 'error';
export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, tone: ToastTone = 'info', durationMs = 3200): void {
    const id = ++this.seq;
    this.toasts.update((t) => [...t, { id, tone, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 4500);
  }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
