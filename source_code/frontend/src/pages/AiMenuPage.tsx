import React, { useState } from 'react';
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
import { DEFAULT_DISH_IMAGE, handleImageError } from '../lib/imageConstants';
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
  const [preferences, setPreferences] = useState('');
  const [excludedIngredients, setExcludedIngredients] = useState('');

  // Execution & Response State
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiMenuRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);

  const handleRequestTextChange = (text: string) => {
    setRequestText(text);

    if (!text.trim()) {
      setDetectedSummary(null);
      return;
    }

    const extracted = extractAiMenuParameters(text);
    const parts: string[] = [];

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
      const typeLabel = extracted.budgetType === 'TOTAL_ORDER' ? ' (tổng tiệc)' : '/bàn';
      parts.push(`Ngân sách: ${formatVnd(extracted.budgetAmount)}${typeLabel}`);
    }

    if (extracted.detectedFields.eventType && extracted.eventType) {
      setEventType(extracted.eventType);
      parts.push(extracted.eventType);
    }

    if (extracted.detectedFields.excludedIngredients && extracted.excludedIngredients && !excludedIngredients) {
      setExcludedIngredients(extracted.excludedIngredients);
      parts.push(`Tránh: ${extracted.excludedIngredients}`);
    }

    if (extracted.detectedFields.preferences && extracted.preferences && !preferences) {
      setPreferences(extracted.preferences);
    }

    setDetectedSummary(parts.length > 0 ? parts.join(' • ') : null);
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
      excludedIngredients: excludedIngredients.trim() || undefined,
    };

    try {
      const res = await aiMenuService.getRecommendations(payload);
      setResponse(res);
      if (res.suggestions.length === 0) {
        showToast('Không tìm thấy thực đơn phù hợp với tiêu chí loại trừ.', 'info');
      } else {
        showToast('Đã tạo gợi ý thực đơn thành công!', 'success');
      }
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMenuAndCustomize = (suggestion: MenuSuggestionDto) => {
    try {
      const STORAGE_KEY = 'banquethub_builder_draft';
      const items = suggestion.items.map((it) => ({
        dishId: it.dishId,
        quantityPerTable: it.quantityPerTable || 1,
      }));

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items,
          tableCount: suggestion.tableCount || tableCount,
        })
      );
      showToast(`Đã chọn "${suggestion.name}". Đang mở trình phối thực đơn để bạn tùy biến...`, 'success');
      navigate('/menu-builder');
    } catch {
      navigate('/menu-builder');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-up-1">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-semibold text-stone-900">Gợi ý thực đơn AI</span>
      </nav>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
            <Sparkles className="h-4 w-4" />
            <span>Trợ lý ẩm thực yến tiệc</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            AI gợi ý thực đơn cho bữa tiệc của bạn
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Nhập mô tả nhu cầu bằng ngôn ngữ tự nhiên. Hệ thống kết hợp trí tuệ nhân tạo Gemini cùng dữ liệu tồn kho thực tế để gợi ý tối đa 3 phương án thực đơn tối ưu chi phí và khẩu vị.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shrink-0 flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-700 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-stone-900">Yêu cầu đăng nhập</p>
              <p className="text-stone-600">Đăng nhập tài khoản để nhận gợi ý từ AI.</p>
              <Link
                to="/login?redirect=/ai-menu"
                className="mt-1.5 inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-900 underline"
              >
                Đăng nhập ngay <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Input Form */}
      <section className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full rounded-xl border border-stone-300 bg-stone-50/50 p-3.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
            />
            {detectedSummary && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 rounded-lg animate-fade-in">
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
                onChange={(e) => setEventType(e.target.value)}
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
                  onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
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
                  onChange={(e) => setGuestsPerTable(Math.max(1, parseInt(e.target.value) || 1))}
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
                    onClick={() => setBudgetType('PER_TABLE')}
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
                    onClick={() => setBudgetType('TOTAL_ORDER')}
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
                  onChange={(e) => setBudgetAmount(e.target.value)}
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
                onChange={(e) => setPreferences(e.target.value)}
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
                onChange={(e) => setExcludedIngredients(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs"
              />
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

          {/* 3 Suggestion Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {response.suggestions.map((suggestion, idx) => {
              const isWithinBudget = suggestion.budgetStatus === 'WITHIN_BUDGET';
              const isStockAvailable = suggestion.availabilityStatus === 'AVAILABLE';

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200/90 bg-white shadow-xs flex flex-col h-full overflow-hidden hover:border-amber-300 transition-colors"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 border-b border-stone-100 space-y-3 bg-stone-50/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                        Phương án {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            isWithinBudget
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : suggestion.budgetStatus === 'OVER_BUDGET'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isWithinBudget
                            ? 'Trong ngân sách'
                            : suggestion.budgetStatus === 'OVER_BUDGET'
                            ? 'Vượt ngân sách'
                            : 'Chưa đặt ngân sách'}
                        </span>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            isStockAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isStockAvailable ? 'Đủ nguyên liệu' : 'Thiếu nguyên liệu'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-snug">
                      {suggestion.name || `Bộ thực đơn đề xuất #${idx + 1}`}
                    </h3>

                    {suggestion.reason && (
                      <p className="text-xs text-stone-600 leading-relaxed font-normal">
                        {suggestion.reason}
                      </p>
                    )}

                    {/* Price Summary */}
                    <div className="pt-2 flex items-baseline justify-between border-t border-stone-200/70">
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Đơn giá 1 bàn</span>
                        <p className="text-lg font-bold text-amber-900 tracking-tight tabular-nums">
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
                  </div>

                  {/* Dishes Item List */}
                  <div className="p-4 sm:p-5 flex-1 space-y-2.5 divide-y divide-stone-100 max-h-80 overflow-y-auto scrollbar-thin">
                    {suggestion.items.map((item, itemIdx) => (
                      <div key={item.dishId || itemIdx} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
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
                            <span className="text-[11px] text-stone-400 block truncate">
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
                  <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectMenuAndCustomize(suggestion)}
                      className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Utensils className="h-4 w-4" />
                      <span>Chọn thực đơn này & Tùy biến</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
