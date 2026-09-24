import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { CardPaymentRequest, CardPaymentResult, Order, PixCharge } from '../models';
import { randomId } from '../utils/format';
import { MockOrderService } from './mock-order.service';

const PIX_TTL_MS = 15 * 60_000;

/**
 * Mock do gateway de pagamento. Nenhum dado de cartão é armazenado:
 * o "gateway" recebe, decide e descarta, retornando apenas os 4 últimos dígitos.
 *
 * Cartões de teste: final 0002 → recusado; qualquer outro número válido (Luhn) → aprovado.
 */
@Injectable({ providedIn: 'root' })
export class MockPaymentService {
  private readonly orders = inject(MockOrderService);
  private readonly charges = signal<Record<string, PixCharge>>({});

  createPixCharge(order: Order): Observable<PixCharge> {
    return timer(550).pipe(
      map(() => {
        const id = randomId('PIX', 10);
        const charge: PixCharge = {
          id,
          orderId: order.id,
          amount: order.totalPrice,
          brCode: buildBrCode(id, order.totalPrice),
          expiresAt: new Date(Date.now() + PIX_TTL_MS).toISOString(),
          status: 'awaiting',
        };
        this.charges.update((c) => ({ ...c, [id]: charge }));
        return charge;
      }),
    );
  }

  watchCharge(chargeId: string): Signal<PixCharge | undefined> {
    return computed(() => this.charges()[chargeId]);
  }

  /** Simula o webhook do PSP confirmando o Pix (apenas para testes locais). */
  simulatePixPaid(chargeId: string): Observable<PixCharge> {
    return timer(900).pipe(
      map(() => {
        const charge = this.charges()[chargeId];
        if (!charge || charge.status !== 'awaiting') throw new Error('Cobrança indisponível.');
        const paid: PixCharge = { ...charge, status: 'paid' };
        this.charges.update((c) => ({ ...c, [chargeId]: paid }));
        this.orders.confirmPayment(charge.orderId);
        return paid;
      }),
    );
  }

  markExpired(chargeId: string): void {
    const charge = this.charges()[chargeId];
    if (charge?.status === 'awaiting') {
      this.charges.update((c) => ({ ...c, [chargeId]: { ...charge, status: 'expired' } }));
    }
  }

  payWithCard(request: CardPaymentRequest): Observable<CardPaymentResult> {
    const last4 = request.number.slice(-4);
    const brand = detectBrand(request.number);
    return timer(1600).pipe(
      map(() => {
        if (last4 === '0002') {
          return { approved: false, last4, brand, message: 'Pagamento recusado pelo emissor. Tente outro cartão ou use Pix.' };
        }
        this.orders.confirmPayment(request.orderId);
        return { approved: true, last4, brand, message: 'Pagamento aprovado.' };
      }),
    );
  }
}

export function detectBrand(number: string): string {
  if (/^4/.test(number)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(number)) return 'Elo';
  if (/^(606282|3841)/.test(number)) return 'Hipercard';
  return 'Cartão';
}

// --- BR Code (EMV) mockado, com CRC16 real para parecer autêntico -------------

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, '0') + value;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildBrCode(txid: string, amount: number): string {
  const merchant = tlv('00', 'br.gov.bcb.pix') + tlv('01', `mock-${txid.toLowerCase()}@pulsegrowth.app`);
  const payload =
    tlv('00', '01') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', 'PULSE GROWTH MOCK') +
    tlv('60', 'SAO PAULO') +
    tlv('62', tlv('05', txid)) +
    '6304';
  return payload + crc16(payload);
}
