import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { CalendarDays, Sparkles, X } from 'lucide-react'
import { useAuthStore } from './store/authStore'
import Landing from './pages/Landing'
import Browse from './pages/Browse'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import DocsList from './pages/DocsList'
import DocDetail from './pages/DocDetail'
import Forum from './pages/Forum'
import ForumDetail from './pages/ForumDetail'
import ForumNew from './pages/ForumNew'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const apiKey = useAuthStore((s) => s.apiKey)
  return apiKey ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { apiKey, contributor } = useAuthStore()
  if (!apiKey) return <Navigate to="/login" />
  if (contributor && !contributor.is_admin) return <Navigate to="/dashboard" />
  return <>{children}</>
}

function TrialAnnouncementModal() {
  const [open, setOpen] = useState(true)
  const { pathname } = useLocation()

  if (!open || pathname !== '/') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 bg-slate-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-teal-400/30 bg-slate-900 shadow-2xl shadow-teal-500/20">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Đóng thông báo"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="w-14 h-14 rounded-2xl border border-teal-400/30 bg-teal-500/10 flex items-center justify-center mb-5">
            <Sparkles size={26} className="text-teal-300" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 text-xs font-medium mb-4">
            <CalendarDays size={13} />
            Mở bản trải nghiệm từ 08/05/2026
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
            L2SC sắp mở bản trải nghiệm
          </h2>
          <p className="text-slate-300 leading-relaxed mb-5">
            Từ ngày <strong className="text-white">08/05/2026</strong>, người dùng có thể bắt đầu trải nghiệm
            L2SC để khám phá workflow cộng đồng, xem demo sản phẩm và chuẩn bị kết nối với hệ sinh thái L2S.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Đây là giai đoạn quảng bá và thu thập phản hồi sớm, phù hợp cho sinh viên, startup,
            freelancer và doanh nghiệp muốn thử workflow Data &amp; AI low-code.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-400 hover:to-cyan-400 transition"
            >
              Đăng ký trải nghiệm
            </Link>
            <Link
              to="/browse"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-semibold hover:bg-slate-700 transition"
            >
              Xem workflow mẫu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/docs" element={<DocsList />} />
        <Route path="/docs/:pluginType" element={<DocDetail />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/new" element={<PrivateRoute><ForumNew /></PrivateRoute>} />
        <Route path="/forum/:threadId" element={<ForumDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <TrialAnnouncementModal />
    </BrowserRouter>
  )
}
