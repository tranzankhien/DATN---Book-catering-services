import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle, Loader2, Save } from 'lucide-react';
import type { IngredientDto, IngredientUpsertPayload } from '../../services/types';
import { catalogService } from '../../services/catalogService';
import { extractErrorMessage } from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';

interface IngredientFormModalProps {
  initialIngredient?: IngredientDto | null;
  onClose: () => void;
  onSaved: (saved: IngredientDto) => void;
}

export const IngredientFormModal: React.FC<IngredientFormModalProps> = ({
  initialIngredient,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const isEdit = Boolean(initialIngredient);

  const [code, setCode] = useState<string>(initialIngredient?.code || '');
  const [name, setName] = useState<string>(initialIngredient?.name || '');
  const [unit, setUnit] = useState<string>(initialIngredient?.unit || 'kg');
  const [minStockThreshold, setMinStockThreshold] = useState<string>(
    initialIngredient ? String(initialIngredient.minStockThreshold) : '5'
  );
  const [active, setActive] = useState<boolean>(initialIngredient?.active ?? true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || !name.trim() || !unit.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ mã, tên nguyên liệu và đơn vị gốc.');
      return;
    }

    const thresholdNum = Number(minStockThreshold);
    if (Number.isNaN(thresholdNum) || thresholdNum < 0) {
      setErrorMsg('Ngưỡng tồn tối thiểu phải lớn hơn hoặc bằng 0.');
      return;
    }

    const payload: IngredientUpsertPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      unit: unit.trim(),
      minStockThreshold: thresholdNum,
      active,
    };

    setSaving(true);
    try {
      const saved =
        isEdit && initialIngredient
          ? await catalogService.updateIngredient(initialIngredient.id, payload)
          : await catalogService.createIngredient(payload);
      showToast(
        isEdit
          ? `Đã cập nhật nguyên liệu "${saved.name}".`
          : `Đã thêm nguyên liệu "${saved.name}" vào kho trung tâm.`,
        'success'
      );
      onSaved(saved);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể lưu nguyên liệu.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold shadow-xs">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isEdit ? 'Cập Nhật Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
              </h2>
              <p className="text-xs text-stone-500">
                Khai báo đơn vị gốc chuẩn (BR-03) dùng chung cho kho và công thức
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Mã Nguyên Liệu <span className="text-amber-700">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: ING-013"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono font-semibold text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Tên Nguyên Liệu <span className="text-amber-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cua Biển Cà Mau Tươi Sống"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-semibold text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Đơn Vị Gốc <span className="text-amber-700">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEdit && Boolean(initialIngredient?.usedInRecipe)}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, lít, con, phần..."
                title={
                  isEdit && initialIngredient?.usedInRecipe
                    ? 'Đơn vị gốc đã khóa vì nguyên liệu đang được dùng trong công thức món ăn'
                    : undefined
                }
                className={`w-full rounded-lg border px-3 py-2 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 ${
                  isEdit && initialIngredient?.usedInRecipe
                    ? 'border-stone-200 bg-stone-100 text-stone-500 cursor-not-allowed'
                    : 'border-stone-300 bg-white text-stone-900'
                }`}
              />
              {isEdit && initialIngredient?.usedInRecipe && (
                <p className="mt-1 text-[10px] text-amber-800 font-medium">
                  Đã khóa đơn vị do đang dùng trong công thức món ăn.
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Ngưỡng Tồn Tối Thiểu
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-stone-300 text-amber-700 focus:ring-amber-600"
              />
              <span className="font-semibold text-stone-700">
                Cho phép sử dụng trong công thức món ăn (Active)
              </span>
            </label>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stone-200 pt-4 mt-2">
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
                  <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Nguyên Liệu'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
