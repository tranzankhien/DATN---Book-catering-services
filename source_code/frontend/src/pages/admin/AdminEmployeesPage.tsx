import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  UserX,
  X,
  Loader2,
} from 'lucide-react';
import { employeeService } from '../../services/employeeService';
import type { EmployeeDto, CreateEmployeePayload, UpdateEmployeePayload, EmployeeStatus } from '../../services/types';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export const AdminEmployeesPage: React.FC = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EmployeeStatus>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDto | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState<{
    employeeCode: string;
    fullName: string;
    position: string;
    phone: string;
    email: string;
    hireDate: string;
    baseSalary: string;
    userId: string;
    note: string;
  }>({
    employeeCode: '',
    fullName: '',
    position: '',
    phone: '',
    email: '',
    hireDate: new Date().toISOString().split('T')[0],
    baseSalary: '9000000',
    userId: '',
    note: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees({
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        size: 200,
      });
      setEmployees(res.content);
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể tải danh sách nhân viên'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      employeeCode: '',
      fullName: '',
      position: 'Nhân viên phục vụ',
      phone: '',
      email: '',
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: '9000000',
      userId: '',
      note: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeDto) => {
    setEditingEmployee(emp);
    setFormData({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      position: emp.position,
      phone: emp.phone || '',
      email: emp.email || '',
      hireDate: emp.hireDate,
      baseSalary: String(emp.baseSalary),
      userId: emp.userId ? String(emp.userId) : '',
      note: emp.note || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (emp: EmployeeDto) => {
    const newStatus: EmployeeStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'kích hoạt lại' : 'tạm ngưng làm việc';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} cho nhân viên "${emp.fullName}"?`)) {
      return;
    }

    try {
      await employeeService.updateEmployeeStatus(emp.id, newStatus);
      showToast(`Đã ${actionLabel} nhân viên ${emp.fullName} thành công`, 'success');
      fetchEmployees();
    } catch (err) {
      showToast(extractErrorMessage(err, `Không thể ${actionLabel} nhân viên`), 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.position.trim() || !formData.hireDate) {
      showToast('Vui lòng điền đầy đủ họ tên, chức vụ và ngày vào làm', 'error');
      return;
    }

    const salaryNum = Number(formData.baseSalary.replace(/[^0-9]/g, ''));
    if (isNaN(salaryNum) || salaryNum < 0) {
      showToast('Mức lương cơ bản không hợp lệ', 'error');
      return;
    }

    const parsedUserId = formData.userId.trim() ? Number(formData.userId) : null;

    try {
      setSubmitting(true);
      if (editingEmployee) {
        const payload: UpdateEmployeePayload = {
          fullName: formData.fullName.trim(),
          position: formData.position.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          hireDate: formData.hireDate,
          baseSalary: salaryNum,
          userId: parsedUserId,
          note: formData.note.trim() || null,
        };
        await employeeService.updateEmployee(editingEmployee.id, payload);
        showToast('Cập nhật thông tin nhân viên thành công', 'success');
      } else {
        const payload: CreateEmployeePayload = {
          employeeCode: formData.employeeCode.trim() || undefined,
          fullName: formData.fullName.trim(),
          position: formData.position.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          hireDate: formData.hireDate,
          baseSalary: salaryNum,
          userId: parsedUserId,
          note: formData.note.trim() || null,
        };
        await employeeService.createEmployee(payload);
        showToast('Thêm hồ sơ nhân viên mới thành công', 'success');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      showToast(extractErrorMessage(err, 'Không thể lưu thông tin nhân viên'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const activeCount = useMemo(() => employees.filter((e) => e.status === 'ACTIVE').length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => e.status === 'INACTIVE').length, [employees]);
  const totalBaseFund = useMemo(
    () => employees.filter((e) => e.status === 'ACTIVE').reduce((sum, e) => sum + (e.baseSalary || 0), 0),
    [employees]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-amber-700" />
            Quản lý hồ sơ nhân viên
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Hồ sơ danh bạ nhân sự, vị trí đảm nhiệm, mức lương cơ bản và liên kết tài khoản hệ thống.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Thêm nhân viên mới
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Tổng nhân sự</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">{employees.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Đang hoạt động</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {activeCount} <span className="text-xs font-normal text-stone-500">nhân viên</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Quỹ lương cơ bản</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">
              {new Intl.NumberFormat('vi-VN').format(totalBaseFund)} <span className="text-xs font-normal text-stone-500">đ/tháng</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã NV, họ tên, số điện thoại, chức vụ..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </span>
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/60 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tất cả ({employees.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Đang làm việc ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'INACTIVE' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tạm ngưng ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700 mb-3" />
            <p className="text-sm font-medium">Đang tải danh sách nhân viên...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <Users className="h-12 w-12 mx-auto text-stone-300 mb-3" />
            <p className="text-base font-semibold text-stone-700">Chưa tìm thấy nhân viên nào</p>
            <p className="text-xs text-stone-400 mt-1">Hãy thử điều chỉnh bộ lọc hoặc thêm mới nhân sự.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-3.5 px-4">Mã & Họ tên</th>
                  <th className="py-3.5 px-4">Vị trí / Chức vụ</th>
                  <th className="py-3.5 px-4">Liên hệ</th>
                  <th className="py-3.5 px-4">Ngày vào làm</th>
                  <th className="py-3.5 px-4 text-right">Lương cơ bản</th>
                  <th className="py-3.5 px-4 text-center">Tài khoản</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {emp.fullName.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{emp.fullName}</div>
                          <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 bg-stone-100 text-stone-700 text-[11px] font-mono font-medium">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-semibold">
                        <Building2 className="h-3 w-3 text-stone-500" />
                        {emp.position}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-600 space-y-1">
                      {emp.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-stone-400" /> {emp.phone}
                        </div>
                      )}
                      {emp.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-stone-400" /> {emp.email}
                        </div>
                      )}
                      {!emp.phone && !emp.email && <span className="text-stone-400 italic">Chưa cập nhật</span>}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-stone-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {emp.hireDate}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-stone-900">
                      {new Intl.NumberFormat('vi-VN').format(emp.baseSalary)} đ
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {emp.userId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
                          <UserCheck className="h-3 w-3" /> Đã liên kết (ID: {emp.userId})
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">Chưa liên kết</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        title="Bấm để đổi trạng thái"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {emp.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Đang làm việc
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Tạm ngưng
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
                        title="Chỉnh sửa hồ sơ"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-fade-up-1 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-700" />
                {editingEmployee ? 'Chỉnh sửa hồ sơ nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mã nhân viên {editingEmployee ? '(Cố định)' : '(Để trống sẽ tự sinh NV-XXXX)'}
                </label>
                <input
                  type="text"
                  disabled={!!editingEmployee}
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: NV-001"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Vị trí / Chức vụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Bếp trưởng, Phục vụ,..."
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ngày vào làm <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mức lương cơ bản (VND / tháng chuẩn) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="10000"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600 font-semibold text-stone-900"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  = {new Intl.NumberFormat('vi-VN').format(Number(formData.baseSalary) || 0)} đ/tháng
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nhanvien@banquethub.vn"
                    className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  User ID hệ thống (Nếu liên kết tài khoản ROLE_EMPLOYEE)
                </label>
                <input
                  type="number"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="Để trống nếu nhân viên chưa có tài khoản đăng nhập"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú về nhân sự, kinh nghiệm, ca làm việc..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingEmployee ? 'Lưu cập nhật' : 'Tạo hồ sơ nhân viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
