import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, AlertCircle, Globe } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!key.trim()) return
    setError('')
    setLoading(true)
    try {
      await login(key.trim())
      navigate('/dashboard')
    } catch {
      setError('API Key không hợp lệ hoặc không có quyền truy cập')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-4 text-sm">
            <Globe size={14} />
            L2SC — L2S Communicate
          </Link>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center mb-3">
            <KeyRound size={24} className="text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Đăng nhập</h2>
          <p className="text-slate-400 mt-1.5 text-sm">
            Nhập API Key nhận được khi đăng ký contributor
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              API Key
            </label>
            <input
              type="password"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="l2sc_••••••••••••••••"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              API Key được cấp khi bạn đăng ký tại <span className="text-teal-400">/register</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
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
