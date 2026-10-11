import React, { useEffect, useState } from 'react';
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
    if (activeTab === 'availability') {
      fetchAvailability();
    } else {
      fetchReservations();
    }
  }, [activeTab, resStatus, page]);

  const filteredAvailabilities = availabilities.filter((a) => {
    if (!availKeyword.trim()) return true;
    const kw = availKeyword.toLowerCase();
    return (
      a.ingredientName.toLowerCase().includes(kw) ||
      a.ingredientCode.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Theo Dõi Giữ Chỗ Tồn Kho (Stock Reservation)
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kiểm soát nguyên liệu đang được khóa giữ bởi các đơn đặt tiệc, tính toán tồn khả dụng thực tế.
          </p>
        </div>

        <button
          onClick={() => (activeTab === 'availability' ? fetchAvailability() : fetchReservations())}
          className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 font-medium bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('availability')}
          className={`pb-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'availability'
              ? 'border-amber-500 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Tồn Khả Dụng Thực Tế (Available Stock)
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'reservations'
              ? 'border-amber-500 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Danh Sách Lệnh Giữ Kho (Reservations)
        </button>
      </div>

      {/* TAB 1: AVAILABILITY TABLE */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên nguyên liệu..."
                value={availKeyword}
                onChange={(e) => setAvailKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="text-xs text-stone-500">
              Công thức: <strong className="text-stone-800">Khả dụng = Tồn vật lý - Đang giữ</strong>
            </div>
          </div>

          {loadingAvail && <LoadingState message="Đang tải dữ liệu khả dụng kho..." />}
          {error && <ErrorState message={error} onRetry={fetchAvailability} />}

          {!loadingAvail && !error && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã NVL</th>
                    <th className="py-3 px-4">Tên nguyên liệu</th>
                    <th className="py-3 px-4">Đơn vị</th>
                    <th className="py-3 px-4 text-right">Tồn vật lý</th>
                    <th className="py-3 px-4 text-right text-amber-700">Đang giữ chỗ</th>
                    <th className="py-3 px-4 text-right font-bold text-stone-900">Khả dụng thực tế</th>
                    <th className="py-3 px-4 text-center">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredAvailabilities.map((it) => (
                    <tr key={it.ingredientId} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">
                        {it.ingredientCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">
                        {it.ingredientName}
                      </td>
                      <td className="py-3 px-4 text-stone-500">{it.unit}</td>
                      <td className="py-3 px-4 text-right font-mono text-stone-600">
                        {formatQuantity(it.physicalStock)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                        {formatQuantity(it.reservedStock)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatQuantity(it.availableStock)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.availableStock <= 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Hết hàng
                          </span>
                        ) : it.lowStock ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Đủ đáp ứng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESERVATIONS LOG */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Lọc theo trạng thái:</span>
              <select
                value={resStatus}
                onChange={(e) => {
                  setResStatus(e.target.value as ReservationStatus | '');
                  setPage(0);
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ thanh toán (PENDING)</option>
                <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                <option value="RELEASED">Đã giải phóng (RELEASED)</option>
              </select>
            </div>
          </div>

          {loadingRes && <LoadingState message="Đang tải danh sách lệnh giữ kho..." />}
          {error && <ErrorState message={error} onRetry={fetchReservations} />}

          {!loadingRes && !error && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Lệnh ID</th>
                    <th className="py-3 px-4">Mã đơn hàng</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Hạn giữ chỗ</th>
                    <th className="py-3 px-4">Ngày tạo</th>
                    <th className="py-3 px-4">Số loại NVL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        Không có lệnh giữ chỗ nào.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-800">
                          #{res.id}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-800">
                          {res.orderCode || '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {res.customerName || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              res.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : res.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-stone-100 text-stone-600 border-stone-300'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600">
                          {formatDateTimeVn(res.expiresAt)}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-400">
                          {formatDateTimeVn(res.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-700">
                          {res.items.length} loại
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="p-4 border-t border-stone-100 flex justify-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 rounded-lg border border-stone-200 text-xs disabled:opacity-40"
                  >
                    Trang trước
                  </button>
                  <span className="px-3 py-1 text-xs text-stone-500">
                    Trang {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-stone-200 text-xs disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
