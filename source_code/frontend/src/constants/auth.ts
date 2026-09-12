export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export const AUTH_ENDPOINTS = {
  login: '/auth/user/login',
  startRegistration: '/auth/user/register/start',
  registrationDetails: '/auth/user/register/details',
  verifyRegistration: '/auth/user/register/verify',
  logout: '/auth/logout',
} as const

export const PASSWORD_RULES = [
  { label: 'Ít nhất 8 ký tự', test: (value: string) => value.length >= 8 },
  { label: 'Có chữ in hoa', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Có chữ thường', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Có chữ số', test: (value: string) => /\d/.test(value) },
  { label: 'Có ký tự đặc biệt (!@#%-_)', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const

export const AUTH_STORAGE_KEY = 'accessToken'
