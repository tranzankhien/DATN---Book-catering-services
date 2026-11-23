// Lightweight, cross-tab event bus using BroadcastChannel + window storage fallback
const CHANNEL_NAME = 'banquet_order_events';

export type OrderEventType = 'ORDER_PAID' | 'ORDER_UPDATED' | 'ORDER_CANCELLED';

export interface OrderEventPayload {
  type: OrderEventType;
  orderId?: number;
  timestamp: number;
}

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel not supported or blocked
}

export function notifyOrderUpdated(orderId?: number, type: OrderEventType = 'ORDER_UPDATED') {
  const payload: OrderEventPayload = {
    type,
    orderId,
    timestamp: Date.now(),
  };

  if (channel) {
    try {
      channel.postMessage(payload);
    } catch {}
  }

  // Trigger window event for same-tab listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('banquet:order_updated', { detail: payload }));

    // localStorage write for cross-window fallback
    try {
      localStorage.setItem('banquet_last_order_event', JSON.stringify(payload));
    } catch {}
  }
}

export function subscribeOrderUpdated(callback: (payload: OrderEventPayload) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent<OrderEventPayload>).detail;
    callback(detail);
  };

  const handleChannelMessage = (e: MessageEvent<OrderEventPayload>) => {
    if (e.data) {
      callback(e.data);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'banquet_last_order_event' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch {}
    }
  };

  window.addEventListener('banquet:order_updated', handleCustomEvent);
  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('banquet:order_updated', handleCustomEvent);
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
