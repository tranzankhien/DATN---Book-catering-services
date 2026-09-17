import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, Mail, AlertCircle, Loader2, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { extractErrorMessage } from '../services/apiClient';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fromPath = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login({ email: email.trim(), password });
      showToast(`Xin chào ${loggedInUser.fullName}! Đăng nhập thành công.`, 'success');

      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else if (loggedInUser.role === 'ROLE_ADMIN') {
        navigate('/admin/catalog', { replace: true });
      } else {
        navigate('/dishes', { replace: true });
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Email hoặc mật khẩu không chính xác.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Đăng nhập BanquetHub</h1>
          <p className="text-xs text-stone-500">
            Truy cập hệ thống đặt tiệc hoặc khu vực quản trị cơ sở kinh doanh
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
            <label htmlFor="loginEmail" className="block text-xs font-bold text-stone-700 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="loginEmail"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhap-email@banquethub.vn"
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="loginPassword"
              className="block text-xs font-bold text-stone-700 mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                id="loginPassword"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 focus:border-amber-600 focus:outline-none"
              />
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
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill for Local Development */}
        {import.meta.env.DEV && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Điền nhanh tài khoản Demo (Local Dev)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@banquethub.vn', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:border-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('user@banquethub.vn', 'User@123')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:border-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>User Demo</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-600">
          Chưa có tài khoản khách hàng?{' '}
          <Link to="/register" className="font-bold text-amber-700 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
