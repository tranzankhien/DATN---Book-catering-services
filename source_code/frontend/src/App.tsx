import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { API_BASE_URL, AUTH_ENDPOINTS, AUTH_STORAGE_KEY, PASSWORD_RULES } from './constants/auth'

type Step = 1 | 2 | 3

async function request(path: string, body: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Yêu cầu không thành công')
  return data
}

function PasswordRules({ password, confirm }: { password: string; confirm: string }) {
  const rules = useMemo(() => [...PASSWORD_RULES.map(rule => [rule.label, rule.test(password)] as const), ['Mật khẩu nhập lại khớp', Boolean(confirm) && password === confirm] as const], [password, confirm])
  return <ul className="rules">{rules.map(([label, valid]) => <li className={valid ? 'valid' : ''} key={String(label)}><span>{valid ? '✓' : '○'}</span>{String(label)}</li>)}</ul>
}

function Login({ onRegister, onLoggedIn }: { onRegister: () => void; onLoggedIn: (token: string) => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setBusy(true); try { const data = await request(AUTH_ENDPOINTS.login, { email, password }); sessionStorage.setItem(AUTH_STORAGE_KEY, data.accessToken); onLoggedIn(data.accessToken) } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }
  return <Panel title="Đăng nhập" subtitle="Quản lý đặt tiệc của bạn"><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng nhập'}</button><button type="button" className="link" onClick={onRegister}>Tạo tài khoản mới</button></form></Panel>
}

function Register({ onLogin, onLoggedIn }: { onLogin: () => void; onLoggedIn: (token: string) => void }) {
  const [step, setStep] = useState<Step>(1); const [registrationId, setRegistrationId] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', address: '', customerType: 'INDIVIDUAL', companyName: '', code: '' })
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(previous => ({ ...previous, [key]: event.target.value }))
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setBusy(true); try { if (step === 1) { const data = await request(AUTH_ENDPOINTS.startRegistration, { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, confirmPassword: form.confirmPassword }); setRegistrationId(data.registrationId); setStep(2) } else if (step === 2) { await request(AUTH_ENDPOINTS.registrationDetails, { registrationId, address: form.address, customerType: form.customerType, companyName: form.customerType === 'BUSINESS' ? form.companyName : null }); setStep(3) } else { const data = await request(AUTH_ENDPOINTS.verifyRegistration, { registrationId, code: form.code }); sessionStorage.setItem(AUTH_STORAGE_KEY, data.accessToken); onLoggedIn(data.accessToken) } } catch (e) { setError((e as Error).message) } finally { setBusy(false) } }
  return <Panel title="Tạo tài khoản" subtitle={`Bước ${step}/3`}><form onSubmit={submit}>{step === 1 && <><label>Họ và tên<input value={form.fullName} onChange={set('fullName')} maxLength={120} required /></label><label>Email<input type="email" value={form.email} onChange={set('email')} required /></label><label>Số điện thoại<input type="tel" placeholder="0901234567 hoặc +84901234567" value={form.phone} onChange={set('phone')} required /></label><label>Mật khẩu<input type="password" value={form.password} onChange={set('password')} required /><PasswordRules password={form.password} confirm={form.confirmPassword} /></label><label>Nhập lại mật khẩu<input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required /></label></>}{step === 2 && <><label>Loại khách hàng<select value={form.customerType} onChange={set('customerType')}><option value="INDIVIDUAL">Cá nhân</option><option value="BUSINESS">Doanh nghiệp</option></select></label><label>Địa chỉ<input value={form.address} onChange={set('address')} required /></label>{form.customerType === 'BUSINESS' && <label>Tên công ty<input value={form.companyName} onChange={set('companyName')} required /></label>}</>}{step === 3 && <><p>Mã OTP 6 số đã gửi tới số điện thoại của bạn.</p><label>Mã OTP<input className="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={set('code')} required /></label></>}{error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'Đang xử lý...' : step === 3 ? 'Xác thực và hoàn tất' : 'Tiếp tục'}</button><button type="button" className="link" onClick={onLogin}>Đã có tài khoản? Đăng nhập</button></form></Panel>
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <main className="shell"><section className="panel"><p className="eyebrow">CATERING PLATFORM</p><h1>{title}</h1><p className="subtitle">{subtitle}</p>{children}</section></main> }

function App() { const [view, setView] = useState<'login' | 'register' | 'home'>(sessionStorage.getItem(AUTH_STORAGE_KEY) ? 'home' : 'login'); const [token, setToken] = useState(sessionStorage.getItem(AUTH_STORAGE_KEY) ?? ''); if (view === 'home') return <Panel title="Xin chào" subtitle="Bạn đã đăng nhập thành công"><p>Hệ thống sẵn sàng cho việc đặt tiệc.</p><button onClick={async () => { await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.logout}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }); sessionStorage.removeItem(AUTH_STORAGE_KEY); setToken(''); setView('login') }}>Đăng xuất</button></Panel>; if (view === 'register') return <Register onLogin={() => setView('login')} onLoggedIn={access => { setToken(access); setView('home') }} />; return <Login onRegister={() => setView('register')} onLoggedIn={access => { setToken(access); setView('home') }} /> }
export default App
