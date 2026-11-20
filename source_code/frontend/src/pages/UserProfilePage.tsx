import React, { useEffect, useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  Save,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Users,
} from 'lucide-react';
import { userService, type ChangePasswordPayload, type UpdateProfilePayload } from '../services/userService';
import type { Role, UserDto } from '../services/types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const UserProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    fullName: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Security / Password Form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      showToast('Họ và tên không được để trống.', 'error');
      return;
    }
    try {
      setProfileLoading(true);
      await userService.updateProfile(profileForm);
      await refreshProfile();
      showToast('Đã cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể cập nhật thông tin cá nhân.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Xác nhận mật khẩu mới không khớp.', 'error');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showToast('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'error');
      return;
    }

    try {
      setPasswordLoading(true);
      await userService.changePassword(passwordForm);
      showToast('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 text-xs font-bold">
            <Shield className="h-3.5 w-3.5 text-purple-700" />
            <span>Quản trị viên (ADMIN)</span>
          </span>
        );
      case 'ROLE_EMPLOYEE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-bold">
            <Briefcase className="h-3.5 w-3.5 text-blue-700" />
            <span>Nhân sự điều phối / Bếp</span>
          </span>
        );
      case 'ROLE_USER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold">
            <Users className="h-3.5 w-3.5 text-emerald-700" />
            <span>Khách hàng thành viên</span>
          </span>
        );
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#fdfcfa] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-amber-800/20 shrink-0">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {user?.fullName}
                </h1>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Mail className="h-3.5 w-3.5 text-stone-400" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
              {getRoleBadge(user?.role)}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tài khoản đang hoạt động</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-stone-100 mt-6 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>Bảo mật & Đổi mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-bold text-stone-900 mb-1">Chỉnh sửa thông tin liên hệ</h2>
              <p className="text-xs text-stone-500 mb-6">
                Cập nhật họ tên và số điện thoại để nhà hàng dễ dàng phục vụ và liên hệ điều phối tiệc.
              </p>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Email tài khoản</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 bg-stone-100 text-stone-500 cursor-not-allowed font-mono"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Email là định danh đăng nhập duy nhất và không thể thay đổi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Số điện thoại liên lạc</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50 font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Account Info Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Thông tin tài khoản</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-stone-500">Mã tài khoản:</span>
                    <span className="font-mono font-bold text-stone-900">#{user?.id}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-stone-500">Ngày tham gia:</span>
                    <span className="font-medium text-stone-900">{formatDate(user?.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Phân quyền:</span>
                    <span className="font-semibold text-amber-800">{user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 text-xs space-y-2 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Shield className="h-4 w-4 text-amber-700" />
                  <span>Chính sách tài khoản</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Thông tin vai trò được phân định nghiêm ngặt bởi Quản trị viên hệ thống. Người dùng không thể tự nâng quyền hoặc thay đổi trạng thái tài khoản.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Change Password */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-stone-900 mb-1">Đổi mật khẩu tài khoản</h2>
              <p className="text-xs text-stone-500">
                Vui lòng cung cấp mật khẩu hiện tại và tạo mật khẩu mới an toàn có ít nhất 6 ký tự.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Nhập mật khẩu hiện đang dùng"
                    className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới vừa gõ"
                  className="w-full text-xs rounded-xl border border-stone-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-stone-50/50"
                />
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 space-y-1">
                <p className="font-bold text-stone-800">Quy tắc mật khẩu an toàn:</p>
                <p>• Độ dài tối thiểu 6 ký tự, khuyến khích kết hợp chữ hoa, chữ thường và chữ số.</p>
                <p>• Mật khẩu mới không được trùng với mật khẩu đang sử dụng hiện tại.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>{passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
