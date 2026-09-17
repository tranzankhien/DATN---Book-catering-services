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
          : `Đã thêm nguyên liệu "${saved.name}" vào danh mục.`,
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isEdit ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu mới (FR-INV-01)'}
              </h2>
              <p className="text-xs text-stone-500">
                Khai báo đơn vị gốc chuẩn dùng chung cho kho và công thức
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Mã nguyên liệu <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: ING-CUA-BIEN"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-mono font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Tên nguyên liệu <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cua biển Cà Mau tươi sống"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Đơn vị gốc (BR-03) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, lít, cái..."
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ngưỡng tồn tối thiểu
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="ingActiveCheckbox"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="ingActiveCheckbox" className="text-xs font-medium text-stone-700">
              Nguyên liệu đang hoạt động
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu nguyên liệu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
