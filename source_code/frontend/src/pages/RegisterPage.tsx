import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../services/apiClient';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      showToast(`Chào mừng ${createdUser.fullName}! Đăng ký tài khoản thành công.`, 'success');
      navigate('/dishes', { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể đăng ký tài khoản.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Đăng ký Tài khoản Khách hàng</h1>
          <p className="text-xs text-stone-500">
            Tạo tài khoản để xây dựng thực đơn và đặt tiệc trực tuyến trên BanquetHub
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="regFullName" className="block text-xs font-bold text-stone-700 mb-1.5">
              Họ và tên <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="regFullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn An"
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="regEmail" className="block text-xs font-bold text-stone-700 mb-1.5">
              Địa chỉ Email <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="regEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="khachhang@example.com"
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="regPhone" className="block text-xs font-bold text-stone-700 mb-1.5">
              Số điện thoại liên hệ
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="regPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="regPassword"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Mật khẩu <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="regPassword"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="regConfirmPassword"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Xác nhận mật khẩu <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="regConfirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Hoàn tất đăng ký</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-bold text-amber-700 hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
};
