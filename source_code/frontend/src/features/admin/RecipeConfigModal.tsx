import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold shadow-xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Định Lượng Công Thức: {dish.name}
              </h2>
              <p className="text-xs text-stone-500">
                Mã món: <span className="font-mono text-stone-700 font-semibold">{dish.code}</span> •
                Tính chuẩn cho 01 phần phục vụ
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-600 font-medium">
              Danh sách nguyên liệu và định mức tiêu hao (Quy tắc BR-02)
            </p>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm nguyên liệu</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {rows.map((row, idx) => {
              const currentIng = ingredients.find((i) => i.id === Number(row.ingredientId));
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-2"
                >
                  <select
                    value={row.ingredientId}
                    onChange={(e) => handleChangeRow(idx, 'ingredientId', Number(e.target.value))}
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
                      onChange={(e) => handleChangeRow(idx, 'quantity', Number(e.target.value))}
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-right font-bold text-amber-700 focus:outline-none focus:border-amber-600"
                    />
                    <span className="text-[11px] font-semibold text-stone-500 w-8">
                      {currentIng?.unit || ''}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={row.note || ''}
                    onChange={(e) => handleChangeRow(idx, 'note', e.target.value)}
                    placeholder="Ghi chú chế biến..."
                    className="w-32 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs text-stone-700 focus:outline-none focus:border-amber-600 hidden sm:block"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={rows.length <= 1}
                    className="p-1 text-stone-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                    title="Xóa dòng"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
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
    </div>
  );
};
