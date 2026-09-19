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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] gold-border-glow">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-7 py-5 bg-stone-950/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black shadow-md">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif-luxury text-white">
                Cấu Hình Công Thức Định Lượng (FR-REC-01 / FR-REC-02)
              </h2>
              <p className="text-xs text-stone-400">
                Món: <strong className="text-amber-400">{dish.name}</strong> ({dish.code}) — Định mức cho 01 phần/bàn
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-7 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row, idx) => {
              const selectedIng = ingredients.find((i) => i.id === Number(row.ingredientId));
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-2xl border border-stone-800 bg-stone-950/70 p-4"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Nguyên Liệu #{idx + 1}
                    </label>
                    <select
                      value={row.ingredientId}
                      onChange={(e) =>
                        handleChangeRow(idx, 'ingredientId', Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-bold text-stone-200 cursor-pointer"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.code} - {ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Định Lượng ({selectedIng?.unit || 'gốc'}) &gt; 0
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={row.quantity}
                      onChange={(e) => handleChangeRow(idx, 'quantity', e.target.value)}
                      className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-black text-amber-400 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Ghi Chú Sơ Chế
                    </label>
                    <input
                      type="text"
                      value={row.note || ''}
                      onChange={(e) => handleChangeRow(idx, 'note', e.target.value)}
                      placeholder="VD: Thái mỏng, ướp tiêu"
                      className="w-full rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-300"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-4">
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-2 text-rose-400 hover:bg-rose-950/60 disabled:opacity-30 cursor-pointer"
                      title="Xóa nguyên liệu này"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm dòng nguyên liệu</span>
          </button>

          {/* Footer */}
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
                  <span>Lưu Công Thức Định Lượng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
