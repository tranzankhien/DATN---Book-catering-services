import React, { useState } from 'react';
import { X, Plus, Trash2, UtensilsCrossed, AlertCircle, Loader2, Save } from 'lucide-react';
import type {
  CategoryDto,
  DishDetailDto,
  DishStatus,
  DishUpsertPayload,
  IngredientDto,
  RecipeItemRequestPayload,
} from '../../services/types';
import { catalogService } from '../../services/catalogService';
import { extractErrorMessage } from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';

interface DishFormModalProps {
  initialDish?: DishDetailDto | null;
  categories: CategoryDto[];
  ingredients: IngredientDto[];
  onClose: () => void;
  onSaved: (savedDish: DishDetailDto) => void;
}

export const DishFormModal: React.FC<DishFormModalProps> = ({
  initialDish,
  categories,
  ingredients,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const isEdit = Boolean(initialDish);

  const [code, setCode] = useState<string>(initialDish?.code || '');
  const [name, setName] = useState<string>(initialDish?.name || '');
  const [categoryId, setCategoryId] = useState<number>(
    initialDish?.categoryId || categories[0]?.id || 0
  );
  const [price, setPrice] = useState<string>(
    initialDish ? String(Math.round(Number(initialDish.price))) : '350000'
  );
  const [status, setStatus] = useState<DishStatus>(initialDish?.status || 'ACTIVE');
  const [imageUrl, setImageUrl] = useState<string>(initialDish?.imageUrl || '');
  const [description, setDescription] = useState<string>(initialDish?.description || '');

  const [recipeRows, setRecipeRows] = useState<RecipeItemRequestPayload[]>(() => {
    if (initialDish && initialDish.recipeItems.length > 0) {
      return initialDish.recipeItems.map((r) => ({
        ingredientId: r.ingredientId,
        quantity: Number(r.quantity),
        note: r.note || '',
      }));
    }
    return ingredients.length > 0
      ? [{ ingredientId: ingredients[0].id, quantity: 0.3, note: '' }]
      : [];
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const addRecipeRow = () => {
    const usedIds = new Set(recipeRows.map((r) => Number(r.ingredientId)));
    const nextIng = ingredients.find((i) => !usedIds.has(i.id)) || ingredients[0];
    if (!nextIng) return;
    setRecipeRows((prev) => [
      ...prev,
      { ingredientId: nextIng.id, quantity: 0.2, note: '' },
    ]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipeRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRecipeRow = (
    index: number,
    field: keyof RecipeItemRequestPayload,
    value: string | number
  ) => {
    setRecipeRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || !name.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ mã món ăn và tên món ăn.');
      return;
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 1000) {
      setErrorMsg('Giá bán một phần món phải từ 1.000 VND trở lên.');
      return;
    }

    if (recipeRows.length === 0) {
      setErrorMsg('Mỗi món ăn bắt buộc phải có ít nhất 01 nguyên liệu trong công thức.');
      return;
    }

    const seenIds = new Set<number>();
    for (const row of recipeRows) {
      if (Number.isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
        setErrorMsg('Định lượng nguyên liệu bắt buộc phải lớn hơn 0.');
        return;
      }
      if (seenIds.has(Number(row.ingredientId))) {
        setErrorMsg('Không được chọn trùng lặp cùng một nguyên liệu trong một món ăn.');
        return;
      }
      seenIds.add(Number(row.ingredientId));
    }

    const payload: DishUpsertPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      categoryId: Number(categoryId),
      price: numericPrice,
      status,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      recipeItems: recipeRows.map((r) => ({
        ingredientId: Number(r.ingredientId),
        quantity: Number(r.quantity),
        note: r.note?.trim() || undefined,
      })),
    };

    setSaving(true);
    try {
      const saved =
        isEdit && initialDish
          ? await catalogService.updateDish(initialDish.id, payload)
          : await catalogService.createDish(payload);
      showToast(
        isEdit
          ? `Đã cập nhật món ăn "${saved.name}" thành công.`
          : `Đã tạo món ăn "${saved.name}" thành công.`,
        'success'
      );
      onSaved(saved);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể lưu thông tin món ăn.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold shadow-xs">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isEdit ? `Chỉnh sửa món ăn: ${initialDish?.name}` : 'Thêm món ăn mới'}
              </h2>
              <p className="text-xs text-stone-500">
                Khai báo thông tin món, đơn giá 01 phần (VND) và công thức nguyên liệu chuẩn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block font-semibold text-stone-700 mb-1">
                Mã món ăn <span className="text-amber-700">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: DISH-011"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono font-semibold text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="block font-semibold text-stone-700 mb-1">
                Tên món ăn <span className="text-amber-700">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bào Ngư Vi Cá Sốt Hoàng Kim"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-semibold text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block font-semibold text-stone-700 mb-1">
                Danh mục <span className="text-amber-700">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-medium text-stone-800 focus:border-amber-600 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block font-semibold text-stone-700 mb-1">
                Đơn giá / 01 phần (VND) <span className="text-amber-700">*</span>
              </label>
              <input
                type="number"
                min={1000}
                step={1}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-bold text-amber-700 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block font-semibold text-stone-700 mb-1">
                Trạng thái phục vụ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DishStatus)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-medium text-stone-800 focus:border-amber-600 focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">Phục vụ (ACTIVE)</option>
                <option value="HIDDEN">Tạm ẩn (HIDDEN)</option>
              </select>
            </div>

            <div className="sm:col-span-12">
              <label className="block font-semibold text-stone-700 mb-1">
                Đường dẫn hình ảnh (URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block font-semibold text-stone-700 mb-1">
                Mô tả hương vị & thành phần
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả tóm tắt món ăn phục vụ theo chuẩn tiệc cưới..."
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          {/* Recipe Configuration Table */}
          <div className="border-t border-stone-200 pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900">
                  Công thức định lượng nguyên liệu (01 phần)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Quy tắc BR-02: Định lượng bắt buộc &gt; 0, dùng đơn vị gốc của kho
                </p>
              </div>

              <button
                type="button"
                onClick={addRecipeRow}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm nguyên liệu</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recipeRows.map((row, idx) => {
                const selectedIng = ingredients.find(
                  (i) => i.id === Number(row.ingredientId)
                );
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2"
                  >
                    <select
                      value={row.ingredientId}
                      onChange={(e) =>
                        updateRecipeRow(idx, 'ingredientId', Number(e.target.value))
                      }
                      className="flex-1 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-600 cursor-pointer"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.code} - {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 w-28 shrink-0">
                      <input
                        type="number"
                        step="0.01"
                        min="0.001"
                        required
                        value={row.quantity}
                        onChange={(e) =>
                          updateRecipeRow(idx, 'quantity', Number(e.target.value))
                        }
                        className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-right font-bold text-amber-700 focus:outline-none focus:border-amber-600"
                      />
                      <span className="text-[11px] font-semibold text-stone-500 w-8">
                        {selectedIng?.unit || ''}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={row.note || ''}
                      onChange={(e) => updateRecipeRow(idx, 'note', e.target.value)}
                      placeholder="Ghi chú chế biến..."
                      className="w-36 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 focus:outline-none focus:border-amber-600 hidden sm:block"
                    />

                    <button
                      type="button"
                      onClick={() => removeRecipeRow(idx)}
                      disabled={recipeRows.length <= 1}
                      className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      title="Xóa dòng"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Món Ăn'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
