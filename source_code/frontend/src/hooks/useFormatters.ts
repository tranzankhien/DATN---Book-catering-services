import type { Role } from '../services/types';

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const qtyFormatter = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatVnd(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return '0 ₫';
  }
  return vndFormatter.format(Math.round(Number(amount)));
}

export function formatQuantity(qty: number | undefined | null): string {
  if (qty === undefined || qty === null || Number.isNaN(Number(qty))) {
    return '0';
  }
  return qtyFormatter.format(Number(qty));
}

export function formatDateTimeVn(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function getRoleLabel(role?: Role): string {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Quản trị viên (Admin)';
    case 'ROLE_EMPLOYEE':
      return 'Nhân viên điều phối';
    case 'ROLE_USER':
      return 'Khách hàng';
    default:
      return 'Khách vãng lai';
  }
}
