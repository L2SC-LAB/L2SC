import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle, Globe, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

type Mode = 'password' | 'apikey'

export default function Login() {
  const navigate = useNavigate()
  const { login, loginWithPassword } = useAuthStore()
  const [mode, setMode] = useState<Mode>('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'password') {
        if (!identifier.trim() || !password) {
          setError('Nhập email/username và mật khẩu')
          setLoading(false)
          return
        }
        await loginWithPassword(identifier.trim(), password)
      } else {
        if (!apiKey.trim()) {
          setError('Nhập API Key')
          setLoading(false)
          return
        }
        await login(apiKey.trim())
      }
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(
        detail ||
          (mode === 'password'
            ? 'Email/username hoặc mật khẩu không đúng'
            : 'API Key không hợp lệ hoặc không có quyền truy cập')
      )
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-4 text-sm">
            <Globe size={14} />
            L2SC — L2S Communicate
          </Link>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center mb-3">
            {mode === 'password' ? (
              <Lock size={24} className="text-teal-400" />
            ) : (
              <KeyRound size={24} className="text-teal-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white">Đăng nhập</h2>
        </div>

        <div className="flex gap-1 p-1 mb-5 bg-slate-900 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => switchMode('password')}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
              mode === 'password'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email & Mật khẩu
          </button>
          <button
            type="button"
            onClick={() => switchMode('apikey')}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
              mode === 'apikey'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            API Key
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'password' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email hoặc Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@l2sc.local"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                API Key
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="l2sc_••••••••••••••••"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Dùng khi tài khoản chưa set mật khẩu (admin cũ, L2S node auto-auth).
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : mode === 'password' ? (
              <Lock size={16} />
            ) : (
              <KeyRound size={16} />
            )}
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-teal-400 hover:text-teal-300">
            Đăng ký làm contributor
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
            Browse workflows không cần đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
