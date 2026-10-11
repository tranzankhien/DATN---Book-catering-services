import React, { useEffect, useState } from 'react';
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
import { LoadingState, ErrorState } from '../../components/StatusStates';
import { extractErrorMessage } from '../../services/apiClient';

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
  const [statusFilter, setStatusFilter] = useState<MenuStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

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
        size: 10,
      });
      setMenus(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [keyword, statusFilter, page]);

  const handleToggleStatus = async (menu: MenuDto) => {
    const nextStatus: MenuStatus = menu.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await menuService.updateMenuStatus(menu.id, nextStatus);
      showToast(`Đã chuyển trạng thái thực đơn ${menu.code} sang ${nextStatus}`, 'success');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Quản Lý Thực Đơn Tiệc Mẫu
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Quản lý các bộ thực đơn chuẩn của nhà hàng phục vụ khách hàng đặt tiệc nhanh.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Thực Đơn Mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên thực đơn..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as MenuStatus | '');
              setPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Ngưng áp dụng (INACTIVE)</option>
          </select>
        </div>

        <button
          onClick={fetchMenus}
          className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Menus Table */}
      {loading && <LoadingState message="Đang tải danh sách thực đơn..." />}
      {error && <ErrorState message={error} onRetry={fetchMenus} />}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Tên thực đơn</th>
                  <th className="py-3 px-4">Số món</th>
                  <th className="py-3 px-4">Đơn giá / Bàn</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {menus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      Không tìm thấy thực đơn nào.
                    </td>
                  </tr>
                ) : (
                  menus.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">{m.code}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{m.name}</div>
                        {m.description && (
                          <div className="text-[11px] text-stone-500 line-clamp-1">
                            {m.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-700">{m.itemsCount} món</td>
                      <td className="py-3.5 px-4 font-serif font-bold text-stone-900 text-sm">
                        {formatVnd(m.pricePerTable)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                            m.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {m.status === 'ACTIVE' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Tạm dừng
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditModal(m)}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-amber-50 hover:text-amber-800 text-stone-600 transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <Edit2 className="w-3 h-3" /> Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Upsert Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                {editingMenu ? `Chỉnh Sửa Thực Đơn (${editingMenu.code})` : 'Tạo Thực Đơn Tiệc Mẫu Mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="flex-1 overflow-y-auto py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Tên thực đơn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Set Menu Hỷ Sự Hoàng Gia"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả phong vị, ý nghĩa món ăn..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Ảnh đại diện URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Dish Items Selector */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Danh sách món trong bàn ({formItems.length} món)
                  </label>
                  <span className="text-xs font-serif font-bold text-amber-800">
                    Đơn giá tính toán: {formatVnd(calculatedModalPrice)}
                  </span>
                </div>

                {/* Add dish dropdown */}
                <div className="flex gap-2 mb-3">
                  <select
                    id="add-dish-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddDishToModal(Number(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" disabled>
                      -- Chọn món ăn từ catalog để thêm vào thực đơn --
                    </option>
                    {allDishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name} ({formatVnd(d.price)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected dish items table */}
                <div className="max-h-48 overflow-y-auto divide-y divide-stone-100 border border-stone-200 rounded-xl p-2 bg-stone-50/50">
                  {formItems.length === 0 ? (
                    <div className="py-4 text-center text-stone-400 text-xs">
                      Chưa chọn món nào cho thực đơn.
                    </div>
                  ) : (
                    formItems.map((it) => (
                      <div key={it.dishId} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="font-semibold text-stone-900 truncate block">
                            {it.dish?.name || `Món #${it.dishId}`}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {formatVnd(it.dish?.price || 0)} / phần
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-500">Số phần/bàn:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.quantityPerTable}
                            onChange={(e) =>
                              handleUpdateModalItemQty(it.dishId, parseInt(e.target.value) || 1)
                            }
                            className="w-12 text-center border border-stone-300 rounded p-1 font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveModalItem(it.dishId)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-sm"
                >
                  {saving ? 'Đang lưu...' : editingMenu ? 'Cập Nhật' : 'Tạo Thực Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
