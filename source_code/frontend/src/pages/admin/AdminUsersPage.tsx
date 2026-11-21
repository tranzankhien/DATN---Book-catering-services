import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Briefcase,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Copy,
  Check,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import {
  userService,
  type AdminUserSummary,
  type AdminUserDetail,
  type UserEmployeeInfo,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../../services/userService';
import type { Role } from '../../services/types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(0);
  const [size] = useState<number>(10);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Unlinked employees for assignment
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<UserEmployeeInfo[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'ROLE_USER',
    active: true,
    employeeId: null,
  });
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateUserPayload>({
    fullName: '',
    phone: '',
    role: 'ROLE_USER',
    active: true,
    employeeId: null,
  });

  // Lock state
  const [lockReason, setLockReason] = useState<string>('');

  // Reset password state
  const [customNewPassword, setCustomNewPassword] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        page,
        size,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });
      setUsers(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải danh sách tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, size, showToast]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Load unlinked employees
  const loadUnlinkedEmployees = async (userIdToInclude?: number) => {
    try {
      const list = await userService.getUnlinkedEmployees(userIdToInclude);
      setUnlinkedEmployees(list);
    } catch {
      // ignore
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'ROLE_USER',
      active: true,
      employeeId: null,
    });
    void loadUnlinkedEmployees();
    setShowCreateModal(true);
  };

  // Submit Create
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, email và mật khẩu.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await userService.createUser(createForm);
      showToast('Đã tạo tài khoản người dùng thành công!', 'success');
      setShowCreateModal(false);
      void fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Tạo tài khoản thất bại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUserSummary) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
      active: user.active,
      employeeId: user.employeeId || null,
    });
    void loadUnlinkedEmployees(user.id);
    setShowEditModal(true);
  };

  // Submit Edit
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editForm.fullName.trim()) {
      showToast('Họ và tên không được để trống.', 'error');
      return;
    }
    try {
      setActionLoading(true);
      await userService.updateUser(selectedUser.id, editForm);
      showToast('Cập nhật thông tin tài khoản thành công!', 'success');
      setShowEditModal(false);
      void fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Cập nhật tài khoản thất bại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetail = async (user: AdminUserSummary) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    try {
      setDetailLoading(true);
      const detail = await userService.getUserDetail(user.id);
      setUserDetail(detail);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải chi tiết tài khoản', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Lock / Unlock Modal
  const handleOpenLock = (user: AdminUserSummary) => {
    setSelectedUser(user);
    setLockReason('');
    setShowLockModal(true);
  };

  // Submit Lock / Unlock
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const nextStatus = !selectedUser.active;
    try {
      setActionLoading(true);
      await userService.updateUserStatus(selectedUser.id, nextStatus, lockReason);
      showToast(
        nextStatus ? 'Đã kích hoạt mở khóa tài khoản!' : 'Đã khóa tài khoản thành công!',
        'success'
      );
      setShowLockModal(false);
      void fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Thao tác trạng thái thất bại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenReset = (user: AdminUserSummary) => {
    setSelectedUser(user);
    setCustomNewPassword('');
    setGeneratedPassword('');
    setCopied(false);
    setShowResetModal(true);
  };

  // Submit Reset Password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await userService.resetPassword(selectedUser.id, customNewPassword.trim() || undefined);
      setGeneratedPassword(res.newPassword);
      showToast('Đặt lại mật khẩu thành công!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Copy Password to Clipboard
  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    void navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    showToast('Đã sao chép mật khẩu mới vào clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Open Delete Modal
  const handleOpenDelete = (user: AdminUserSummary) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Submit Delete
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await userService.deleteUser(selectedUser.id);
      showToast('Đã xóa tài khoản thành công!', 'success');
      setShowDeleteModal(false);
      void fetchUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể xóa tài khoản này.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick stats
  const totalAdmins = users.filter((u) => u.role === 'ROLE_ADMIN').length;
  const totalEmployees = users.filter((u) => u.role === 'ROLE_EMPLOYEE').length;
  const totalActive = users.filter((u) => u.active).length;

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
            <Shield className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span>Quản trị viên</span>
          </span>
        );
      case 'ROLE_EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
            <Briefcase className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Nhân viên</span>
          </span>
        );
      case 'ROLE_USER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
            <Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Khách hàng</span>
          </span>
        );
    }
  };

  const formatSimpleDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 animate-fade-up-1">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Quản lý tài khoản</h1>
            <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5">
              Admin Control
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Quản trị người dùng, phân quyền vai trò (User, Employee, Admin), khóa tài khoản và thiết lập an toàn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-xs"
            title="Tải lại danh sách"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Tổng tài khoản</span>
            <Users className="h-4 w-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-stone-900">{totalElements}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Tất cả tài khoản hệ thống</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Quản trị viên</span>
            <ShieldCheck className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{totalAdmins}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Quyền hạn cao nhất</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Nhân sự / Bếp</span>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{totalEmployees}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Liên kết hồ sơ nhân sự</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Đang hoạt động</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{totalActive}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sẵn sàng đăng nhập</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ROLE_ADMIN">Quản trị viên (ADMIN)</option>
            <option value="ROLE_EMPLOYEE">Nhân viên (EMPLOYEE)</option>
            <option value="ROLE_USER">Khách hàng (USER)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã bị khóa</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 whitespace-nowrap">Tài khoản & Liên hệ</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Vai trò</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Trạng thái</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Hoạt động & Ngày tạo</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                      <span>Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <Users className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-medium text-stone-600">Không tìm thấy tài khoản nào</p>
                    <p className="text-[11px] text-stone-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 shrink-0 mt-0.5">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-stone-900 text-sm">{u.fullName}</span>
                              {isCurrent && (
                                <span className="rounded bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 border border-amber-200 whitespace-nowrap">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 flex-wrap mt-0.5">
                              <span className="font-mono">{u.email}</span>
                              {u.phone && (
                                <>
                                  <span className="text-stone-300">•</span>
                                  <span className="font-mono text-stone-600">SĐT: {u.phone}</span>
                                </>
                              )}
                            </div>

                            {u.employeeCode && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-stone-100/80 text-stone-700 border border-stone-200 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
                                <Briefcase className="h-3 w-3 text-amber-700 shrink-0" />
                                <span>Hồ sơ NV:</span>
                                <span className="font-mono font-bold text-amber-800">{u.employeeCode}</span>
                                {u.employeePosition && (
                                  <>
                                    <span className="text-stone-300">•</span>
                                    <span className="truncate max-w-44 text-stone-600">{u.employeePosition}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Đã khóa</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          {u.orderCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                              <ShoppingBag className="h-3 w-3 text-amber-700 shrink-0" />
                              <span>{u.orderCount} đơn tiệc</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">0 đơn tiệc</span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-stone-400 shrink-0" />
                          <span>Tạo {formatSimpleDate(u.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                            title="Xem chi tiết tài khoản"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLock(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-stone-300 cursor-not-allowed'
                                : u.active
                                ? 'text-stone-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-stone-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              isCurrent
                                ? 'Không thể tự khóa tài khoản của chính mình'
                                : u.active
                                ? 'Khóa tài khoản này'
                                : 'Mở khóa tài khoản'
                            }
                          >
                            {u.active ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReset(u)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isCurrent ? 'Không thể tự xóa chính mình' : 'Xóa tài khoản'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50 text-xs">
            <span className="text-stone-500">
              Trang <span className="font-bold text-stone-900">{page + 1}</span> / {totalPages} (Tổng {totalElements} tài khoản)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up-1">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-base">Thêm tài khoản người dùng mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Email đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="name@banquethub.vn"
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Mật khẩu ban đầu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full text-xs rounded-xl border border-stone-200 pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                      tabIndex={-1}
                      title={showCreatePassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={createForm.phone || ''}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Vai trò tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-semibold"
                  >
                    <option value="ROLE_USER">Khách hàng (ROLE_USER)</option>
                    <option value="ROLE_EMPLOYEE">Nhân viên (ROLE_EMPLOYEE)</option>
                    <option value="ROLE_ADMIN">Quản trị viên (ROLE_ADMIN)</option>
                  </select>
                </div>
              </div>

              {/* Nếu chọn EMPLOYEE -> Có dropdown chọn liên kết nhân sự */}
              {createForm.role === 'ROLE_EMPLOYEE' && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3.5 space-y-1.5">
                  <label className="block text-xs font-bold text-blue-900">
                    Liên kết với hồ sơ nhân sự hiện có
                  </label>
                  <select
                    value={createForm.employeeId || ''}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        employeeId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full text-xs rounded-xl border border-blue-200 bg-white px-3 py-2 text-stone-800"
                  >
                    <option value="">-- Tự động tìm theo email hoặc liên kết sau --</option>
                    {unlinkedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName} ({emp.position})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-700">
                    Chọn hồ sơ nhân viên để tài khoản này có thể truy cập Lịch điều phối bếp và Phiếu lương cá nhân.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create-active"
                  checked={createForm.active}
                  onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="create-active" className="text-xs font-medium text-stone-700">
                  Kích hoạt tài khoản ngay sau khi tạo
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA TÀI KHOẢN */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up-1">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-base">Chỉnh sửa tài khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 bg-stone-100 text-stone-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-stone-400">Email không thể thay đổi để đảm bảo tính toàn vẹn dữ liệu.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Vai trò tài khoản <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-semibold"
                  >
                    <option value="ROLE_USER">Khách hàng (ROLE_USER)</option>
                    <option value="ROLE_EMPLOYEE">Nhân viên (ROLE_EMPLOYEE)</option>
                    <option value="ROLE_ADMIN">Quản trị viên (ROLE_ADMIN)</option>
                  </select>
                </div>
              </div>

              {editForm.role === 'ROLE_EMPLOYEE' && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-200 p-3.5 space-y-1.5">
                  <label className="block text-xs font-bold text-blue-900">Hồ sơ nhân sự liên kết</label>
                  <select
                    value={editForm.employeeId || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        employeeId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full text-xs rounded-xl border border-blue-200 bg-white px-3 py-2 text-stone-800"
                  >
                    <option value="">-- Chưa liên kết hồ sơ --</option>
                    {unlinkedEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM CHI TIẾT TÀI KHOẢN & LỊCH SỬ HOẠT ĐỘNG */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-up-1">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-base">Hồ sơ chi tiết tài khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="py-12 text-center text-stone-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent mx-auto mb-2" />
                  <span>Đang tải thông tin chi tiết...</span>
                </div>
              ) : userDetail ? (
                <>
                  {/* Basic Profile Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-amber-700 text-white flex items-center justify-center text-lg font-bold shadow-xs">
                        {userDetail.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{userDetail.fullName}</h4>
                        <p className="text-xs text-stone-500">{userDetail.email}</p>
                        <p className="text-xs text-stone-600 font-mono mt-0.5">{userDetail.phone || 'Chưa cập nhật SĐT'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
                      {getRoleBadge(userDetail.role)}
                      {userDetail.active ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Tài khoản bị khóa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Ngày tham gia</span>
                      <span className="font-medium text-stone-800">{formatDate(userDetail.createdAt)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Lần đăng nhập cuối</span>
                      <span className="font-medium text-stone-800">{formatDate(userDetail.lastLoginAt)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tổng đơn tiệc</span>
                      <span className="font-bold text-stone-900">{userDetail.totalOrders} đơn</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">Tổng chi tiêu đã trả</span>
                      <span className="font-bold text-amber-800 font-mono">
                        {Number(userDetail.totalSpent).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Employee Info if Linked */}
                  {userDetail.employeeInfo && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <Briefcase className="h-4 w-4 text-blue-700" />
                        <span>Hồ sơ nhân viên liên kết</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-blue-500 text-[10px] block">Mã nhân viên</span>
                          <span className="font-mono font-bold text-blue-900">{userDetail.employeeInfo.employeeCode}</span>
                        </div>
                        <div>
                          <span className="text-blue-500 text-[10px] block">Vị trí / Chức danh</span>
                          <span className="font-medium text-blue-900">{userDetail.employeeInfo.position}</span>
                        </div>
                        <div>
                          <span className="text-blue-500 text-[10px] block">Lương cơ bản</span>
                          <span className="font-mono font-medium text-blue-900">
                            {Number(userDetail.employeeInfo.baseSalary).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-500 text-[10px] block">Trạng thái làm việc</span>
                          <span className="font-bold text-emerald-700">{userDetail.employeeInfo.status}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders List */}
                  <div>
                    <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-700" />
                      <span>Đơn đặt tiệc gần đây ({userDetail.recentOrders.length})</span>
                    </h5>
                    {userDetail.recentOrders.length === 0 ? (
                      <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl border border-stone-100 text-center">
                        Người dùng này chưa phát sinh đơn đặt tiệc nào.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100 text-xs">
                        {userDetail.recentOrders.map((ord) => (
                          <div key={ord.id} className="p-3 flex items-center justify-between hover:bg-stone-50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-800">{ord.orderCode}</span>
                                <span className="text-stone-400">•</span>
                                <span className="text-stone-700 font-medium">{ord.tableCount} bàn</span>
                              </div>
                              <span className="text-[11px] text-stone-400">{formatDate(ord.eventDateTime)}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-stone-900 block">
                                {Number(ord.totalAmount).toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[10px] rounded bg-stone-100 text-stone-600 px-1.5 py-0.5">
                                {ord.orderStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KHÓA / MỞ KHÓA TÀI KHOẢN */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-up-1">
            <div className="p-6 text-center space-y-3">
              <div
                className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
                  selectedUser.active ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {selectedUser.active ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
              </div>
              <h3 className="font-bold text-stone-900 text-base">
                {selectedUser.active ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
              </h3>
              <p className="text-xs text-stone-500">
                {selectedUser.active
                  ? `Bạn có chắc chắn muốn vô hiệu hóa tài khoản '${selectedUser.fullName}' (${selectedUser.email})? Người dùng sẽ bị chấm dứt phiên làm việc ngay lập tức.`
                  : `Kích hoạt lại tài khoản '${selectedUser.fullName}' (${selectedUser.email}) để người dùng có thể đăng nhập bình thường.`}
              </p>

              {selectedUser.active && (
                <div className="text-left pt-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Lý do khóa tài khoản (tùy chọn)</label>
                  <input
                    type="text"
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="Ví dụ: Vi phạm quy chế bảo mật"
                    className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleStatus}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 ${
                  selectedUser.active ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Đang xử lý...' : selectedUser.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ĐẶT LẠI MẬT KHẨU */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-up-1">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-stone-900 text-base">Đặt lại mật khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-stone-600">
                  Đặt lại mật khẩu cho tài khoản: <span className="font-bold text-stone-900">{selectedUser.email}</span>
                </p>
              </div>

              {!generatedPassword ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mật khẩu mới mong muốn (để trống để hệ thống tự sinh ngẫu nhiên)
                    </label>
                    <input
                      type="text"
                      value={customNewPassword}
                      onChange={(e) => setCustomNewPassword(e.target.value)}
                      placeholder="Để trống để tự tạo mật khẩu mạnh"
                      className="w-full text-xs rounded-xl border border-stone-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleResetPassword}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    {actionLoading ? 'Đang đặt lại...' : 'Khởi tạo đặt lại mật khẩu'}
                  </button>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900">Mật khẩu mới đã được cập nhật thành công!</p>
                    <div className="flex items-center justify-center gap-2 bg-white rounded-xl p-2.5 border border-emerald-300 font-mono text-sm font-bold text-stone-900">
                      <span>{generatedPassword}</span>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 text-stone-400 hover:text-emerald-700 transition-colors"
                        title="Sao chép mật khẩu"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Vui lòng sao chép và gửi mật khẩu này cho người dùng để họ đăng nhập và đổi mật khẩu mới.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors"
                  >
                    Đã lưu mật khẩu & Hoàn tất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: XÁC NHẬN XÓA TÀI KHOẢN */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-up-1">
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">Xóa vĩnh viễn tài khoản?</h3>
              <p className="text-xs text-stone-600">
                Bạn có chắc chắn muốn xóa tài khoản{' '}
                <span className="font-bold text-stone-900">{selectedUser.fullName}</span> ({selectedUser.email})?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-[11px] text-rose-700 space-y-1">
                <p className="font-bold">Lưu ý an toàn nghiệp vụ:</p>
                <p>• Không thể xóa tài khoản đã từng đặt đơn tiệc hoặc có giao dịch thanh toán.</p>
                <p>• Không thể xóa tài khoản đã liên kết với hồ sơ nhân viên trong hệ thống.</p>
                <p>• Trong trường hợp đó, bạn vui lòng sử dụng tính năng <strong>Khóa tài khoản</strong>.</p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteUser}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
