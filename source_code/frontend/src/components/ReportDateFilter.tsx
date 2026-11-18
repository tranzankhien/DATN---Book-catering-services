import React, { useState } from 'react';
import { Calendar, Download, RefreshCw } from 'lucide-react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportDateFilterProps {
  startDate: string;
  endDate: string;
  onChange: (range: DateRange) => void;
  onRefresh?: () => void;
  onExportCsv?: () => void;
  exportLoading?: boolean;
  exportLabel?: string;
  showExport?: boolean;
}

type PresetKey = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';

export const ReportDateFilter: React.FC<ReportDateFilterProps> = ({
  startDate,
  endDate,
  onChange,
  onRefresh,
  onExportCsv,
  exportLoading = false,
  exportLabel = 'Xuất file CSV (Excel)',
  showExport = true,
}) => {
  const [activePreset, setActivePreset] = useState<PresetKey>('THIS_MONTH');

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePreset = (preset: PresetKey) => {
    setActivePreset(preset);
    const now = new Date();
    let s = '';
    let e = formatDate(now);

    switch (preset) {
      case 'TODAY': {
        s = formatDate(now);
        e = s;
        break;
      }
      case 'LAST_7_DAYS': {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        s = formatDate(d);
        break;
      }
      case 'LAST_30_DAYS': {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        s = formatDate(d);
        break;
      }
      case 'THIS_MONTH': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        s = formatDate(firstDay);
        break;
      }
      case 'LAST_MONTH': {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        s = formatDate(firstDay);
        e = formatDate(lastDay);
        break;
      }
      case 'THIS_YEAR': {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        s = formatDate(firstDay);
        break;
      }
      case 'CUSTOM':
        return;
    }

    if (s && e) {
      onChange({ startDate: s, endDate: e });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-600 mr-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-stone-400" /> Kỳ báo cáo:
          </span>
          {(
            [
              { key: 'TODAY', label: 'Hôm nay' },
              { key: 'LAST_7_DAYS', label: '7 ngày qua' },
              { key: 'LAST_30_DAYS', label: '30 ngày qua' },
              { key: 'THIS_MONTH', label: 'Tháng này' },
              { key: 'LAST_MONTH', label: 'Tháng trước' },
              { key: 'THIS_YEAR', label: 'Năm nay' },
            ] as const
          ).map((p) => {
            const isSelected = activePreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Refresh & Export */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-xs transition-colors cursor-pointer"
              title="Làm mới dữ liệu số liệu"
            >
              <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
              <span>Tải lại</span>
            </button>
          )}

          {showExport && onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              disabled={exportLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              title="Xuất dữ liệu đối soát CSV hỗ trợ Microsoft Excel & Google Sheets"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exportLoading ? 'Đang xuất file...' : exportLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Pickers (Custom range) */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-stone-600">Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setActivePreset('CUSTOM');
              onChange({ startDate: e.target.value, endDate });
            }}
            className="rounded-lg border border-stone-300 bg-stone-50/50 px-2.5 py-1 text-xs text-stone-900 font-medium tabular-nums focus:bg-white focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold text-stone-600">Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setActivePreset('CUSTOM');
              onChange({ startDate, endDate: e.target.value });
            }}
            className="rounded-lg border border-stone-300 bg-stone-50/50 px-2.5 py-1 text-xs text-stone-900 font-medium tabular-nums focus:bg-white focus:outline-amber-600 focus:ring-1 focus:ring-amber-600"
          />
        </div>

        <span className="text-[11px] text-stone-500 italic">
          (Dữ liệu tính theo múi giờ Việt Nam UTC+7, chỉ ghi nhận doanh thu từ đơn đã thanh toán)
        </span>
      </div>
    </div>
  );
};
