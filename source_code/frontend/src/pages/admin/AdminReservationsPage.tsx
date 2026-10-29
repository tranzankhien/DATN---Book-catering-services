import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Calendar,
  XCircle,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import type {
  ReservationStatus,
  StockAvailabilityDto,
  StockReservationDto,
} from '../../services/types';
import { formatQuantity, formatDateTimeVn } from '../../hooks/useFormatters';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminReservationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'availability' | 'reservations'>('availability');

  // Availability State
  const [availabilities, setAvailabilities] = useState<StockAvailabilityDto[]>([]);
  const [loadingAvail, setLoadingAvail] = useState<boolean>(true);
  const [availKeyword, setAvailKeyword] = useState<string>('');

  // Reservations State
  const [reservations, setReservations] = useState<StockReservationDto[]>([]);
  const [loadingRes, setLoadingRes] = useState<boolean>(true);
  const [resStatus, setResStatus] = useState<ReservationStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    try {
      setLoadingAvail(true);
      setError(null);
      const data = await reservationService.getAvailability();
      setAvailabilities(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingAvail(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoadingRes(true);
      setError(null);
      const res = await reservationService.getReservations({
        status: resStatus || undefined,
        page,
        size: 10,
      });
      setReservations(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoadingRes(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (activeTab === 'availability') {
      fetchAvailability();
    } else {
      fetchReservations();
    }
  }, [activeTab, resStatus, page]);

  const totalTracked = availabilities.length;
  const inReservationCount = availabilities.filter((a) => a.reservedStock > 0).length;
  const safeAvailableCount = availabilities.filter((a) => a.availableStock > 0 && !a.lowStock).length;
  const alertCount = availabilities.filter((a) => a.availableStock <= 0 || a.lowStock).length;

  const filteredAvailabilities = availabilities.filter((a) => {
    if (!availKeyword.trim()) return true;
    const kw = availKeyword.toLowerCase();
    return (
      a.ingredientName.toLowerCase().includes(kw) ||
      a.ingredientCode.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Package className="h-4 w-4" />
            <span>Phân hệ vận hành & kho nguyên liệu</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Theo dõi giữ chỗ & tồn khả dụng kho
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Kiểm soát nguyên liệu đang được khóa giữ bởi các đơn đặt tiệc, tính toán tồn khả dụng thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchAvailability();
              if (activeTab === 'reservations') fetchReservations();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(loadingAvail || loadingRes) ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-500">Mặt hàng kho theo dõi</span>
            <p className="text-2xl font-bold text-stone-900 tabular-nums">{totalTracked}</p>
            <span className="text-[11px] text-stone-400">Nguyên liệu quản lý giữ chỗ</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-amber-700">Đang bị khóa giữ tiệc</span>
            <p className="text-2xl font-bold text-amber-900 tabular-nums">{inReservationCount}</p>
            <span className="text-[11px] text-amber-600/80">Mặt hàng có đơn tiệc giữ trước</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-emerald-700">Khả dụng sẵn sàng</span>
            <p className="text-2xl font-bold text-emerald-800 tabular-nums">{safeAvailableCount}</p>
            <span className="text-[11px] text-emerald-600">Đủ tồn phục vụ đơn tiệc mới</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-rose-600">Cần bổ sung / Chạm ngưỡng</span>
            <p className="text-2xl font-bold text-rose-700 tabular-nums">{alertCount}</p>
            <span className="text-[11px] text-rose-500">Khả dụng chạm ngưỡng hoặc âm</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('availability')}
          className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'availability'
              ? 'border-amber-700 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Tồn khả dụng thực tế theo nguyên liệu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 px-3 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'reservations'
              ? 'border-amber-700 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Lịch sử lệnh khóa giữ kho</span>
        </button>
      </div>

      {/* TAB 1: AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên nguyên liệu..."
                value={availKeyword}
                onChange={(e) => setAvailKeyword(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
              />
              {availKeyword && (
                <button
                  type="button"
                  onClick={() => setAvailKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2 text-xs text-amber-950 font-medium">
              Công thức: <strong className="text-amber-900 font-bold">Khả dụng = Tồn vật lý - Đang giữ</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Mã NVL</th>
                    <th className="py-3.5 px-4">Tên nguyên liệu</th>
                    <th className="py-3.5 px-4">Đơn vị</th>
                    <th className="py-3.5 px-4 text-right">Tồn vật lý</th>
                    <th className="py-3.5 px-4 text-right">Đang giữ chỗ</th>
                    <th className="py-3.5 px-4 text-right">Khả dụng thực tế</th>
                    <th className="py-3.5 px-4 text-center">Tỷ lệ khóa giữ</th>
                    <th className="py-3.5 px-4 text-center">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loadingAvail ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-stone-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                        <span className="font-medium">Đang tải dữ liệu khả dụng kho...</span>
                      </td>
                    </tr>
                  ) : filteredAvailabilities.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-stone-400">
                        <Package className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                        <p className="font-semibold text-stone-600 text-sm">Không tìm thấy nguyên liệu nào</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAvailabilities.map((it) => {
                      const reservedRatio = it.physicalStock > 0 ? Math.min(100, Math.round((it.reservedStock / it.physicalStock) * 100)) : 0;
                      return (
                      <tr key={it.ingredientId} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900 bg-stone-50/40 whitespace-nowrap tabular-nums">
                          {it.ingredientCode}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {it.ingredientName}
                        </td>
                        <td className="py-3.5 px-4 text-stone-500">{it.unit}</td>
                        <td className="py-3.5 px-4 text-right text-stone-600 whitespace-nowrap tabular-nums">
                          {formatQuantity(it.physicalStock)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-800 whitespace-nowrap tabular-nums">
                          {formatQuantity(it.reservedStock)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-800 text-sm whitespace-nowrap tabular-nums">
                          {formatQuantity(it.availableStock)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="w-24 mx-auto">
                            <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1 tabular-nums">
                              <span>{reservedRatio}%</span>
                              <span className="text-[9px] text-stone-400">đang giữ</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  reservedRatio > 80 ? 'bg-rose-500' : reservedRatio > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, reservedRatio)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {it.availableStock <= 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Hết tồn khả dụng
                            </span>
                          ) : it.lowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Sắp chạm ngưỡng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đủ đáp ứng tiệc
                            </span>
                          )}
                        </td>
                      </tr>
                    );})
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-stone-500">Lọc theo trạng thái:</span>
              <select
                value={resStatus}
                onChange={(e) => {
                  setResStatus(e.target.value as ReservationStatus | '');
                  setPage(0);
                }}
                className="px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang giữ chỗ (ACTIVE)</option>
                <option value="RELEASED">Đã giải phóng (RELEASED)</option>
                <option value="CONSUMED">Đã xuất dùng tiệc</option>
                <option value="FULFILLED">Đã xuất dùng tiệc (FULFILLED)</option>
                <option value="EXPIRED">Đã hết hạn giữ (EXPIRED)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Lệnh ID</th>
                    <th className="py-3.5 px-4">Mã đơn tiệc</th>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4">Hạn giữ chỗ</th>
                    <th className="py-3.5 px-4">Thời gian tạo</th>
                    <th className="py-3.5 px-4 text-right">Số loại NVL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loadingRes ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-stone-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                        <span className="font-medium">Đang tải danh sách lệnh giữ kho...</span>
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-stone-400">
                        <Clock className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                        <p className="font-semibold text-stone-600 text-sm">Không có lệnh giữ kho nào</p>
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900 bg-stone-50/40 whitespace-nowrap tabular-nums">
                          #{res.id}
                        </td>
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap tabular-nums">
                          {res.orderId && res.orderCode ? (
                            <Link
                              to={`/admin/orders/${res.orderId}`}
                              className="text-amber-800 hover:text-amber-950 hover:underline inline-flex items-center gap-1 group"
                              title="Xem chi tiết đơn tiệc"
                            >
                              <span>{res.orderCode}</span>
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-stone-400">{res.orderCode || '—'}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {res.customerName || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              res.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : (res.status === 'FULFILLED' || res.status === 'CONSUMED')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : res.status === 'EXPIRED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {res.status === 'ACTIVE'
                              ? 'Đang giữ chỗ'
                              : (res.status === 'FULFILLED' || res.status === 'CONSUMED')
                              ? 'Đã xuất dùng'
                              : res.status === 'EXPIRED'
                              ? 'Đã hết hạn'
                              : 'Đã giải phóng'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap tabular-nums">
                          {formatDateTimeVn(res.expiresAt)}
                        </td>
                        <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap tabular-nums">
                          {formatDateTimeVn(res.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-stone-800 whitespace-nowrap">
                          {res.items.length} loại
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-stone-100 flex justify-center items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors"
                >
                  Trang trước
                </button>
                <span className="px-3 py-1.5 text-xs text-stone-500 font-medium">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 disabled:opacity-40 hover:bg-stone-50 shadow-xs transition-colors"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
