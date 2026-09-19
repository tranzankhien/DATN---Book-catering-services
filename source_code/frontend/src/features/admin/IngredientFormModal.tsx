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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl overflow-hidden gold-border-glow">
        <div className="flex items-center justify-between border-b border-stone-800 px-7 py-5 bg-stone-950/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black shadow-md">
              <PackagePlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black font-serif-luxury text-white">
                {isEdit ? 'Cập Nhật Nguyên Liệu' : 'Thêm Nguyên Liệu Mới (FR-INV-01)'}
              </h2>
              <p className="text-xs text-stone-400">
                Khai báo đơn vị gốc chuẩn (BR-03) dùng chung cho kho và công thức
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

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              Mã Nguyên Liệu <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: ING-CUA-BIEN"
              className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1.5">
              Tên Nguyên Liệu <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cua biển Cà Mau tươi sống"
              className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Đơn Vị Gốc (BR-03) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, lít, cái..."
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-bold text-stone-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Ngưỡng Tồn Tối Thiểu
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs font-black text-amber-400 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <input
              id="ingActiveCheckbox"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-stone-800 bg-stone-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="ingActiveCheckbox" className="text-xs font-semibold text-stone-300 cursor-pointer">
              Kích hoạt nguyên liệu đang dùng cho thực đơn
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-stone-800 bg-stone-900 px-5 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-800 cursor-pointer"
            >
              Hủy
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
                  <span>Lưu Nguyên Liệu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
