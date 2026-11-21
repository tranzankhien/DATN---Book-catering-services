import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import { extractErrorMessage } from '../services/apiClient';
import { Logo } from '../components/ui/Logo';

const STORAGE_KEY_STEP = 'banquethub_reg_step';
const STORAGE_KEY_EMAIL = 'banquethub_reg_email';
const STORAGE_KEY_COOLDOWN_PREFIX = 'banquethub_otp_cooldown_';

const getStoredCooldown = (emailAddr: string): number => {
  if (!emailAddr) return 0;
  const raw = sessionStorage.getItem(STORAGE_KEY_COOLDOWN_PREFIX + emailAddr.toLowerCase().trim());
  if (!raw) return 0;
  const expireAt = parseInt(raw, 10);
  if (isNaN(expireAt)) return 0;
  const remainingSec = Math.ceil((expireAt - Date.now()) / 1000);
  return remainingSec > 0 ? remainingSec : 0;
};

const setStoredCooldown = (emailAddr: string, seconds = 60): void => {
  if (!emailAddr) return;
  const expireAt = Date.now() + seconds * 1000;
  sessionStorage.setItem(STORAGE_KEY_COOLDOWN_PREFIX + emailAddr.toLowerCase().trim(), String(expireAt));
};

export const RegisterPage: React.FC = () => {
  const { register, verifyEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { step?: 'FORM' | 'VERIFY_OTP'; email?: string } | null;

  const initialEmail = locationState?.email || sessionStorage.getItem(STORAGE_KEY_EMAIL) || '';
  const initialStep = (locationState?.step || sessionStorage.getItem(STORAGE_KEY_STEP) || 'FORM') as 'FORM' | 'VERIFY_OTP';

  // Step 1: Form state
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>(initialEmail);
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 2: Email verification state (Strict: No bypass allowed)
  const [step, setStep] = useState<'FORM' | 'VERIFY_OTP'>(initialStep);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(() => getStoredCooldown(initialEmail));
  const [resending, setResending] = useState<boolean>(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;
  const isPasswordMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Strength score: 0 to 3
  const strengthScore = (hasMinLength ? 1 : 0) + (hasUppercase ? 1 : 0) + (hasNumber ? 1 : 0);

  // Timer countdown for resending verification code - driven by real wall-clock time
  useEffect(() => {
    const updateTimer = () => {
      const remaining = getStoredCooldown(email);
      setResendCooldown(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Mật khẩu chưa đáp ứng tiêu chuẩn an toàn (tối thiểu 8 ký tự, 1 chữ in hoa, 1 chữ số).');
      return;
    }
    if (!confirmPassword) {
      setErrorMsg('Vui lòng nhập lại mật khẩu vào ô Xác nhận mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    setSubmitting(true);
    try {
      const authRes = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });

      if (authRes.emailVerificationRequired) {
        sessionStorage.setItem(STORAGE_KEY_STEP, 'VERIFY_OTP');
        sessionStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
        setStoredCooldown(email.trim(), 60);
        setStep('VERIFY_OTP');
        setResendCooldown(60);
        showToast('Mã xác thực đã được gửi tới email! Vui lòng kiểm tra hộp thư đến (Inbox) hoặc Spam.', 'success');
      } else {
        showToast(`Chúc mừng ${authRes.user.fullName}! Đăng ký tài khoản thành công.`, 'success');
        navigate('/dishes', { replace: true });
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể hoàn tất đăng ký tài khoản.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const code = verificationCode.trim();
    if (!code || code.length !== 6) {
      setErrorMsg('Vui lòng nhập đúng mã xác thực gồm 6 chữ số đã gửi về email.');
      return;
    }

    setVerifyLoading(true);
    try {
      const authRes = await verifyEmail({ email: email.trim(), code });
      sessionStorage.removeItem(STORAGE_KEY_STEP);
      sessionStorage.removeItem(STORAGE_KEY_EMAIL);
      sessionStorage.removeItem(STORAGE_KEY_COOLDOWN_PREFIX + email.toLowerCase().trim());
      showToast(`Kích hoạt email thành công! Chào mừng ${authRes.user.fullName} đến với BanquetHub.`, 'success');
      navigate('/dishes', { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Mã xác thực không chính xác hoặc đã hết hạn.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMsg(null);
    try {
      const res = await authService.resendVerification({ email: email.trim() });
      setStoredCooldown(email.trim(), 60);
      setResendCooldown(60);
      showToast(res.message || `Đã gửi lại mã xác thực mới vào email ${email.trim()}. Vui lòng kiểm tra hộp thư đến (hoặc Spam).`, 'success');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Warm Light Brand Story Panel */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-amber-50/70 via-stone-50 to-amber-100/40 border-r border-stone-200">
          <div className="relative z-10 space-y-3">
            <Logo size="md" />
            <p className="text-xs text-stone-600 leading-relaxed font-medium pt-1">
              Đăng ký tài khoản để khám phá thực đơn tiệc độc bản, bảo vệ nguyên liệu và trải nghiệm ẩm thực yến tiệc chuyên nghiệp.
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
                <span>Hệ thống xác thực tài khoản & bảo mật 2 lớp</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200/80">
              <p className="text-[11px] text-stone-500 italic">
                "Khởi đầu trọn vẹn cho những sự kiện yến tiệc đáng nhớ nhất."
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Step 1 (Register) or Step 2 (Verify OTP) */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
          {step === 'FORM' ? (
            <>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-900">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Đăng ký thành viên đặt tiệc</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Tạo tài khoản mới
                </h1>
                <p className="text-xs text-stone-500">
                  Điền thông tin bên dưới để bắt đầu trải nghiệm yến tiệc tiêu chuẩn cao cấp
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
                  <label htmlFor="regFullName" className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và tên <span className="text-amber-700">*</span>
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
                      className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="regEmail" className="block text-xs font-semibold text-stone-700 mb-1">
                      Địa chỉ email <span className="text-amber-700">*</span>
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
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="regPhone" className="block text-xs font-semibold text-stone-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="regPhone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Password field with Eye toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="regPassword" className="block text-xs font-semibold text-stone-700 mb-1">
                      Mật khẩu <span className="text-amber-700">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="regPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                        tabIndex={-1}
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password field with Eye toggle */}
                  <div>
                    <label htmlFor="regConfirmPassword" className="block text-xs font-semibold text-stone-700 mb-1">
                      Xác nhận mật khẩu <span className="text-amber-700">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        id="regConfirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full rounded-xl border border-stone-300 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none transition-colors shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
                        tabIndex={-1}
                        title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password strength and requirements checklist */}
                <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
                    <span>Độ mạnh mật khẩu:</span>
                    <span
                      className={
                        strengthScore === 3
                          ? 'text-emerald-700 font-bold'
                          : strengthScore === 2
                          ? 'text-amber-700 font-bold'
                          : strengthScore === 1
                          ? 'text-rose-600 font-bold'
                          : 'text-stone-400'
                      }
                    >
                      {strengthScore === 3 ? 'Rất an toàn' : strengthScore === 2 ? 'Khá' : strengthScore === 1 ? 'Yếu' : 'Chưa nhập'}
                    </span>
                  </div>

                  {/* Strength Bar: Fixed Coloring Logic */}
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 rounded-full overflow-hidden bg-stone-200">
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strengthScore >= 1
                          ? strengthScore === 3
                            ? 'bg-emerald-500'
                            : strengthScore === 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-stone-200'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strengthScore >= 2
                          ? strengthScore === 3
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                          : 'bg-stone-200'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strengthScore === 3 ? 'bg-emerald-500' : 'bg-stone-200'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? 'text-emerald-700 font-medium' : 'text-stone-500'
                      }`}
                    >
                      {hasMinLength ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0 ml-1 mr-0.5" />
                      )}
                      <span>Tối thiểu 8 ký tự</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        hasUppercase ? 'text-emerald-700 font-medium' : 'text-stone-500'
                      }`}
                    >
                      {hasUppercase ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0 ml-1 mr-0.5" />
                      )}
                      <span>Ít nhất 1 chữ in hoa (A-Z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? 'text-emerald-700 font-medium' : 'text-stone-500'
                      }`}
                    >
                      {hasNumber ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0 ml-1 mr-0.5" />
                      )}
                      <span>Ít nhất 1 chữ số (0-9)</span>
                    </div>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div
                      className={`text-[11px] pt-1 flex items-center gap-1.5 ${
                        isPasswordMatch ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'
                      }`}
                    >
                      {isPasswordMatch ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      )}
                      <span>{isPasswordMatch ? 'Mật khẩu xác nhận khớp hoàn toàn' : 'Mật khẩu xác nhận chưa khớp'}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 py-3 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer mt-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Tiếp tục & Xác thực Email</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-stone-500 pt-2">
                Đã có tài khoản thành viên?{' '}
                <Link to="/login" className="font-semibold text-amber-700 hover:underline">
                  Đăng nhập tại đây
                </Link>
              </p>
            </>
          ) : (
            /* STEP 2: EMAIL OTP VERIFICATION (Clean Production Flow, NO Demo Fake Box) */
            <div className="space-y-5 animate-fade-up-1">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Bước 2: Xác thực email bảo vệ tài khoản</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Nhập mã xác nhận email
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hệ thống đã gửi mã xác thực 6 chữ số đến hòm thư{' '}
                  <span className="font-bold text-stone-900">{email}</span>. Quý khách vui lòng kiểm tra hộp thư đến (Inbox) hoặc hòm thư Spam / Thư rác để hoàn tất.
                </p>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-bold text-stone-700 mb-1.5">
                    Mã xác nhận 6 số <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Nhập 6 chữ số"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-3 px-4 rounded-xl border-2 border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 focus:outline-none bg-white text-stone-900 shadow-xs"
                  />
                  <p className="text-[11px] text-stone-500 mt-1 text-center">
                    Mã có hiệu lực trong vòng 15 phút
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading || verificationCode.length !== 6}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs sm:text-sm font-bold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {verifyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang kiểm tra mã...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Xác thực & Kích hoạt tài khoản</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200/80 text-xs text-stone-600">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || resending}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 font-semibold text-amber-700 hover:text-amber-800 disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `Gửi lại mã sau (${resendCooldown}s)`
                      : 'Chưa nhận được mã? Gửi lại mã'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem(STORAGE_KEY_STEP);
                    setStep('FORM');
                    setVerificationCode('');
                    setErrorMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-700 font-medium hover:underline cursor-pointer"
                >
                  <span>&larr; Đổi email hoặc chỉnh sửa thông tin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
