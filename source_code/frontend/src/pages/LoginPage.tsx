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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gold-border-glow">
        {/* Left Side: Brand Story & Banquet Atmosphere */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-stone-950">
          <img
            src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1000&q=80"
            alt="Luxury Banquet Ambiance"
            className="absolute inset-0 h-full w-full object-cover opacity-35 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 font-black">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span className="text-xl font-black font-serif-luxury text-white">
                BANQUET<span className="gold-gradient-text">HUB</span>
              </span>
            </div>
            <p className="text-xs text-amber-400 font-medium">Hệ Thống Yến Tiệc & Quản Lý Độc Bản</p>
          </div>

          <div className="relative z-10 space-y-4">
            <blockquote className="border-l-2 border-amber-500 pl-4 text-xs italic text-stone-300 leading-relaxed">
              "Sự chuẩn xác trong từng định lượng nguyên liệu là nền tảng tạo nên hương vị hoàn hảo
              và trải nghiệm tiệc đẳng cấp nhất."
            </blockquote>
            <p className="text-[11px] text-stone-400 font-mono">Bản quyền phần mềm BanquetHub MVP</p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Xác Thực Tài Khoản</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-luxury text-white">
              Đăng Nhập Hệ Thống
            </h1>
            <p className="text-xs text-stone-400">
              Truy cập tài khoản để xây dựng thực đơn hoặc vào phân hệ quản trị
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs font-medium text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="loginEmail" className="block text-xs font-bold text-stone-300 mb-1.5">
                Địa Chỉ Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="loginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@banquethub.vn"
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="loginPassword"
                className="block text-xs font-bold text-stone-300 mb-1.5"
              >
                Mật Khẩu
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-11 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3.5 text-xs font-black text-stone-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-101 disabled:opacity-50 transition-all cursor-pointer"
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
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Chọn nhanh tài khoản Demo (Local Dev):
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@banquethub.vn', 'Admin@123')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-stone-800 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('user@banquethub.vn', 'User@123')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-xs font-bold text-stone-300 hover:bg-stone-800 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>User Demo</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-stone-400">
            Chưa có tài khoản khách hàng?{' '}
            <Link to="/register" className="font-bold text-amber-400 hover:underline">
              Đăng ký tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
