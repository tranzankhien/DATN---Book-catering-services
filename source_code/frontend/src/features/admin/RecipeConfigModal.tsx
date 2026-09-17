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
      showToast(`Đã lưu công thức định lượng cho món "${dish.name}".`, 'success');
      onSaved(updated);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể lưu công thức định lượng.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-stone-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Cấu hình công thức định lượng (FR-REC-01 / FR-REC-02)
              </h2>
              <p className="text-xs text-stone-500">
                Món ăn: <strong className="text-stone-800">{dish.name}</strong> ({dish.code}) — Định
                lượng tính cho 01 phần món
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, idx) => {
              const selectedIng = ingredients.find((i) => i.id === Number(row.ingredientId));
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Nguyên liệu #{idx + 1}
                    </label>
                    <select
                      value={row.ingredientId}
                      onChange={(e) =>
                        handleChangeRow(idx, 'ingredientId', Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.code} - {ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Định lượng ({selectedIng?.unit || 'đơn vị'}) &gt; 0
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={row.quantity}
                      onChange={(e) => handleChangeRow(idx, 'quantity', e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Ghi chú sơ chế
                    </label>
                    <input
                      type="text"
                      value={row.note || ''}
                      onChange={(e) => handleChangeRow(idx, 'note', e.target.value)}
                      placeholder="VD: Thái lát mỏng"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-4">
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      className="rounded-xl border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
                      title="Xóa thành phần nguyên liệu này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm dòng nguyên liệu</span>
          </button>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu công thức định lượng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
