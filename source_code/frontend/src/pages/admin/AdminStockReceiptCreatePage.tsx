import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  Truck,
  Boxes,
  Coins,
  CheckCircle2,
  Save,
  HelpCircle,
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { inventoryService } from '../../services/inventoryService';
import type {
  IngredientDto,
  StockReceiptCreatePayload,
  StockReceiptItemRequestPayload,
  SupplierDto,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';

interface FormItem {
  id: string; // client temporary key
  ingredientId: number;
  quantity: number;
  unitPrice: number;
  note: string;
}

export const AdminStockReceiptCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Form State
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [note, setNote] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState<string>('');

  const [items, setItems] = useState<FormItem[]>([
    { id: 'item-1', ingredientId: 0, quantity: 1, unitPrice: 0, note: '' },
  ]);

  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingInitial(true);
        const [supList, ingList] = await Promise.all([
          supplierService.getSuppliers({ active: true }),
          inventoryService.getInventoryIngredients({ active: true }),
        ]);
        setSuppliers(supList);
        setIngredients(ingList);
        if (supList.length > 0) {
          setSupplierId(supList[0].id);
        }
      } catch {
        showToast('Không thể tải danh sách nhà cung cấp hoặc nguyên liệu', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };
    init();
  }, []);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        ingredientId: 0,
        quantity: 1,
        unitPrice: 0,
        note: '',
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      showToast('Phiếu nhập phải có ít nhất 1 dòng nguyên liệu', 'error');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, patch: Partial<FormItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      // Nếu chọn nguyên liệu, tự động điền đơn giá tham khảo nếu đơn giá đang là 0
      if (patch.ingredientId) {
        const found = ingredients.find((ing) => ing.id === patch.ingredientId);
        if (found && next[index].unitPrice === 0 && found.avgUnitCost > 0) {
          next[index].unitPrice = Math.round(found.avgUnitCost);
        }
      }
      return next;
    });
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => {
      const line = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + (isNaN(line) ? 0 : line);
    }, 0);
  };

  const totalAmount = calculateTotal();
  const remainingDebt = Math.max(0, totalAmount - (amountPaid || 0));

  const handleSubmit = async (confirmImmediately: boolean) => {
    if (!supplierId) {
      showToast('Vui lòng chọn nhà cung cấp', 'error');
      return;
    }

    // Validate items
    const invalidItem = items.find((i) => !i.ingredientId || i.quantity <= 0 || i.unitPrice < 0);
    if (invalidItem) {
      showToast('Vui lòng chọn nguyên liệu, số lượng > 0 và đơn giá >= 0 cho tất cả các dòng', 'error');
      return;
    }

    // Check duplicate ingredients in items
    const ingIds = items.map((i) => i.ingredientId);
    const hasDup = new Set(ingIds).size !== ingIds.length;
    if (hasDup) {
      showToast('Mỗi nguyên liệu chỉ nên xuất hiện 1 dòng trong cùng một phiếu nhập', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: StockReceiptCreatePayload = {
        supplierId: Number(supplierId),
        receiptDate,
        note: note.trim() || undefined,
        paymentNote: paymentNote.trim() || undefined,
        amountPaid: 0,
        confirmImmediately,
        items: items.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          note: i.note.trim() || undefined,
        })),
      };

      const res = await inventoryService.createStockReceipt(payload);
      showToast(
        confirmImmediately
          ? `Đã tạo và xác nhận nhập kho phiếu ${res.code} thành công!`
          : `Đã lưu bản nháp phiếu ${res.code} thành công!`,
        'success'
      );
      navigate(`/admin/inventory/receipts/${res.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi khi tạo phiếu nhập';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventory/receipts"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
              <Receipt className="h-4 w-4" />
              <span>Chứng từ kho & nhập hàng</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
              Tạo phiếu nhập nguyên liệu mới
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier & Items (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Header Box */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-700" />
              <span>Thông tin nhà cung cấp & ngày nhập</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Ngày nhập hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>
            </div>

            {selectedSupplier && (
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong>Mã NCC:</strong> {selectedSupplier.code}
                </span>
                <span>
                  <strong>Hotline:</strong> {selectedSupplier.phone}
                </span>
                {selectedSupplier.address && (
                  <span>
                    <strong>Địa chỉ:</strong> {selectedSupplier.address}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items Table Box */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-600" />
                <span>Danh Sách Nguyên Liệu Nhập ({items.length})</span>
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm dòng</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((row, index) => {
                const selectedIng = ingredients.find((i) => i.id === row.ingredientId);
                const lineTotal = (row.quantity || 0) * (row.unitPrice || 0);

                return (
                  <div
                    key={row.id}
                    className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>Dòng #{index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                          title="Xóa dòng này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Select Ingredient (5 cols) */}
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Nguyên liệu <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={row.ingredientId}
                          onChange={(e) => updateItem(index, { ingredientId: Number(e.target.value) })}
                          required
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600"
                        >
                          <option value="0">-- Chọn nguyên liệu --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.code} - {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (2 cols) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Số lượng <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={row.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            required
                            className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 font-mono text-stone-900 focus:outline-none focus:border-amber-600"
                          />
                        </div>
                      </div>

                      {/* Unit Price (3 cols) */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Đơn giá (₫) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          value={row.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          required
                          className="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-200 font-mono text-stone-900 focus:outline-none focus:border-amber-600"
                        />
                      </div>

                      {/* Line Total (2 cols) */}
                      <div className="sm:col-span-2 text-right">
                        <span className="block text-[10px] text-stone-400 font-medium">Thành tiền</span>
                        <span className="font-mono font-bold text-stone-900 text-xs block py-2">
                          {formatVnd(lineTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Note row */}
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Ghi chú quy cách đóng gói, chất lượng hàng (tùy chọn)..."
                        value={row.note}
                        onChange={(e) => updateItem(index, { note: e.target.value })}
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 bg-white/70 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Calculation & Actions (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm space-y-4 text-xs sticky top-20">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <Coins className="h-4 w-4 text-amber-600" />
              <span>Tổng Kết & Thanh Toán</span>
            </h2>

            {/* Subtotal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-600">
                <span>Tổng tiền hàng:</span>
                <span className="font-mono font-bold text-sm text-stone-900">{formatVnd(totalAmount)}</span>
              </div>

              {/* Quy tắc thanh toán BR-11 */}
              <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="font-semibold text-stone-700">Quy chuẩn thanh toán (SRS BR-11):</p>
                <p className="mt-0.5 text-stone-500">
                  Phiếu nhập tạo mới mặc định ở trạng thái <strong>Chưa thanh toán (UNPAID)</strong>. Quản trị viên sẽ ghi nhận thanh toán toàn bộ cho NCC sau khi xác nhận nhập kho.
                </p>
              </div>
            </div>

            {/* Payment Note */}
            <div className="pt-2 border-t border-stone-100 space-y-1">
              <label className="block font-bold text-stone-700">Ghi chú thanh toán</label>
              <input
                type="text"
                placeholder="VD: Chuyển khoản Vietcombank, tiền mặt..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 text-xs"
              />
            </div>

            {/* General Note */}
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Ghi chú chung phiếu nhập</label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm về lô hàng, nhân viên nhận hàng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 text-xs"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                title="Cộng kho ngay và tính lại giá vốn bình quân di động"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? 'Đang xử lý...' : 'Xác Nhận Nhập Kho Ngay'}</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
                title="Lưu bản nháp để đối soát sau, chưa làm tăng tồn kho"
              >
                <Save className="h-4 w-4" />
                <span>Lưu Bản Nháp</span>
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-[11px] text-stone-500 space-y-1">
              <div className="flex items-center gap-1 font-bold text-stone-700">
                <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Quy tắc vận hành:</span>
              </div>
              <p>• Bản nháp có thể chỉnh sửa hoặc xóa bất cứ lúc nào.</p>
              <p>• Khi xác nhận nhập kho, hệ thống tự động tăng tồn kho và tính lại giá vốn di động liên hoàn.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

