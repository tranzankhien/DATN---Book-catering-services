import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock4,
  CreditCard,
  ChefHat,
  CheckCircle2,
  AlertTriangle,
  MailWarning,
  RefreshCw,
  ArrowRight,
  Utensils,
  ClipboardList,
  PackageCheck,
  Calendar,
} from 'lucide-react';
import { apiClient, extractErrorMessage } from '../../services/apiClient';
import type { ApiResponse } from '../../services/types';

interface OverviewCounts {
  pendingPayment: number;
  paid: number;
  preparing: number;
  completed: number;
  paymentReview: number;
  failedEmails: number;
}

export function AdminOverviewPage() {
  const [counts, setCounts] = useState<OverviewCounts>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiClient
      .get<ApiResponse<OverviewCounts>>('/admin/overview', { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setCounts(result.data.data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(extractErrorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const metricCards = [
    {
      key: 'pendingPayment' as const,
      label: 'Đơn chờ thanh toán',
      desc: 'Giữ chỗ kho nguyên liệu 15p',
      to: '/admin/orders?orderStatus=PENDING_PAYMENT&paymentStatus=UNPAID&awaitingPayment=true',
      icon: Clock4,
      iconBg: 'bg-amber-50 text-amber-700',
      badge: 'Chờ VietQR',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      key: 'paid' as const,
      label: 'Đã thanh toán, chờ bếp',
      desc: 'Hợp đồng tiệc đã được xác nhận',
      to: '/admin/orders?orderStatus=PAID',
      icon: CreditCard,
      iconBg: 'bg-emerald-50 text-emerald-700',
      badge: 'Sẵn sàng bếp',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      key: 'preparing' as const,
      label: 'Đang chuẩn bị tiệc',
      desc: 'Bếp đang sơ chế & nấu nướng',
      to: '/admin/orders?orderStatus=PREPARING',
      icon: ChefHat,
      iconBg: 'bg-blue-50 text-blue-700',
      badge: 'Đang phục vụ',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      key: 'completed' as const,
      label: 'Đơn tiệc hoàn thành',
      desc: 'Đã tổ chức và quyết toán',
      to: '/admin/orders?orderStatus=COMPLETED',
      icon: CheckCircle2,
      iconBg: 'bg-stone-100 text-stone-700',
      badge: 'Thành công',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    },
    {
      key: 'paymentReview' as const,
      label: 'Giao dịch cần đối soát',
      desc: 'Khoản thu lệch cần kế toán kiểm tra',
      to: '/admin/payments?tab=review',
      icon: AlertTriangle,
      iconBg: 'bg-purple-50 text-purple-700',
      badge: 'Cần xử lý',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      key: 'failedEmails' as const,
      label: 'Email thông báo lỗi',
      desc: 'Thư xác nhận chưa tới hòm thư khách',
      to: '/admin/payments?tab=notifications&status=FAILED',
      icon: MailWarning,
      iconBg: 'bg-rose-50 text-rose-700',
      badge: 'Cần gửi lại',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  ];

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <LayoutDashboard className="h-4 w-4" />
            <span>Phân hệ tiệc / Vận hành & Giám sát tổng thể</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Tổng quan vận hành đơn & yến tiệc
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Theo dõi thời gian thực số lượng đơn đặt tiệc, tiến độ chế biến bếp, đối soát thanh toán SePay và giữ kho nguyên liệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRevision((v) => v + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Danh sách đơn tiệc</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const count = counts ? counts[card.key] : 0;
          return (
            <Link
              key={card.key}
              to={card.to}
              className="group bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-stone-500">{card.label}</span>
                  <div className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {loading && !counts ? (
                      <span className="inline-block h-8 w-12 bg-stone-100 rounded-lg animate-pulse" />
                    ) : (
                      count.toLocaleString('vi-VN')
                    )}
                  </div>
                </div>

                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${card.badgeClass}`}>
                  {card.badge}
                </span>

                <span className="text-stone-400 group-hover:text-amber-700 font-semibold inline-flex items-center gap-1 transition-colors">
                  Chi tiết <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-700" />
          <span>Lối tắt điều phối tiệc & vận hành</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <Link
            to="/admin/menus"
            className="rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-400 p-4 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 font-bold text-xs text-stone-900 group-hover:text-amber-900">
              <Utensils className="h-4 w-4 text-amber-700" />
              <span>Thực đơn tiệc mẫu</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Cấu hình các set menu định sẵn, định mức món và giá bàn 10 khách.
            </p>
          </Link>

          <Link
            to="/admin/orders"
            className="rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-400 p-4 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 font-bold text-xs text-stone-900 group-hover:text-amber-900">
              <ClipboardList className="h-4 w-4 text-amber-700" />
              <span>Xử lý đơn đặt tiệc</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Theo dõi danh sách khách đặt, duyệt đơn và tiến độ phục vụ.
            </p>
          </Link>

          <Link
            to="/admin/payments"
            className="rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-400 p-4 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 font-bold text-xs text-stone-900 group-hover:text-amber-900">
              <CreditCard className="h-4 w-4 text-amber-700" />
              <span>Đối soát thanh toán SePay</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Kiểm tra mã tham chiếu, log IPN Webhook và lịch sử gửi email.
            </p>
          </Link>

          <Link
            to="/admin/inventory/reservations"
            className="rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-amber-400 p-4 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 font-bold text-xs text-stone-900 group-hover:text-amber-900">
              <PackageCheck className="h-4 w-4 text-amber-700" />
              <span>Theo dõi giữ kho nguyên liệu</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Giám sát tồn khả dụng, thời hạn giữ kho 15p và lệnh xuất dùng.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
