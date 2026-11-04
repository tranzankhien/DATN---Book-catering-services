import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Scale, AlertCircle, Loader2, Save } from 'lucide-react';
import type {
  DishDetailDto,
  IngredientDto,
  RecipeItemRequestPayload,
} from '../../services/types';
import { catalogService } from '../../services/catalogService';
import { extractErrorMessage } from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';

interface RecipeConfigModalProps {
  dish: DishDetailDto;
  ingredients: IngredientDto[];
  onClose: () => void;
  onSaved: (updatedDish: DishDetailDto) => void;
}

export const RecipeConfigModal: React.FC<RecipeConfigModalProps> = ({
  dish,
  ingredients,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [rows, setRows] = useState<RecipeItemRequestPayload[]>(() =>
    dish.recipeItems.length > 0
      ? dish.recipeItems.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: Number(r.quantity),
          note: r.note || '',
        }))
      : [
          {
            ingredientId: ingredients[0]?.id ?? 0,
            quantity: 0.25,
            note: '',
          },
        ]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const handleAddRow = () => {
    const usedIds = new Set(rows.map((r) => r.ingredientId));
    const nextIngredient = ingredients.find((i) => !usedIds.has(i.id)) || ingredients[0];
    if (!nextIngredient) return;
    setRows((prev) => [
      ...prev,
      {
        ingredientId: nextIngredient.id,
        quantity: 0.2,
        note: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleChangeRow = (
    index: number,
    field: keyof RecipeItemRequestPayload,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rows.length === 0) {
      setErrorMsg('Công thức món ăn phải có ít nhất 01 nguyên liệu.');
      return;
    }

    const seenIds = new Set<number>();
    for (const row of rows) {
      if (!row.ingredientId) {
        setErrorMsg('Vui lòng chọn nguyên liệu cho tất cả các dòng.');
        return;
      }
      if (Number.isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
        setErrorMsg('Định lượng nguyên liệu bắt buộc phải lớn hơn 0.');
        return;
      }
      if (seenIds.has(Number(row.ingredientId))) {
        setErrorMsg('Không được chọn trùng lặp cùng một nguyên liệu trong một công thức.');
        return;
      }
      seenIds.add(Number(row.ingredientId));
    }

    setSaving(true);
    try {
      const payload: RecipeItemRequestPayload[] = rows.map((r) => ({
        ingredientId: Number(r.ingredientId),
        quantity: Number(r.quantity),
        note: r.note?.trim() || undefined,
      }));

      const updated = await catalogService.updateDishRecipe(dish.id, payload);
      showToast(`Đã cập nhật công thức cho món "${dish.name}" thành công!`, 'success');
      onSaved(updated);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể cập nhật công thức định lượng.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-3xl lg:max-w-4xl rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white font-bold shadow-xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Định lượng công thức: {dish.name}
              </h2>
              <p className="text-xs text-stone-500">
                Mã món: <span className="text-stone-700 font-semibold tabular-nums">{dish.code}</span> •
                Tính chuẩn cho 01 phần phục vụ (Tự động nhân cấp theo số bàn)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-700 font-bold flex items-center gap-1.5">
              <span>Danh sách nguyên liệu & định mức tiêu hao tiêu chuẩn</span>
            </p>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 text-amber-700" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>

          {/* Table Header for Columns */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3 py-2 rounded-lg bg-stone-100 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            <div className="col-span-5">Nguyên Liệu Trong Kho</div>
            <div className="col-span-3 text-center">Định Lượng / 01 Phần</div>
            <div className="col-span-3">Ghi Chú Sơ Chế / Kỹ Thuật</div>
            <div className="col-span-1 text-center">Xóa</div>
          </div>

          {/* Ingredient Rows Container */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {rows.map((row, idx) => {
              const currentIng = ingredients.find((i) => i.id === Number(row.ingredientId));
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center rounded-xl border border-stone-200 bg-stone-50/70 p-2.5 sm:p-3 hover:bg-stone-50 transition-colors"
                >
                  {/* Column 1: Ingredient Select (5 cols) */}
                  <div className="sm:col-span-5">
                    <label className="text-[10px] font-bold text-stone-500 sm:hidden block mb-1">
                      Nguyên Liệu:
                    </label>
                    <select
                      value={row.ingredientId}
                      onChange={(e) => handleChangeRow(idx, 'ingredientId', Number(e.target.value))}
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 cursor-pointer shadow-xs truncate"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.code} - {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Column 2: Quantity + Unit (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-stone-500 sm:hidden block mb-1">
                      Định Lượng / 1 Phần:
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        value={row.quantity}
                        onChange={(e) => handleChangeRow(idx, 'quantity', Number(e.target.value))}
                        className="w-full rounded-lg border border-stone-300 bg-white pl-3 pr-14 py-2 text-xs text-right font-bold text-amber-700 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-xs"
                        placeholder="0.00"
                      />
                      <span className="absolute right-2 px-1.5 py-0.5 rounded-md bg-stone-100 text-[11px] font-bold text-stone-600 pointer-events-none">
                        {currentIng?.unit || ''}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Processing Note (3 cols) */}
                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-stone-500 sm:hidden block mb-1">
                      Ghi Chú Kỹ Thuật:
                    </label>
                    <input
                      type="text"
                      value={row.note || ''}
                      onChange={(e) => handleChangeRow(idx, 'note', e.target.value)}
                      placeholder="Ghi chú chế biến, cắt tỉa..."
                      className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-xs"
                    />
                  </div>

                  {/* Column 4: Remove Button (1 col) */}
                  <div className="sm:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={rows.length <= 1}
                      className="rounded-lg p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition-colors cursor-pointer"
                      title="Xóa dòng nguyên liệu này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Summary Info */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1 px-1">
            <span>Tổng cộng: <strong className="text-stone-800">{rows.length}</strong> nguyên liệu trong công thức</span>
            <span className="italic text-[11px] text-stone-500">Định mức áp dụng tự động nhân cấp khi khách đặt tiệc</span>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu công thức...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu Công Thức</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
