import type { PaymentState } from '../services/paymentService';

// Browser callback fields are never settlement evidence. Only the reference identifies a server lookup.
export function paymentReference(search: string): string | null {
  const value = new URLSearchParams(search).get('reference');
  return value && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : null;
}
export function paymentOutcome(state: PaymentState, reference: string): 'success' | 'review' | 'closed' | 'failed' | 'expired' | 'pending' {
  const attempt = state.transactions.find(tx => tx.transactionReference === reference);
  if (attempt?.status === 'SUCCESS') return 'success';
  if (attempt?.status === 'REVIEW_REQUIRED') return 'review';
  if (attempt?.status === 'REVIEW_CLOSED') return 'closed';
  if (attempt?.status === 'FAILED' || attempt?.status === 'CANCELLED') return 'failed';
  if (state.orderStatus === 'EXPIRED' || attempt?.status === 'EXPIRED') return 'expired';
  return 'pending';
}
