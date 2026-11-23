import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Utensils,
  Search,
  Plus,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Sliders,
  Sparkles,
  Trash2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { menuService } from '../../services/menuService';
import { catalogService } from '../../services/catalogService';
import type {
  CreateMenuPayload,
  DishSummaryDto,
  MenuDto,
  MenuItemPayload,
  MenuStatus,
} from '../../services/types';
import { formatVnd } from '../../hooks/useFormatters';
import { useToast } from '../../hooks/useToast';
import { Pagination } from '../../components/common/Pagination';
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';
import { DEFAULT_MENU_IMAGE, DEFAULT_DISH_IMAGE, handleImageError } from '../../lib/imageConstants';

interface ModalLineItem {
  dishId: number;
  quantityPerTable: number;
  dish?: DishSummaryDto;
}

export const AdminMenusPage: React.FC = () => {
  const { showToast } = useToast();

  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MenuStatus | ''>('ACTIVE');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Available dishes for modal
  const [allDishes, setAllDishes] = useState<DishSummaryDto[]>([]);

  // Upsert Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMenu, setEditingMenu] = useState<MenuDto | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formItems, setFormItems] = useState<ModalLineItem[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  // Load All Dishes for dropdown
  useEffect(() => {
    (async () => {
      try {
        const dishList = await catalogService.getPublicDishes();
        setAllDishes(dishList);
      } catch (e) {
        console.error('Failed to load dishes list', e);
      }
    })();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await menuService.getAdminMenus({
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        page,
        size: pageSize,
      });
      setMenus(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [keyword, statusFilter, page, pageSize]);

  const handleToggleStatus = async (menu: MenuDto) => {
    const nextStatus: MenuStatus = menu.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE';
    try {
      await menuService.updateMenuStatus(menu.id, nextStatus);
      showToast(
        `Đã chuyển trạng thái thực đơn ${menu.code} sang ${
          nextStatus === 'ACTIVE' ? 'Kích hoạt (Hiển thị)' : 'Ẩn'
        }`,
        'success'
      );
      fetchMenus();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const openCreateModal = () => {
    setEditingMenu(null);
    setFormName('');
    setFormDescription('');
    setFormImageUrl('');
    setFormItems([]);
    setModalOpen(true);
  };

  const openEditModal = (menu: MenuDto) => {
    setEditingMenu(menu);
    setFormName(menu.name);
    setFormDescription(menu.description || '');
    setFormImageUrl(menu.imageUrl || '');
    setFormItems(
      menu.items.map((it) => ({
        dishId: it.dishId,
        quantityPerTable: it.quantityPerTable,
        dish: allDishes.find((d) => d.id === it.dishId),
      }))
    );
    setModalOpen(true);
  };

  const handleAddDishToModal = (dishId: number) => {
    const dish = allDishes.find((d) => d.id === dishId);
    if (!dish) return;
    if (formItems.some((it) => it.dishId === dishId)) {
      showToast('Món này đã có trong thực đơn', 'info');
      return;
    }
    setFormItems((prev) => [...prev, { dishId, quantityPerTable: 1, dish }]);
  };

  const handleUpdateModalItemQty = (dishId: number, qty: number) => {
    setFormItems((prev) =>
      prev.map((it) => (it.dishId === dishId ? { ...it, quantityPerTable: Math.max(1, qty) } : it))
    );
  };

  const handleRemoveModalItem = (dishId: number) => {
    setFormItems((prev) => prev.filter((it) => it.dishId !== dishId));
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên thực đơn', 'error');
      return;
    }
    if (formItems.length === 0) {
      showToast('Thực đơn phải có ít nhất 1 món ăn', 'error');
      return;
    }

    try {
      setSaving(true);
      const itemsPayload: MenuItemPayload[] = formItems.map((it, idx) => ({
        dishId: it.dishId,
        quantityPerTable: it.quantityPerTable,
        displayOrder: idx + 1,
      }));

      const payload: CreateMenuPayload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        imageUrl: formImageUrl.trim() || undefined,
        items: itemsPayload,
      };

      if (editingMenu) {
        await menuService.updateMenu(editingMenu.id, payload);
        showToast('Cập nhật thực đơn thành công!', 'success');
      } else {
        await menuService.createMenu(payload);
        showToast('Tạo thực đơn mẫu mới thành công!', 'success');
      }
      setModalOpen(false);
      fetchMenus();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const calculatedModalPrice = formItems.reduce((acc, it) => {
    const price = it.dish?.price || 0;
    return acc + price * it.quantityPerTable;
  }, 0);

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-8 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Utensils className="h-4 w-4" />
            <span>Phân hệ thực đơn tiệc mẫu</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Quản lý thực đơn tiệc mẫu
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Cấu hình các bộ thực đơn chuẩn của nhà hàng phục vụ khách đặt tiệc nhanh và tính nháp giá vốn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMenus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo thực đơn mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm theo mã thực đơn (MN-001) hoặc tên thực đơn..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as MenuStatus | '');
                setPage(0);
              }}
              className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:border-amber-600 shadow-xs"
            >
              <option value="ACTIVE">Đang hiển thị (ACTIVE)</option>
              <option value="">Tất cả trạng thái</option>
              <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
              <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Mã</th>
                <th className="py-3.5 px-4">Tên thực đơn</th>
                <th className="py-3.5 px-4 text-center">Số món</th>
                <th className="py-3.5 px-4 text-right">Đơn giá / Bàn</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && menus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-stone-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-600 mb-2" />
                    <span className="font-medium">Đang tải danh sách thực đơn...</span>
                  </td>
                </tr>
              ) : menus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-stone-400">
                    <Utensils className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-600 text-sm">Không tìm thấy thực đơn nào</p>
                    <p className="text-xs text-stone-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                menus.map((m) => (
                  <tr key={m.id} className="hover:bg-amber-50/30 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-stone-900 bg-stone-50/40 whitespace-nowrap tabular-nums">
                      {m.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200">
                          <img
                            src={m.imageUrl || DEFAULT_MENU_IMAGE}
                            alt=""
                            onError={handleImageError}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                            {m.name}
                          </div>
                          {m.description && (
                            <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5 max-w-md">
                              {m.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-stone-700 whitespace-nowrap tabular-nums">
                      {m.itemsCount} món
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-900 text-sm whitespace-nowrap tabular-nums">
                      {formatVnd(m.pricePerTable)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(m)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : m.status === 'HIDDEN'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                        title={
                          m.status === 'ACTIVE'
                            ? 'Bấm để ẩn thực đơn khỏi khách đặt tiệc'
                            : 'Bấm để kích hoạt hiển thị thực đơn'
                        }
                      >
                        {m.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đang hiển thị
                          </>
                        ) : m.status === 'HIDDEN' ? (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Đã ẩn
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            Lưu trữ
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-900 text-stone-600 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && totalElements > 0 && (
          <div className="p-4 border-t border-stone-100">
            <Pagination
              currentPage={page + 1}
              totalItems={totalElements}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p - 1)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(0);
              }}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="thực đơn"
            />
          </div>
        )}
      </div>

      {/* Upsert Modal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
            <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[82vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-base text-stone-900 tracking-tight">
                  {editingMenu ? `Chỉnh sửa thực đơn (${editingMenu.code})` : 'Tạo thực đơn tiệc mẫu mới'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Thiết lập tên bộ menu, định mức món ăn và tự động tính đơn giá chuẩn cho 1 bàn (10 khách)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="Đóng modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="menu-modal-form" onSubmit={handleSaveMenu} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 pr-5 scrollbar-thin">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Tên thực đơn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Set Menu Hỷ Sự Hoàng Gia"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Mô tả thực đơn</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong vị, ý nghĩa món ăn hoặc gợi ý dịp tiệc phù hợp..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">Ảnh minh họa thực đơn (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
              </div>

              {/* Dish Items Selector */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-amber-700" />
                    <span>Món trong bàn tiệc ({formItems.length} món)</span>
                  </label>
                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
                    Đơn giá 1 bàn: <span className="text-sm tabular-nums">{formatVnd(calculatedModalPrice)}</span>
                  </div>
                </div>

                <div className="relative">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddDishToModal(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Chọn món ăn từ danh mục để thêm vào thực đơn --
                    </option>
                    {allDishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name} ({formatVnd(d.price)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 bg-stone-50/70 scrollbar-thin">
                  {formItems.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 text-xs space-y-1.5">
                      <div className="h-10 w-10 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <p className="font-semibold text-stone-600">Chưa có món nào được chọn</p>
                      <p className="text-[11px] text-stone-400">Chọn món ở thanh danh mục phía trên để thêm vào bàn tiệc.</p>
                    </div>
                  ) : (
                    formItems.map((it) => (
                      <div key={it.dishId} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-white rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          <div className="h-9 w-9 rounded-lg overflow-hidden bg-stone-900 shrink-0 border border-stone-200">
                            <img
                              src={it.dish?.imageUrl || DEFAULT_DISH_IMAGE}
                              alt=""
                              onError={handleImageError}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 truncate block">
                              {it.dish?.name || `Món #${it.dishId}`}
                            </span>
                            <span className="text-[11px] text-stone-500 tabular-nums">
                              {formatVnd(it.dish?.price || 0)} / phần
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-stone-500">Số lượng:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.quantityPerTable}
                            onChange={(e) =>
                              handleUpdateModalItemQty(it.dishId, parseInt(e.target.value) || 1)
                            }
                            className="w-14 text-center border border-stone-300 rounded-lg p-1 font-bold text-xs bg-white focus:border-amber-600 focus:outline-none shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveModalItem(it.dishId)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa món khỏi thực đơn"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </form>

            {/* Modal Fixed Footer */}
            <div className="px-6 py-3.5 border-t border-stone-100 bg-stone-50/90 flex justify-end gap-2.5 shrink-0 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 shadow-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="menu-modal-form"
                disabled={saving}
                className="rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editingMenu ? 'Cập nhật thực đơn' : 'Tạo thực đơn mẫu'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
