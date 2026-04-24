import { useNavigate, Link } from 'react-router-dom'
import { Globe, LayoutDashboard, LogOut, LogIn, UserPlus, ShieldCheck, BookOpen, MessagesSquare } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Header() {
  const navigate = useNavigate()
  const { apiKey, contributor, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none">L2SC</span>
            <span className="block text-xs text-slate-400 leading-none mt-0.5">L2S Communicate</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link
            to="/browse"
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            Browse
          </Link>
          <Link
            to="/docs"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <BookOpen size={14} />
            Docs
          </Link>
          <Link
            to="/forum"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <MessagesSquare size={14} />
            Forum
          </Link>

          {apiKey ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              {contributor?.is_admin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-lg transition"
                >
                  <ShieldCheck size={14} />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 border border-slate-700 rounded-lg">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center text-teal-300 text-xs font-bold">
                  {contributor?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-slate-300 max-w-[120px] truncate">{contributor?.username || '...'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut size={14} />
                Thoát
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <UserPlus size={14} />
                Đăng ký
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition font-medium shadow-sm shadow-teal-500/20"
              >
                <LogIn size={14} />
                Đăng nhập
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
