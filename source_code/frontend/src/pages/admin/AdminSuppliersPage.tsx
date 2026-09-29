import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  RefreshCw,
  X,
  CheckCircle2,
  Ban,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import type { StockReceiptDto, SupplierDto, SupplierUpsertPayload } from '../../services/types';
import { useToast } from '../../hooks/useToast';

export const AdminSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Upsert Modal
  const [showUpsertModal, setShowUpsertModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [form, setForm] = useState<SupplierUpsertPayload>({
    name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Supplier Receipts Modal
  const [viewingSupplierReceipts, setViewingSupplierReceipts] = useState<SupplierDto | null>(null);
  const [supplierReceipts, setSupplierReceipts] = useState<StockReceiptDto[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState<boolean>(false);

  const { showToast } = useToast();

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const activeParam = activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE';
      const list = await supplierService.getSuppliers({
        keyword: keyword || undefined,
        active: activeParam,
      });
      setSuppliers(list);
    } catch {
      showToast('Không thể tải danh sách nhà cung cấp', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [keyword, activeFilter]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      note: '',
      active: true,
    });
    setShowUpsertModal(true);
  };

  const openEditModal = (sup: SupplierDto) => {
    setEditingSupplier(sup);
    setForm({
      name: sup.name,
      phone: sup.phone,
      email: sup.email || '',
      address: sup.address || '',
      note: sup.note || '',
      active: sup.active,
    });
    setShowUpsertModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('Tên và số điện thoại là thông tin bắt buộc', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, form);
        showToast('Cập nhật thông tin nhà cung cấp thành công!', 'success');
      } else {
        await supplierService.createSupplier(form);
        showToast('Thêm nhà cung cấp mới thành công!', 'success');
      }
      setShowUpsertModal(false);
      loadSuppliers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu nhà cung cấp';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (sup: SupplierDto) => {
    try {
      const updated = await supplierService.toggleSupplierActive(sup.id);
      showToast(
        updated.active
          ? `Đã kích hoạt lại nhà cung cấp ${sup.name}`
          : `Đã tạm ngừng hoạt động nhà cung cấp ${sup.name}`,
        'info'
      );
      loadSuppliers();
    } catch {
      showToast('Không thể thay đổi trạng thái nhà cung cấp', 'error');
    }
  };

  const openReceiptsModal = async (sup: SupplierDto) => {
    try {
      setViewingSupplierReceipts(sup);
      setLoadingReceipts(true);
      const list = await supplierService.getSupplierReceipts(sup.id);
      setSupplierReceipts(list);
    } catch {
      showToast('Không thể tải danh sách phiếu nhập', 'error');
    } finally {
      setLoadingReceipts(false);
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalPurchasedSum = suppliers.reduce((sum, s) => sum + (s.totalPurchasedAmount || 0), 0);
  const activeCount = suppliers.filter((s) => s.active).length;
  const inactiveCount = suppliers.filter((s) => !s.active).length;

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Truck className="h-4 w-4" />
            <span>Đối Tác & Cung Ứng</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Quản Lý Nhà Cung Cấp Nguyên Liệu
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Danh bạ đối tác cung ứng nông sản, hải sản, gia vị; theo dõi công nợ và lịch sử phiếu nhập hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-all shadow-md shadow-amber-900/10 cursor-pointer self-start md:self-auto hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Nhà Cung Cấp Mới</span>
        </button>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Tổng Nhà Cung Cấp
            </span>
            <p className="text-2xl font-black text-stone-900">{suppliers.length}</p>
            <span className="text-xs text-stone-400">Đối tác trong danh bạ</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center border border-stone-200">
            <Truck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Đang Hợp Tác
            </span>
            <p className="text-2xl font-black text-emerald-700">{activeCount}</p>
            <span className="text-xs text-stone-400">Sẵn sàng nhận đơn</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Tạm Dừng Hợp Tác
            </span>
            <p className="text-2xl font-black text-stone-600">{inactiveCount}</p>
            <span className="text-xs text-stone-400">Khóa tạo phiếu nhập</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200">
            <Ban className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-stone-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Tổng Giá Trị Đã Nhập
            </span>
            <p className="text-xl font-black font-mono text-amber-800">{formatVnd(totalPurchasedSum)}</p>
            <span className="text-xs text-stone-400">Lũy kế toàn bộ phiếu</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhà cung cấp, số điện thoại hoặc mã NCC..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
          >
            <option value="ALL">Tất cả trạng thái ({suppliers.length})</option>
            <option value="ACTIVE">Đang hợp tác ({activeCount})</option>
            <option value="INACTIVE">Tạm dừng ({inactiveCount})</option>
          </select>

          <button
            type="button"
            onClick={loadSuppliers}
            className="p-2.5 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200 shadow-xs"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suppliers Table with Optimized Proportional Column Widths */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-28 whitespace-nowrap">Mã NCC</th>
                <th className="py-3.5 px-4 min-w-[280px]">Nhà Cung Cấp</th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">Liên Hệ</th>
                <th className="py-3.5 px-4 min-w-[260px]">Địa Chỉ</th>
                <th className="py-3.5 px-4 text-right w-44 whitespace-nowrap">Tổng Tiền Đã Nhập</th>
                <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">Số Phiếu</th>
                <th className="py-3.5 px-4 text-center w-32 whitespace-nowrap">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center w-36 whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải danh bạ nhà cung cấp...</span>
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-stone-400">
                    <Truck className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy nhà cung cấp nào</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => {
                  const receiptsCount = sup.totalReceiptsCount ?? sup.stockReceiptsCount ?? 0;
                  return (
                    <tr key={sup.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-800 whitespace-nowrap bg-stone-50/40">
                        {sup.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 text-sm group-hover:text-amber-800 transition-colors">
                          {sup.name}
                        </div>
                        {sup.note && (
                          <div className="text-[11px] text-stone-400 mt-0.5 max-w-md line-clamp-1" title={sup.note}>
                            {sup.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-1 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-stone-900 font-semibold text-xs">
                          <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          <span>{sup.phone}</span>
                        </div>
                        {sup.email ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                            <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            <span>{sup.email}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-300 italic">Chưa có email</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600" title={sup.address || ''}>
                        {sup.address ? (
                          <div className="flex items-start gap-1.5 max-w-sm">
                            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed text-xs">{sup.address}</span>
                          </div>
                        ) : (
                          <span className="text-stone-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900 whitespace-nowrap text-sm">
                        {formatVnd(sup.totalPurchasedAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openReceiptsModal(sup)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 font-semibold transition-colors cursor-pointer border border-stone-200/80 hover:border-amber-300"
                          title="Bấm để xem lịch sử phiếu nhập của NCC này"
                        >
                          <Receipt className="h-3 w-3 text-stone-400" />
                          <span className="font-mono font-bold">{receiptsCount}</span>
                          <span className="text-[11px] text-stone-500">phiếu</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            sup.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${sup.active ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          {sup.active ? 'Đang hợp tác' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(sup)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Chỉnh sửa thông tin NCC"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(sup)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              sup.active
                                ? 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={sup.active ? 'Tạm ngừng hợp tác' : 'Kích hoạt lại'}
                          >
                            {sup.active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openReceiptsModal(sup)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Xem danh sách phiếu nhập"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upsert Supplier Modal */}
      {showUpsertModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">
                  {editingSupplier ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpsertModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tên nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Công Ty TNHH Nông Sản Xanh Mekong"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0934112233"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="VD: contact@ncc.vn"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Địa chỉ giao dịch</label>
                <input
                  type="text"
                  placeholder="VD: 123 Đường Hải Thượng Lãn Ông, Q.5, TP.HCM"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ghi chú đối tác</label>
                <textarea
                  rows={2}
                  placeholder="VD: Nhà cung cấp thực phẩm VietGAP, giao hàng hằng ngày lúc 06:00 sáng..."
                  value={form.note || ''}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="supActive"
                  checked={form.active ?? true}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="supActive" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Đang hợp tác và cho phép lập phiếu nhập hàng
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowUpsertModal(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : editingSupplier ? 'Cập Nhật NCC' : 'Thêm Nhà Cung Cấp'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier Receipts History Modal */}
      {viewingSupplierReceipts && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in duration-150 my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Lịch Sử Phiếu Nhập: {viewingSupplierReceipts.name}
                </h3>
                <p className="text-xs text-stone-400 font-mono mt-0.5">
                  Mã: {viewingSupplierReceipts.code} • SĐT: {viewingSupplierReceipts.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSupplierReceipts(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {loadingReceipts ? (
                <div className="py-12 text-center text-stone-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                  <span>Đang tải các phiếu nhập hàng...</span>
                </div>
              ) : supplierReceipts.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  Chưa có phiếu nhập hàng nào từ nhà cung cấp này
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {supplierReceipts.map((r) => (
                    <div key={r.id} className="p-3 flex items-center justify-between hover:bg-stone-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{r.code}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {r.status === 'CONFIRMED' ? 'Đã nhập kho' : 'Bản nháp'}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400 font-mono">Ngày nhập: {formatDate(r.receiptDate)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono font-bold text-stone-900">{formatVnd(r.totalAmount)}</div>
                          <span
                            className={`text-[10px] font-semibold ${
                              r.paymentStatus === 'PAID'
                                ? 'text-emerald-600'
                                : r.paymentStatus === 'PARTIALLY_PAID'
                                ? 'text-amber-600'
                                : 'text-stone-400'
                            }`}
                          >
                            {r.paymentStatus === 'PAID'
                              ? 'Đã trả đủ'
                              : r.paymentStatus === 'PARTIALLY_PAID'
                              ? `Nợ ${formatVnd(r.remainingAmount)}`
                              : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <Link
                          to={`/admin/inventory/receipts/${r.id}`}
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50"
                          title="Xem chi tiết phiếu nhập"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <Link
                to="/admin/inventory/receipts/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo phiếu nhập mới từ NCC này</span>
              </Link>
              <button
                type="button"
                onClick={() => setViewingSupplierReceipts(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

