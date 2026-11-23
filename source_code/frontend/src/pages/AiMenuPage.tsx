import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Utensils,
  Calendar,
  Users,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Info,
  Clock,
  Layers,
  ChefHat,
  ChevronRight,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { aiMenuService } from '../services/aiMenuService';
import type {
  AiMenuRecommendationRequestPayload,
  AiMenuRecommendationResponse,
  BudgetType,
  MenuSuggestionDto,
} from '../services/types';
import { extractErrorMessage } from '../services/apiClient';
import { formatVnd } from '../hooks/useFormatters';
import { DEFAULT_DISH_IMAGE, DEFAULT_MENU_IMAGE, handleImageError } from '../lib/imageConstants';
import { extractAiMenuParameters } from '../utils/aiMenuParser';

const EVENT_TYPE_OPTIONS = [
  'Tiệc sinh nhật',
  'Liên hoan công ty',
  'Tiệc gia đình',
  'Tiệc cưới / Đính hôn',
  'Thôi nôi / Đầy tháng',
  'Hội nghị / Sự kiện',
];

export const AiMenuPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [requestText, setRequestText] = useState('');
  const [eventType, setEventType] = useState('Tiệc sinh nhật');
  const [tableCount, setTableCount] = useState<number>(5);
  const [guestsPerTable, setGuestsPerTable] = useState<number>(6);
  const [budgetType, setBudgetType] = useState<BudgetType>('PER_TABLE');
  const [budgetAmount, setBudgetAmount] = useState<string>('1500000');
  const [perPersonBudget, setPerPersonBudget] = useState<number | null>(null);
  const [explicitTotalGuests, setExplicitTotalGuests] = useState<number | null>(null);
  const [preferences, setPreferences] = useState('');
  const [excludedIngredients, setExcludedIngredients] = useState('');

  // Execution & Response State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiMenuRecommendationResponse | null>(null);
  const [submittedPayload, setSubmittedPayload] = useState<AiMenuRecommendationRequestPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);

  // In-flight request tracking to eliminate race conditions from form modifications
  const activeRequestIdRef = useRef<number>(0);

  const invalidateInFlightRequest = () => {
    activeRequestIdRef.current++;
    setLoading(false);
    setResponse(null);
  };

  const handleRequestTextChange = (text: string) => {
    invalidateInFlightRequest();
    setRequestText(text);

    if (!text.trim()) {
      setDetectedSummary(null);
      setPerPersonBudget(null);
      setExplicitTotalGuests(null);
      return;
    }

    const extracted = extractAiMenuParameters(text);
    const parts: string[] = [];

    if (extracted.totalGuests && extracted.totalGuests > 0) {
      setExplicitTotalGuests(extracted.totalGuests);
    } else {
      setExplicitTotalGuests(null);
    }

    if (extracted.detectedFields.tableCount && extracted.tableCount) {
      setTableCount(extracted.tableCount);
      parts.push(`${extracted.tableCount} bàn`);
    }

    if (extracted.detectedFields.guestsPerTable && extracted.guestsPerTable) {
      setGuestsPerTable(extracted.guestsPerTable);
      parts.push(`${extracted.guestsPerTable} người/bàn`);
    }

    if (extracted.detectedFields.budget && extracted.budgetAmount) {
      setBudgetAmount(extracted.budgetAmount.toString());
      if (extracted.budgetType) {
        setBudgetType(extracted.budgetType);
      }
      setPerPersonBudget(extracted.perPersonBudget ?? null);
      const typeLabel = extracted.perPersonBudget
        ? ` (${formatVnd(extracted.perPersonBudget)}/người)`
        : extracted.budgetType === 'TOTAL_ORDER'
        ? ' (tổng tiệc)'
        : '/bàn';
      parts.push(`Ngân sách: ${formatVnd(extracted.budgetAmount)}${typeLabel}`);
    } else {
      setPerPersonBudget(null);
    }

    if (extracted.detectedFields.eventType && extracted.eventType) {
      setEventType(extracted.eventType);
      parts.push(extracted.eventType);
    }

    if (extracted.detectedFields.excludedIngredients && extracted.excludedIngredients) {
      setExcludedIngredients(extracted.excludedIngredients);
      parts.push(`Tránh: ${extracted.excludedIngredients}`);
    }

    if (extracted.detectedFields.preferences && extracted.preferences) {
      setPreferences(extracted.preferences);
    }

    setDetectedSummary(parts.length > 0 ? parts.join(' • ') : null);
  };

  const handleRemoveAllergen = (itemToRemove: string) => {
    invalidateInFlightRequest();
    const currentList = excludedIngredients
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = currentList
      .filter((it) => it.toLowerCase() !== itemToRemove.toLowerCase())
      .join(', ');
    setExcludedIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để sử dụng tính năng gợi ý thực đơn thông minh.', 'info');
      navigate('/login?redirect=/ai-menu');
      return;
    }

    if (!requestText.trim()) {
      setError('Vui lòng nhập mô tả nhu cầu bữa tiệc của bạn.');
      return;
    }

    if (requestText.length > 500) {
      setError('Mô tả nhu cầu không được vượt quá 500 ký tự.');
      return;
    }

    const parsedBudget = budgetAmount ? parseFloat(budgetAmount.replace(/\D/g, '')) : undefined;
    if (parsedBudget !== undefined && parsedBudget <= 0) {
      setError('Ngân sách dự kiến phải lớn hơn 0.');
      return;
    }

    const currentReqId = ++activeRequestIdRef.current;
    setLoading(true);
    setError(null);

    const payload: AiMenuRecommendationRequestPayload = {
      requestText: requestText.trim(),
      eventType: eventType.trim() || undefined,
      tableCount: Math.max(1, tableCount),
      guestsPerTable: Math.max(1, guestsPerTable),
      budgetAmount: parsedBudget,
      budgetType,
      preferences: preferences.trim() || undefined,
      excludedIngredients: excludedIngredients.trim(),
    };

    setSubmittedPayload(payload);

    try {
      const res = await aiMenuService.getRecommendations(payload);
      if (currentReqId !== activeRequestIdRef.current) {
        // Discard stale in-flight response when user edited form or fired newer query
        return;
      }
      setResponse(res);
      if (res.suggestions.length === 0) {
        showToast('Không tìm thấy thực đơn phù hợp với ngân sách hoặc tồn kho hiện tại.', 'info');
      } else {
        showToast('Đã tạo gợi ý thực đơn thành công!', 'success');
      }
    } catch (err) {
      if (currentReqId !== activeRequestIdRef.current) {
        return;
      }
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectMenuAndCustomize = (suggestion: MenuSuggestionDto) => {
    try {
      const STORAGE_KEY = 'banquethub_builder_draft';
      const items = suggestion.items.map((it) => ({
        dishId: it.dishId,
        quantityPerTable: it.quantityPerTable || 1,
      }));

      const finalTables = submittedPayload?.tableCount ?? suggestion.tableCount ?? tableCount;
      const finalGuestsPerTable = submittedPayload?.guestsPerTable ?? guestsPerTable;
      const finalGuestCount = explicitTotalGuests && explicitTotalGuests > 0
        ? explicitTotalGuests
        : (finalTables * finalGuestsPerTable);

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items,
          tableCount: finalTables,
          guestsPerTable: finalGuestsPerTable,
          guestCount: finalGuestCount,
        })
      );
      showToast(`Đã chọn "${suggestion.name}". Đang mở trình phối thực đơn để bạn tùy biến...`, 'success');
      navigate('/menu-builder');
    } catch {
      navigate('/menu-builder');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-up-1">
      {/* Main Input Form */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  AI gợi ý thực đơn tiệc thông minh
                </h1>
                <p className="text-xs text-stone-500">
                  Nhập mô tả bữa tiệc, AI Gemini sẽ đối soát định mức và tồn kho nguyên liệu thực tế.
                </p>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-1.5 flex items-center gap-2 text-xs shrink-0">
                <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span className="font-semibold text-stone-800">Cần đăng nhập</span>
                <Link
                  to="/login?redirect=/ai-menu"
                  className="font-bold text-amber-800 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Đăng nhập ngay <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <span className="text-xs text-stone-500 font-medium hidden sm:inline-block">
                Tự động trích xuất số bàn, khách và ngân sách
              </span>
            )}
          </div>

          {/* Requirement Description Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="requestText" className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Mô tả nhu cầu tổ chức tiệc <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] tabular-nums ${requestText.length > 500 ? 'text-rose-600 font-bold' : 'text-stone-400'}`}>
                {requestText.length} / 500 ký tự
              </span>
            </div>
            <textarea
              id="requestText"
              rows={3}
              required
              maxLength={500}
              placeholder="Ví dụ: Tôi muốn tổ chức tiệc sinh nhật 5 bàn, 6 người mỗi bàn, ngân sách 1.500.000đ/bàn, thích món Việt, ít cay, có món khai vị thanh đạm và tráng miệng..."
              value={requestText}
              onChange={(e) => handleRequestTextChange(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-xs sm:text-sm text-stone-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-2xs"
            />

            {/* Quick Sample Prompts */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-600" /> Gợi ý mẫu:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleRequestTextChange(
                    'Tiệc sinh nhật 5 bàn, 6 người mỗi bàn, ngân sách 1.500.000đ/bàn, thích hải sản tươi ngon, món thanh đạm, ít cay'
                  )
                }
                className="text-[11px] font-medium bg-stone-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Sinh nhật 5 bàn (1.500.000đ/bàn)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleRequestTextChange(
                    'Liên hoan công ty 10 bàn, 10 người mỗi bàn, ngân sách 2.000.000đ/bàn, món ăn phong phú, có món lẩu và tráng miệng'
                  )
                }
                className="text-[11px] font-medium bg-stone-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Liên hoan công ty 10 bàn
              </button>
              <button
                type="button"
                onClick={() =>
                  handleRequestTextChange(
                    'Tiệc gia đình ấm cúng 3 bàn, 8 người mỗi bàn, ngân sách 1.200.000đ/bàn, món Việt truyền thống'
                  )
                }
                className="text-[11px] font-medium bg-stone-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Tiệc gia đình 3 bàn
              </button>
            </div>

            {detectedSummary && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 rounded-lg animate-fade-in mt-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <span>
                  Đã tự động nhận diện từ mô tả: <strong>{detectedSummary}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Event Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">Loại tiệc</label>
              <select
                value={eventType}
                onChange={(e) => {
                  invalidateInFlightRequest();
                  setEventType(e.target.value);
                  if (response) setResponse(null);
                }}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs cursor-pointer"
              >
                {EVENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Khác">Dịp tiệc khác</option>
              </select>
            </div>

            {/* Table Count */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Số lượng bàn tiệc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={tableCount}
                  onChange={(e) => {
                    invalidateInFlightRequest();
                    setTableCount(Math.max(1, parseInt(e.target.value) || 1));
                    if (response) setResponse(null);
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                  bàn
                </span>
              </div>
            </div>

            {/* Guests Per Table */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Số khách / bàn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={guestsPerTable}
                  onChange={(e) => {
                    invalidateInFlightRequest();
                    const newGuests = Math.max(1, parseInt(e.target.value) || 1);
                    setGuestsPerTable(newGuests);
                    if (perPersonBudget) {
                      const recalculated = perPersonBudget * newGuests;
                      setBudgetAmount(recalculated.toString());
                    }
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                  khách
                </span>
              </div>
            </div>

            {/* Budget Amount & Scope */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700">Ngân sách dự kiến</label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      invalidateInFlightRequest();
                      setBudgetType('PER_TABLE');
                    }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      budgetType === 'PER_TABLE'
                        ? 'font-bold text-amber-800 bg-amber-100'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    / Bàn
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      invalidateInFlightRequest();
                      setPerPersonBudget(null);
                      setBudgetType('TOTAL_ORDER');
                    }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      budgetType === 'TOTAL_ORDER'
                        ? 'font-bold text-amber-800 bg-amber-100'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Tổng tiệc
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="1.500.000"
                  value={
                    budgetAmount ? Number(budgetAmount.replace(/\D/g, '')).toLocaleString('vi-VN') : ''
                  }
                  onChange={(e) => {
                    invalidateInFlightRequest();
                    setPerPersonBudget(null);
                    setBudgetAmount(e.target.value);
                  }}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 pr-12 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs tabular-nums font-semibold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-bold pointer-events-none">
                  VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* Preferences & Allergies Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Sở thích khẩu vị & phong cách món (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Ưu tiên hải sản tươi sống, thích vị thanh nhẹ..."
                value={preferences}
                onChange={(e) => {
                  invalidateInFlightRequest();
                  setPreferences(e.target.value);
                  if (response) setResponse(null);
                }}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Nguyên liệu cần tránh / Dị ứng thực phẩm (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Không ăn thịt bò, tránh đậu phộng..."
                value={excludedIngredients}
                onChange={(e) => {
                  invalidateInFlightRequest();
                  setExcludedIngredients(e.target.value);
                  if (response) setResponse(null);
                }}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs"
              />
              {excludedIngredients && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-medium text-stone-500">Đã nhận diện:</span>
                  {excludedIngredients
                    .split(/[,;\n]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((allergen, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold"
                      >
                        <span>Tránh {allergen}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergen(allergen)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer ml-0.5"
                          title={`Bỏ loại trừ ${allergen}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
              <p className="text-[11px] text-stone-500 leading-tight">
                * Lưu ý: Hệ thống đối soát dị ứng tự động theo danh mục nguyên liệu cấu thành trong công thức món ăn của nhà hàng. Vui lòng xác nhận danh sách các nguyên liệu cần tránh ở trên.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-amber-700 shrink-0" />
              <span>
                AI chỉ đề xuất thực đơn tham khảo. Mọi số liệu giá bán và nguyên liệu đều lấy từ cơ sở dữ liệu thật của nhà hàng.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  <span>Đang phân tích món ăn & tính giá vốn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Gợi ý thực đơn bằng AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Recommendations Results Section */}
      {response && (
        <section className="space-y-6 animate-fade-up-1">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                  {response.suggestions.length > 0
                    ? `Đã tạo ${response.suggestions.length} phương án thực đơn đề xuất`
                    : 'Không tìm thấy thực đơn phù hợp'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Nguồn: {response.source === 'GEMINI' ? 'Trí tuệ nhân tạo Gemini' : 'Quy tắc định mức nhà hàng'}
                  {response.message ? ` • ${response.message}` : ''}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80 self-start sm:self-auto tabular-nums">
              Quy mô: {tableCount} bàn ({tableCount * guestsPerTable} khách)
            </span>
          </div>

          {/* Suggestions or Empty State */}
          {response.suggestions.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
              <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                <ChefHat className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  Không tìm thấy phương án thực đơn phù hợp
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Các món ăn hiện tại chưa có tổ hợp nào vừa vặn với ngân sách hoặc đủ tồn kho khả dụng để phục vụ quy mô tiệc của bạn.
                </p>
              </div>
              <div className="text-left bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 text-xs text-stone-600 space-y-1.5">
                <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700" /> Gợi ý điều chỉnh:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-500 text-[11px]">
                  <li>Tăng nhẹ ngân sách dự kiến mỗi bàn để mở rộng danh mục món cao cấp.</li>
                  <li>Kiểm tra lại danh sách nguyên liệu cần tránh nếu có ràng buộc quá hẹp.</li>
                  <li>
                    Hoặc sử dụng tính năng{' '}
                    <Link to="/menu-builder" className="text-amber-800 font-semibold underline">
                      Tự phối thực đơn
                    </Link>{' '}
                    để chủ động chọn từng món ăn theo sở thích.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {response.suggestions.map((suggestion, idx) => {
                const isWithinBudget = suggestion.budgetStatus === 'WITHIN_BUDGET';
                const isStockAvailable = suggestion.availabilityStatus === 'AVAILABLE';
                const heroImage =
                  suggestion.items.find((it) => it.dishImageUrl || it.imageUrl)?.dishImageUrl ||
                  DEFAULT_MENU_IMAGE;

                return (
                  <div
                    key={idx}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs hover:border-amber-400 hover:shadow-lg transition-all duration-300 h-full"
                  >
                    {/* Hero Image Banner with Floating Badges */}
                    <div className="relative h-44 bg-stone-900 overflow-hidden select-none shrink-0">
                      <img
                        src={heroImage}
                        alt={suggestion.name}
                        onError={handleImageError}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/45 to-stone-950/15 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-300 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-xs tabular-nums">
                          Phương án {idx + 1}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md border ${
                              isWithinBudget
                                ? 'bg-emerald-950/85 text-emerald-200 border-emerald-500/40'
                                : suggestion.budgetStatus === 'OVER_BUDGET'
                                ? 'bg-amber-950/85 text-amber-200 border-amber-500/40'
                                : 'bg-stone-900/85 text-stone-300 border-white/20'
                            }`}
                          >
                            {isWithinBudget
                              ? 'Trong ngân sách'
                              : suggestion.budgetStatus === 'OVER_BUDGET'
                              ? 'Vượt ngân sách'
                              : 'Chưa đặt ngân sách'}
                          </span>

                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md border ${
                              isStockAvailable
                                ? 'bg-emerald-950/85 text-emerald-200 border-emerald-500/40'
                                : 'bg-rose-950/85 text-rose-200 border-rose-500/40'
                            }`}
                          >
                            {isStockAvailable ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Set info over banner */}
                      <div className="absolute bottom-3 left-4 right-4 z-10 text-white">
                        <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-1 drop-shadow-sm">
                          {suggestion.name || `Bộ thực đơn đề xuất #${idx + 1}`}
                        </h3>
                        <p className="text-[11px] text-stone-300 mt-0.5">
                          Set {suggestion.items.length} món • Phục vụ {suggestion.tableCount || tableCount} bàn
                        </p>
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="p-4 bg-amber-50/40 border-b border-stone-200/80 flex items-baseline justify-between shrink-0">
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Đơn giá 1 bàn</span>
                        <p className="text-xl font-extrabold text-amber-900 tracking-tight tabular-nums">
                          {formatVnd(suggestion.totalPerTable)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 font-medium block">
                          Tổng tiệc ({suggestion.tableCount || tableCount} bàn)
                        </span>
                        <p className="text-sm font-bold text-stone-800 tabular-nums">
                          {formatVnd(suggestion.totalOrderAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Reason text */}
                    {suggestion.reason && (
                      <div className="px-4 py-2.5 bg-stone-50/60 border-b border-stone-100 text-xs text-stone-600 leading-relaxed italic shrink-0">
                        "{suggestion.reason}"
                      </div>
                    )}

                    {/* Dishes Item List */}
                    <div className="p-4 flex-1 space-y-2.5 divide-y divide-stone-100 max-h-80 overflow-y-auto scrollbar-thin">
                      {suggestion.items.map((item, itemIdx) => (
                        <div key={item.dishId || itemIdx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              <img
                                src={item.dishImageUrl || item.imageUrl || DEFAULT_DISH_IMAGE}
                                alt={item.dishName}
                                onError={handleImageError}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 truncate">{item.dishName}</p>
                              <span className="text-[11px] text-stone-500 block truncate">
                                {item.categoryName} • {formatVnd(item.unitPrice)} / phần
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-bold text-stone-800 tabular-nums">
                              {formatVnd(item.lineTotal)}
                            </span>
                            <span className="text-[11px] text-stone-400 block tabular-nums">
                              {item.quantityPerTable} phần/bàn
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card Bottom CTA */}
                    <div className="p-4 border-t border-stone-100 bg-stone-50/60 mt-auto shrink-0">
                      {suggestion.availabilityStatus !== 'AVAILABLE' ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-800">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>Tạm thời thiếu nguyên liệu trong kho</span>
                          </div>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Phương án này không thể chọn do không đủ nguyên liệu khả dụng để phục vụ quy mô tiệc.
                          </p>
                        </div>
                      ) : suggestion.budgetStatus === 'OVER_BUDGET' ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-800">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>Vượt quá ngân sách dự kiến</span>
                          </div>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Phương án này vượt ngân sách đã đặt. Vui lòng tăng ngân sách hoặc điều chỉnh yêu cầu.
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectMenuAndCustomize(suggestion)}
                          className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                        >
                          <Utensils className="h-4 w-4" />
                          <span>Chọn thực đơn này & Tùy biến</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
