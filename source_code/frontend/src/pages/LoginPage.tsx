import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogIn,
  KeyRound,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
      showToast(`Kính chào ${loggedInUser.fullName}! Đăng nhập thành công.`, 'success');

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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Warm Light Brand Story Panel (BRIGHT & ELEGANT) */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100/50 border-r border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85"
            alt="Luxury Banquet Hospitality"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-amber-50/50" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white font-bold shadow-xs">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-stone-900">
                  Banquet<span className="text-amber-700">Hub</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 -mt-0.5">
                  Dịch Vụ Yến Tiệc 5 Sao
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Không gian ẩm thực đẳng cấp và giải pháp đặt tiệc trọn gói hàng đầu.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="space-y-2 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Minh bạch định lượng nguyên liệu 1 bàn</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tự do xây dựng thực đơn món tiệc</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Giữ chỗ an toàn 15 phút khi đặt đơn</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/80">
              <p className="text-[11px] text-stone-500 italic">
                "Định lượng chuẩn xác - Hương vị tinh hoa - Dịch vụ chu đáo."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Cổng Đăng Nhập Thành Viên</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Đăng Nhập Hệ Thống
            </h1>
            <p className="text-xs text-stone-500">
              Truy cập tài khoản để tự xây dựng thực đơn hoặc theo dõi tiến độ tiệc
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
              <label htmlFor="loginEmail" className="block text-xs font-semibold text-stone-700 mb-1">
                Địa Chỉ Email
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
                  placeholder="name@banquethub.vn"
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="loginPassword"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Mật Khẩu
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 py-3 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Đăng Nhập Ngay</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Tài khoản trải nghiệm mẫu:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@banquethub.vn', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-amber-500 transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                <span>Tài khoản Quản lý</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('user@banquethub.vn', 'User@123')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:border-emerald-500 transition-colors cursor-pointer shadow-xs"
              >
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Tài khoản Khách hàng</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-stone-500">
            Chưa có tài khoản thành viên?{' '}
            <Link to="/register" className="font-semibold text-amber-700 hover:underline">
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
