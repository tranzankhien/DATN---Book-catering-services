import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Loader2,
  User,
  Info,
  Award,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { AttendanceMonthlySummaryDto, AttendanceStatus } from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const EmployeeMyAttendancePage: React.FC = () => {
  const { showToast } = useToast();

  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const [summary, setSummary] = useState<AttendanceMonthlySummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // First day of month offset (Monday = 0, ..., Sunday = 6)
  const firstDayOffset = useMemo(() => {
    const day = new Date(year, month - 1, 1).getDay();
    return (day + 6) % 7;
  }, [year, month]);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getMyAttendance(year, month);
      setSummary(data);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải lịch sử chấm công của bạn'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const weekHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Days with notes or special statuses for bottom log list
  const specialDays = useMemo(() => {
    if (!summary) return [];
    const list: Array<{ day: number; status?: AttendanceStatus; note?: string }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const status = summary.dailyRecords?.[d]?.attendanceStatus || summary.dailyStatusMap?.[d];
      const note = summary.dailyRecords?.[d]?.note || summary.dailyNoteMap?.[d];
      if (note || status === 'HALF_DAY' || status === 'ABSENT') {
        list.push({ day: d, status, note });
      }
    }
    return list;
  }, [summary, daysInMonth]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-up-1">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-amber-700" />
            Lịch sử chấm công của tôi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Theo dõi chi tiết số ngày công và trạng thái điểm danh thực tế trực quan theo lịch tháng.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
            title="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl shadow-2xs font-bold text-stone-900 text-sm">
            <CalendarDays className="h-4 w-4 text-amber-700" />
            <span>
              Tháng {String(month).padStart(2, '0')} / {year}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs cursor-pointer"
            title="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
          <p className="text-sm font-medium">Đang tải lịch sử công...</p>
        </div>
      ) : summary ? (
        <>
          {/* Profile Snapshot & 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-stone-900 text-sm truncate">{summary.employeeName}</p>
                <p className="text-[11px] font-mono text-stone-400">{summary.employeeCode}</p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 truncate max-w-full">
                  {summary.position || 'Nhân sự'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Tổng công thực tế</span>
              <div className="mt-1 text-2xl font-black text-amber-900 tabular-nums">
                {summary.totalWorkUnits} <span className="text-xs font-semibold text-stone-500">công</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Quy chuẩn tháng: {summary.totalDaysInMonth} ngày
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Đủ ngày (1.0 công)</span>
              <div className="mt-1 text-2xl font-black text-emerald-700 tabular-nums">
                {summary.presentDays} <span className="text-xs font-semibold text-stone-500">ngày</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Hoàn thành trọn ca làm việc
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Nửa ngày (0.5 công)</span>
              <div className="mt-1 text-2xl font-black text-amber-700 tabular-nums">
                {summary.halfDays} <span className="text-xs font-semibold text-stone-500">buổi</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Ca nửa ngày / có phép
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Vắng mặt (0 công)</span>
              <div className="mt-1 text-2xl font-black text-rose-700 tabular-nums">
                {summary.absentDays} <span className="text-xs font-semibold text-stone-500">ngày</span>
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                Nghỉ không lương / vắng
              </div>
            </div>
          </div>

          {/* Calendar Month Grid (7 Columns) */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-stone-50/90 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-700" />
                <span className="font-bold text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                  Lịch Chấm Công Tháng {month}/{year}
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Đủ ngày (1.0)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Nửa ngày (0.5)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Vắng mặt (0)
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-stone-300" /> Chưa chấm
                </span>
              </div>
            </div>

            {/* Weekday Columns Header */}
            <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100/70 text-center text-xs font-bold text-stone-700">
              {weekHeaders.map((hdr, idx) => (
                <div
                  key={hdr}
                  className={`py-2.5 border-r last:border-r-0 border-stone-200/80 ${
                    idx >= 5 ? 'text-amber-900 bg-amber-50/40' : ''
                  }`}
                >
                  {hdr}
                </div>
              ))}
            </div>

            {/* Calendar Cells Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-stone-100">
              {/* Padding for days before the 1st of the month */}
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-24 sm:min-h-28 bg-stone-50/40 p-2" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateObj = new Date(year, month - 1, day);
                const isSunday = dateObj.getDay() === 0;
                const isSaturday = dateObj.getDay() === 6;
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() + 1 &&
                  year === today.getFullYear();

                const status = summary.dailyRecords?.[day]?.attendanceStatus || summary.dailyStatusMap?.[day];
                const note = summary.dailyRecords?.[day]?.note || summary.dailyNoteMap?.[day];

                return (
                  <div
                    key={`day-${day}`}
                    className={`min-h-24 sm:min-h-28 p-2 flex flex-col justify-between transition-colors ${
                      isToday
                        ? 'bg-amber-50/60 ring-2 ring-inset ring-amber-600/40'
                        : isSunday || isSaturday
                        ? 'bg-stone-50/30'
                        : 'bg-white hover:bg-stone-50/70'
                    }`}
                  >
                    {/* Top: Day number & Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-bold rounded-lg h-6 w-6 tabular-nums ${
                          isToday
                            ? 'bg-amber-700 text-white shadow-2xs'
                            : isSunday
                            ? 'text-rose-600 font-extrabold'
                            : 'text-stone-800'
                        }`}
                      >
                        {day}
                      </span>

                      {isToday && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* Middle: Attendance status card */}
                    <div className="my-1">
                      {status === 'PRESENT' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] w-full">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">1.0 công</span>
                        </div>
                      )}
                      {status === 'HALF_DAY' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px] w-full">
                          <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                          <span className="truncate">0.5 công</span>
                        </div>
                      )}
                      {status === 'ABSENT' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold text-[11px] w-full">
                          <XCircle className="h-3 w-3 text-rose-600 shrink-0" />
                          <span className="truncate">Vắng mặt</span>
                        </div>
                      )}
                      {!status && (
                        <div className="text-[10px] text-stone-300 font-mono italic px-1">
                          --
                        </div>
                      )}
                    </div>

                    {/* Bottom: Note if available */}
                    {note ? (
                      <p className="text-[10px] text-stone-500 italic truncate" title={note}>
                        • {note}
                      </p>
                    ) : (
                      <div className="h-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Notes & Exceptions Section */}
          {specialDays.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-700" />
                <span>Chi tiết ghi chú & ngày công đặc biệt ({specialDays.length} ngày)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {specialDays.map((item) => (
                  <div
                    key={item.day}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 tabular-nums">
                        Ngày {item.day}/{month}/{year}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'HALF_DAY'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'ABSENT'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status === 'HALF_DAY'
                          ? '0.5 công'
                          : item.status === 'ABSENT'
                          ? 'Vắng'
                          : '1.0 công'}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[11px] text-stone-600 italic">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
          <CalendarDays className="h-12 w-12 mx-auto text-stone-300 mb-3" />
          <p className="text-base font-semibold text-stone-700">Tài khoản chưa được liên kết hồ sơ nhân sự</p>
          <p className="text-xs text-stone-400 mt-1">
            Vui lòng liên hệ Quản trị viên để liên kết tài khoản của bạn với hồ sơ nhân viên BanquetHub.
          </p>
        </div>
      )}
    </div>
  );
};
