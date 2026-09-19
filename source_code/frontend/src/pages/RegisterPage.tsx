import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';
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
      showToast(`Chúc mừng ${createdUser.fullName}! Đăng ký tài khoản thành công.`, 'success');
      navigate('/dishes', { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể hoàn tất đăng ký tài khoản.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/60 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gold-border-glow">
        {/* Left Side: Brand Story */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-stone-950">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80"
            alt="Banquet Culinary Experience"
            className="absolute inset-0 h-full w-full object-cover opacity-30 brightness-75"
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
            <p className="text-xs text-amber-400 font-medium">Đặc Quyền Thành Viên Đặt Tiệc</p>
          </div>

          <div className="relative z-10 space-y-3 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Chủ động xây dựng thực đơn theo từng bàn tiệc</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Được giữ chỗ và giữ nguyên liệu trong 15 phút</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Sử dụng trợ lý AI Gemini gợi ý thực đơn thông minh</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tài Khoản Khách Hàng (ROLE_USER)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif-luxury text-white">
              Đăng Ký Thành Viên
            </h1>
            <p className="text-xs text-stone-400">
              Điền thông tin để bắt đầu trải nghiệm đặt tiệc tiêu chuẩn 5 sao
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
              <label htmlFor="regFullName" className="block text-xs font-bold text-stone-300 mb-1.5">
                Họ và Tên <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="regFullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn An"
                  className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="regEmail" className="block text-xs font-bold text-stone-300 mb-1.5">
                  Địa Chỉ Email <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khach@example.com"
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-3 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regPhone" className="block text-xs font-bold text-stone-300 mb-1.5">
                  Số Điện Thoại
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    id="regPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-3 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="regPassword"
                  className="block text-xs font-bold text-stone-300 mb-1.5"
                >
                  Mật Khẩu <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    id="regPassword"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-3 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="regConfirmPassword"
                  className="block text-xs font-bold text-stone-300 mb-1.5"
                >
                  Xác Nhận Mật Khẩu <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    id="regConfirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full rounded-2xl border border-stone-800 bg-stone-950/80 pl-11 pr-3 py-3 text-xs sm:text-sm text-white placeholder:text-stone-400 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
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
                  <span>Đang khởi tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Hoàn Tất Đăng Ký</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-400">
            Đã có tài khoản thành viên?{' '}
            <Link to="/login" className="font-bold text-amber-400 hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
