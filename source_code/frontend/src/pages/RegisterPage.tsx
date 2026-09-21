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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Warm Light Brand Story Panel (BRIGHT & ELEGANT) */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100/50 border-r border-stone-200">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85"
            alt="Banquet Culinary Experience"
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
              Đăng ký tài khoản để khám phá thực đơn tiệc độc bản, chuẩn hóa nguyên liệu và nhận tư vấn chuyên nghiệp.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="space-y-2 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Chủ động xây dựng thực đơn theo từng bàn tiệc</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Được giữ chỗ và giữ nguyên liệu an toàn 15 phút</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Gợi ý thực đơn thông minh & tối ưu chi phí</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/80">
              <p className="text-[11px] text-stone-500 italic">
                "Khởi đầu trọn vẹn cho những sự kiện yến tiệc đáng nhớ nhất."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Đăng Ký Thành Viên Đặt Tiệc</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Đăng Ký Thành Viên
            </h1>
            <p className="text-xs text-stone-500">
              Điền thông tin để bắt đầu trải nghiệm đặt tiệc tiêu chuẩn 5 sao
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="regFullName" className="block text-xs font-semibold text-stone-700 mb-1">
                Họ và Tên <span className="text-amber-700">*</span>
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
                  className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="regEmail" className="block text-xs font-semibold text-stone-700 mb-1">
                  Địa Chỉ Email <span className="text-amber-700">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khach@example.com"
                    className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regPhone" className="block text-xs font-semibold text-stone-700 mb-1">
                  Số Điện Thoại
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    id="regPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="regPassword"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Mật Khẩu <span className="text-amber-700">*</span>
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
                    className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="regConfirmPassword"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Xác Nhận Mật Khẩu <span className="text-amber-700">*</span>
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
                    className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 py-3 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer mt-2"
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

          <p className="text-center text-xs text-stone-500">
            Đã có tài khoản thành viên?{' '}
            <Link to="/login" className="font-semibold text-amber-700 hover:underline">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
