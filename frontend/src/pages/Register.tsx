import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Copy, Check, AlertCircle, Globe } from 'lucide-react'
import { api } from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    github_url: '',
    bio: '',
    // Honeypot: humans không thấy field này; bot auto-fill → backend reject
    website: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ api_key: string; username: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    try {
      const res = await api.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        github_url: form.github_url.trim() || undefined,
        bio: form.bio.trim() || undefined,
        website: form.website,   // honeypot — always empty cho human
      })
      setResult({ api_key: res.api_key, username: res.username })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center mb-3">
              <UserPlus size={24} className="text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Đăng ký thành công!</h2>
            <p className="text-slate-400 mt-1 text-sm">Chào mừng, <span className="text-white font-medium">{result.username}</span></p>
          </div>

          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-200 text-sm font-medium mb-1">Lưu API Key ngay bây giờ!</p>
            <p className="text-amber-300/80 text-xs">Key này chỉ hiển thị một lần. Bạn sẽ cần nó để đăng nhập và gọi API.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">API Key của bạn</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-teal-300 text-sm font-mono break-all">
                {result.api_key}
              </code>
              <button
                onClick={copy}
                className="flex-shrink-0 p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition"
                title="Copy"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition font-medium text-sm"
            >
              Đăng nhập ngay
            </Link>
            <Link
              to="/"
              className="flex-1 text-center px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
            >
              Browse workflows
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-4 text-sm">
            <Globe size={14} />
            L2SC — L2S Communicate
          </Link>
          <h2 className="text-2xl font-bold text-white">Đăng ký Contributor</h2>
          <p className="text-slate-400 mt-1.5 text-sm">
            Chia sẻ workflow của bạn với cộng đồng L2S
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-red-300 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/*
            Honeypot field — humans không thấy (ẩn off-screen + tabindex=-1 +
            aria-hidden). Bots auto-fill form sẽ điền vào → backend reject 400.
            KHÔNG dùng `display:none` vì một số bot biết bỏ qua các field display:none.
          */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label>Website (để trống)</label>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={update('website')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.username}
              onChange={update('username')}
              placeholder="your_username"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Mật khẩu <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              placeholder="Ít nhất 6 ký tự"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Xác nhận mật khẩu <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.confirm}
              onChange={update('confirm')}
              placeholder="Nhập lại mật khẩu"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              GitHub URL <span className="text-slate-500 text-xs">(tuỳ chọn)</span>
            </label>
            <input
              type="url"
              value={form.github_url}
              onChange={update('github_url')}
              placeholder="https://github.com/username"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Bio <span className="text-slate-500 text-xs">(tuỳ chọn)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={update('bio')}
              rows={3}
              placeholder="Giới thiệu ngắn về bạn..."
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>

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
            ) : (
              <UserPlus size={16} />
            )}
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-teal-400 hover:text-teal-300">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
