import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Lock,
  Loader2,
  CalendarCheck,
  UserCheck,
  Building2,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type {
  CompanyAttendanceSummaryDto,
  AttendanceMonthlySummaryDto,
  AttendanceStatus,
  RecordAttendancePayload,
  PayrollPeriodDto,
} from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminAttendancePage: React.FC = () => {
  const { showToast } = useToast();

  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const [loading, setLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<CompanyAttendanceSummaryDto | null>(null);
  const [periodInfo, setPeriodInfo] = useState<PayrollPeriodDto | null>(null);

  // Quick edit modal for a single cell
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    day: number;
    currentStatus?: AttendanceStatus;
    currentNote?: string;
  } | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
  const [editNote, setEditNote] = useState<string>('');
  const [savingCell, setSavingCell] = useState<boolean>(false);

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const isPeriodLocked = useMemo(() => {
    return periodInfo?.status === 'FINALIZED' || periodInfo?.status === 'CLOSED';
  }, [periodInfo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch attendance summary
      const summary = await employeeService.getAttendanceSummary(year, month);
      setSummaryData(summary);

      // Check if period is finalized or closed
      try {
        const periods = await employeeService.getPayrollPeriods();
        const cur = periods.find((p) => p.year === year && p.month === month);
        setPeriodInfo(cur || null);
      } catch {
        setPeriodInfo(null);
      }
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải dữ liệu chấm công'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const openCellEdit = (
    employee: AttendanceMonthlySummaryDto,
    day: number
  ) => {
    if (isPeriodLocked) {
      showToast('Kỳ lương của tháng này đã chốt sổ. Không thể sửa chấm công.', 'info');
      return;
    }
    const currentStatus = employee.dailyStatusMap[day];
    const currentNote = employee.dailyNoteMap[day] || '';

    setSelectedCell({
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      employeeCode: employee.employeeCode,
      day,
      currentStatus,
      currentNote,
    });
    setEditStatus(currentStatus || 'PRESENT');
    setEditNote(currentNote);
  };

  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedCell.day).padStart(2, '0')}`;
    const payload: RecordAttendancePayload = {
      attendanceStatus: editStatus,
      note: editNote.trim() || null,
    };

    try {
      setSavingCell(true);
      await employeeService.recordAttendance(selectedCell.employeeId, dateStr, payload);
      showToast(
        `Đã ghi nhận công ngày ${selectedCell.day}/${month} cho ${selectedCell.employeeName}`,
        'success'
      );
      setSelectedCell(null);
      fetchData();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể cập nhật chấm công'), 'error');
    } finally {
      setSavingCell(false);
    }
  };

  const getStatusBadge = (status?: AttendanceStatus) => {
    if (!status) {
      return (
        <span className="text-stone-300 font-mono text-xs select-none hover:text-stone-500">
          -
        </span>
      );
    }
    switch (status) {
      case 'PRESENT':
        return (
          <span
            title="Đủ ngày (1.0 công)"
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] shadow-2xs hover:scale-110 transition-transform"
          >
            P
          </span>
        );
      case 'HALF_DAY':
        return (
          <span
            title="Nửa ngày (0.5 công)"
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px] shadow-2xs hover:scale-110 transition-transform"
          >
            H
          </span>
        );
      case 'ABSENT':
        return (
          <span
            title="Vắng mặt (0.0 công)"
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px] shadow-2xs hover:scale-110 transition-transform"
          >
            A
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-amber-700" />
            Bảng chấm công hàng ngày
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Ghi nhận ngày công làm việc thực tế cho toàn bộ nhân sự (Đủ công 1.0, Nửa ngày 0.5, Nghỉ 0.0).
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

      {/* Lock Alert if Finalized or Closed */}
      {isPeriodLocked && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 shadow-2xs animate-fade-up-1">
          <Lock className="h-5 w-5 text-amber-800 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm">Kỳ tính lương Tháng {month}/{year} đã chốt sổ ({periodInfo?.status})</p>
            <p className="text-amber-800/80 mt-0.5">
              Dữ liệu chấm công của tháng này đã được khóa bất biến nhằm đảm bảo tính toàn vẹn số liệu tính lương.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Nhân sự chấm công</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {summaryData?.totalEmployees ?? 0} <span className="text-xs font-normal text-stone-500">người</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tổng công thực tế toàn viện</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {summaryData?.totalCompanyWorkUnits ?? 0} <span className="text-xs font-normal text-stone-500">công</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xl">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Quy ước ký hiệu</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">P = 1.0</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">H = 0.5</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">A = 0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Matrix Grid */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
            <p className="text-sm font-medium">Đang tải bảng chấm công tháng {month}/{year}...</p>
          </div>
        ) : !summaryData || summaryData.employeeSummaries.length === 0 ? (
          <div className="py-20 text-center text-stone-500">
            <CalendarDays className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-semibold text-stone-700">Chưa có dữ liệu nhân viên nào trong tháng này</p>
            <p className="text-xs text-stone-400 mt-1">Vui lòng thêm nhân viên đang làm việc trong mục Hồ sơ nhân sự.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-stone-50/90 text-stone-600 uppercase text-[10px] font-bold border-b border-stone-200 sticky top-0">
                <tr>
                  <th className="py-3 px-3 min-w-44 sticky left-0 bg-stone-50/95 z-10 shadow-r-xs">
                    Nhân viên & Chức vụ
                  </th>
                  {daysArray.map((day) => {
                    const dateObj = new Date(year, month - 1, day);
                    const isWeekend = dateObj.getDay() === 0; // Sunday
                    const isSat = dateObj.getDay() === 6;
                    const isToday =
                      day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                    return (
                      <th
                        key={day}
                        className={`py-2 px-1 text-center min-w-7.5 border-l border-stone-100 ${
                          isToday
                            ? 'bg-amber-100 text-amber-900 font-extrabold'
                            : isWeekend
                            ? 'bg-rose-50/70 text-rose-700'
                            : isSat
                            ? 'bg-stone-100/50 text-stone-700'
                            : ''
                        }`}
                      >
                        <div>{day}</div>
                        <div className="text-[9px] font-normal lowercase">
                          {isWeekend ? 'CN' : `T${dateObj.getDay() + 1}`}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-right min-w-20 bg-amber-50/70 text-amber-900 border-l border-amber-200">
                    Tổng công
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {summaryData.employeeSummaries.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-2.5 px-3 sticky left-0 bg-white z-10 shadow-r-xs">
                      <div className="font-bold text-stone-900 truncate">{emp.employeeName}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                        <span className="font-mono bg-stone-100 px-1 rounded">{emp.employeeCode}</span>
                        <span>•</span>
                        <span className="truncate">{emp.position}</span>
                      </div>
                    </td>

                    {daysArray.map((day) => {
                      const status = emp.dailyStatusMap[day];
                      const dateObj = new Date(year, month - 1, day);
                      const isToday =
                        day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                      return (
                        <td
                          key={day}
                          onClick={() => openCellEdit(emp, day)}
                          className={`py-1.5 px-1 text-center border-l border-stone-100 cursor-pointer hover:bg-amber-100/40 transition-colors ${
                            isToday ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {getStatusBadge(status)}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-right font-extrabold text-stone-900 bg-amber-50/40 border-l border-amber-100">
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-100/80 text-amber-900">
                        {emp.totalWorkUnits}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Single Day Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-fade-up-1">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900">Chấm công ngày {selectedCell.day}/{month}/{year}</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedCell.employeeName} ({selectedCell.employeeCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">Trạng thái công</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('PRESENT')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      editStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>Đủ ngày</span>
                    <span className="text-[10px] opacity-90 font-normal">1.0 công</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('HALF_DAY')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      editStatus === 'HALF_DAY'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>Nửa ngày</span>
                    <span className="text-[10px] opacity-90 font-normal">0.5 công</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('ABSENT')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      editStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>Vắng mặt</span>
                    <span className="text-[10px] opacity-90 font-normal">0.0 công</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Lý do đi trễ, xin nghỉ, làm thêm ca..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCell}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {savingCell && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Lưu chấm công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
