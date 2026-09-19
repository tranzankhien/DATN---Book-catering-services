import React, { useState } from 'react';
import { X, Plus, Trash2, UtensilsCrossed, AlertCircle, Loader2, Save, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] gold-border-glow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-7 py-5 bg-stone-950/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black shadow-md">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif-luxury text-white">
                {isEdit ? `Chỉnh sửa món ăn: ${initialDish?.name}` : 'Thêm Món Ăn Mới (FR-CAT-02)'}
              </h2>
              <p className="text-xs text-stone-400">
                Khai báo thông tin món tiệc, đơn giá 01 phần (VND) và công thức nguyên liệu chuẩn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Mã Món Ăn <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: DISH-011"
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Tên Món Ăn <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bào Ngư Vi Cá Sốt Hoàng Kim"
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Danh Mục Món <span className="text-amber-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-stone-200 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Đơn Giá / 01 Phần (VND) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-black text-amber-400 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">Trạng Thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DishStatus)}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-stone-200 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="ACTIVE">Đang phục vụ (ACTIVE)</option>
                <option value="HIDDEN">Đang ẩn (HIDDEN)</option>
              </select>
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                URL Hình Ảnh Món Ăn
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-stone-300 mb-1.5">Mô Tả Ẩm Thực</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả hương vị, nguyên liệu chủ đạo và tiêu chuẩn phục vụ..."
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Recipe Items Section */}
          <div className="border-t border-stone-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Công Thức Định Lượng Cho 01 Phần Món (FR-REC-01)
                </h3>
                <p className="text-[11px] text-stone-400">
                  Bắt buộc tối thiểu 01 nguyên liệu, định lượng &gt; 0 (chuẩn kg, lít...)
                </p>
              </div>
              <button
                type="button"
                onClick={addRecipeRow}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm dòng nguyên liệu</span>
              </button>
            </div>

            <div className="space-y-3">
              {recipeRows.map((row, idx) => {
                const ing = ingredients.find((i) => i.id === Number(row.ingredientId));
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-2xl border border-stone-800 bg-stone-950/70 p-3.5"
                  >
                    <div className="sm:col-span-5">
                      <select
                        value={row.ingredientId}
                        onChange={(e) =>
                          updateRecipeRow(idx, 'ingredientId', Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-bold text-stone-200 cursor-pointer"
                      >
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        value={row.quantity}
                        onChange={(e) => updateRecipeRow(idx, 'quantity', e.target.value)}
                        className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-black text-amber-400 font-mono"
                      />
                      <span className="text-xs font-bold text-stone-400 shrink-0">
                        {ing?.unit || ''}
                      </span>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={row.note || ''}
                        onChange={(e) => updateRecipeRow(idx, 'note', e.target.value)}
                        placeholder="Ghi chú sơ chế"
                        className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-300"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        disabled={recipeRows.length <= 1}
                        onClick={() => removeRecipeRow(idx)}
                        className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-2 text-rose-400 hover:bg-rose-950/60 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-stone-800 bg-stone-900 px-5 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-800 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-6 py-2.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/20 hover:scale-102 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Món Ăn Mới'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
