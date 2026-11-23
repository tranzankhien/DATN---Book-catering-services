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
  Calendar,
  Building2,
  Phone,
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { inventoryService } from '../../services/inventoryService';
import type {
  IngredientDto,
  StockReceiptCreatePayload,
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
    return `${Math.round(val || 0).toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 animate-fade-up-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventory/receipts"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
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
              Tạo phiếu nhập nguyên liệu
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Phiếu mới (Bản thảo)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Section: Supplier Info & Invoice Items Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Supplier Info Bar */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-3.5 text-xs">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-700" />
              <span>Thông tin nhà cung cấp & ngày chứng từ</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-7">
                <label className="block font-semibold text-stone-700 mb-1">
                  Nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-stone-700 mb-1">
                  Ngày nhập hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 tabular-nums shadow-2xs font-medium text-stone-900"
                />
              </div>

              {selectedSupplier && (
                <div className="sm:col-span-12 flex flex-wrap items-center gap-3 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <span className="flex items-center gap-1 font-semibold text-stone-800">
                    <Building2 className="h-3.5 w-3.5 text-amber-700" />
                    <span>Mã NCC: {selectedSupplier.code}</span>
                  </span>
                  <span className="flex items-center gap-1 text-stone-600">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    <span>{selectedSupplier.phone}</span>
                  </span>
                  {selectedSupplier.address && (
                    <span className="text-stone-500 truncate max-w-md">
                      • {selectedSupplier.address}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Receipt Items Table Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-700" />
                <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                  Danh mục nguyên liệu nhập ({items.length} mặt hàng)
                </h2>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm dòng</span>
              </button>
            </div>

            {/* Clean Invoice Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Nguyên liệu</th>
                    <th className="py-2.5 px-3 w-28 text-right">Số lượng</th>
                    <th className="py-2.5 px-2 w-16 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 w-36 text-right">Đơn giá (₫)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Thành tiền (₫)</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Ghi chú</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((row, index) => {
                    const selectedIng = ingredients.find((i) => i.id === row.ingredientId);
                    const lineTotal = (row.quantity || 0) * (row.unitPrice || 0);

                    return (
                      <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                        {/* Index */}
                        <td className="py-2 px-3 text-center text-stone-400 font-mono text-xs">
                          {index + 1}
                        </td>

                        {/* Ingredient Select */}
                        <td className="py-2 px-3">
                          <select
                            value={row.ingredientId}
                            onChange={(e) => updateItem(index, { ingredientId: Number(e.target.value) })}
                            required
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-300 bg-white font-medium text-stone-800 focus:outline-none focus:border-amber-600 shadow-2xs"
                          >
                            <option value="0">-- Chọn nguyên liệu --</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.code} - {ing.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={row.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            required
                            className="w-full px-2.5 py-1.5 text-xs text-right rounded-xl border border-stone-300 tabular-nums font-bold text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                          />
                        </td>

                        {/* Unit */}
                        <td className="py-2 px-2 text-center">
                          <span className="inline-block px-2 py-1 rounded-lg bg-stone-100 text-stone-600 font-bold text-[11px]">
                            {selectedIng?.unit || '--'}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            value={row.unitPrice}
                            onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                            required
                            className="w-full px-2.5 py-1.5 text-xs text-right rounded-xl border border-stone-300 tabular-nums font-medium text-stone-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-3 text-right font-bold text-stone-900 tabular-nums">
                          {formatVnd(lineTotal)}
                        </td>

                        {/* Note */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Quy cách, hạn dùng..."
                            value={row.note}
                            onChange={(e) => updateItem(index, { note: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-[11px] rounded-xl border border-stone-200 text-stone-700 focus:outline-none focus:border-amber-600 shadow-2xs"
                          />
                        </td>

                        {/* Delete Button */}
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Summary & Action Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 sticky top-20">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <Coins className="h-4 w-4 text-amber-700" />
              <span>Tổng kết giá trị phiếu nhập</span>
            </h2>

            {/* Total Amount Callout */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide">
                Tổng tiền thanh toán
              </span>
              <div className="text-2xl font-black text-amber-950 tabular-nums">
                {formatVnd(totalAmount)}
              </div>
              <p className="text-[11px] text-amber-800">
                Gồm {items.length} mặt hàng nguyên vật liệu
              </p>
            </div>

            {/* Note Fields */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ghi chú phiếu nhập
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về tình trạng hàng, biên bản giao nhận..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:border-amber-600 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Ghi chú thanh toán
                </label>
                <input
                  type="text"
                  placeholder="VD: Chuyển khoản Vietcombank, nợ 15 ngày..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:border-amber-600 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs text-center leading-snug"
                title="Lưu bản nháp để đối soát, chưa tăng tồn kho"
              >
                <Save className="h-4 w-4 shrink-0 text-stone-500" />
                <span>Lưu Bản Nháp</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center leading-snug"
                title="Cộng tồn kho ngay lập tức và tính lại giá vốn di động"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{submitting ? 'Đang lưu...' : 'Xác Nhận Nhập Kho Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
