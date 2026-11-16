import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  CalendarDays,
  Loader2,
  User,
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

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

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

  const getDayStatusBadge = (status?: AttendanceStatus) => {
    if (!status) {
      return (
        <span className="text-stone-300 font-mono text-xs select-none">
          Chưa chấm
        </span>
      );
    }
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đủ ngày (1.0 công)
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">
            <Clock className="h-3.5 w-3.5" /> Nửa ngày (0.5 công)
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
            <XCircle className="h-3.5 w-3.5" /> Vắng mặt (0 công)
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-up-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-amber-700" />
            Lịch sử chấm công của tôi
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Theo dõi chi tiết số ngày công và trạng thái điểm danh thực tế từng ngày trong tháng.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
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
          {/* Profile Card & KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3 sm:col-span-1">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-lg">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-stone-900 text-sm">{summary.employeeName}</p>
                <p className="text-[11px] font-mono text-stone-500">{summary.employeeCode}</p>
                <p className="text-[11px] text-amber-800 font-semibold">{summary.position}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Tổng ngày công</p>
                <p className="text-2xl font-extrabold text-emerald-700">
                  {summary.totalWorkUnits} <span className="text-xs font-normal text-stone-500">công</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Đủ ngày (1.0)</p>
                <p className="text-2xl font-extrabold text-blue-700">
                  {summary.presentDays} <span className="text-xs font-normal text-stone-500">ngày</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Nửa ngày (0.5)</p>
                <p className="text-2xl font-extrabold text-amber-800">
                  {summary.halfDays} <span className="text-xs font-normal text-stone-500">buổi</span>
                </p>
              </div>
            </div>
          </div>

          {/* Daily Detail Calendar List */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200 font-bold text-xs text-stone-700 flex items-center justify-between">
              <span>BẢNG CHI TIẾT TỪNG NGÀY TRONG THÁNG {month}/{year}</span>
              <span className="text-[11px] text-stone-500 font-normal">
                (Số ngày trong tháng: {summary.totalDaysInMonth})
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {daysArray.map((day) => {
                const dateObj = new Date(year, month - 1, day);
                const isSunday = dateObj.getDay() === 0;
                const isSat = dateObj.getDay() === 6;
                const dayName = isSunday
                  ? 'Chủ Nhật'
                  : `Thứ ${dateObj.getDay() + 1}`;
                const status = summary.dailyRecords?.[day]?.attendanceStatus || summary.dailyStatusMap?.[day];
                const note = summary.dailyRecords?.[day]?.note || summary.dailyNoteMap?.[day];
                const isToday =
                  day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`p-3.5 flex items-center justify-between transition-colors ${
                      isToday ? 'bg-amber-50/40' : 'hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                          isToday
                            ? 'bg-amber-700 text-white shadow-2xs'
                            : isSunday
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {day}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-stone-900">{dayName}</span>
                          <span className="text-[11px] text-stone-400">
                            ({String(day).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year})
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        {note && (
                          <p className="text-[11px] text-stone-500 italic mt-0.5">
                            Ghi chú: {note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>{getDayStatusBadge(status)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-8">
          <CalendarDays className="h-12 w-12 mx-auto text-stone-300 mb-3" />
          <p className="text-base font-semibold text-stone-700">Tài khoản chưa được liên kết hồ sơ nhân sự</p>
          <p className="text-xs text-stone-400 mt-1">
            Vui lòng liên hệ Quản trị viên để liên kết User ID của bạn với hồ sơ nhân viên BanquetHub.
          </p>
        </div>
      )}
    </div>
  );
};
