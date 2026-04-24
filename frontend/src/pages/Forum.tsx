import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessagesSquare, Search, Plus, Loader2, AlertCircle, Pin, Lock,
  Eye, MessageCircle, Clock, User, HelpCircle, BookOpen, Sparkles,
  Megaphone, ShieldCheck, Flame, Inbox,
} from 'lucide-react'
import Header from '../components/Header'
import ViewToggle, { useViewMode } from '../components/ViewToggle'
import { api, ForumThreadSummary, ForumStats, ForumCategory } from '../api/client'
import { useAuthStore } from '../store/authStore'

type SortMode = 'recent' | 'popular' | 'unanswered'

// Static color classes — Tailwind không purge dynamic strings nên phải hardcode
const CATEGORY_LABEL: Record<ForumCategory, {
  name: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  iconCls: string    // bg + text + border cho icon box
}> = {
  qa:           { name: 'Hỏi & Đáp', Icon: HelpCircle, iconCls: 'bg-sky-500/15 border-sky-500/30 text-sky-300' },
  tutorial:     { name: 'Hướng dẫn', Icon: BookOpen,   iconCls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  showcase:     { name: 'Showcase',  Icon: Sparkles,   iconCls: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  announcement: { name: 'Thông báo', Icon: Megaphone,  iconCls: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
}

function formatRelative(iso: string) {
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  if (delta < 86400 * 7) return `${Math.floor(delta / 86400)} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function Forum() {
  const navigate = useNavigate()
  const { apiKey } = useAuthStore()
  const [threads, setThreads] = useState<ForumThreadSummary[] | null>(null)
  const [stats, setStats] = useState<ForumStats | null>(null)
  const [category, setCategory] = useState<ForumCategory | ''>('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useViewMode('forum', 'list')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [list, s] = await Promise.all([
        api.listThreads({ category: category || undefined, q: query.trim() || undefined, sort }),
        api.forumStats(),
      ])
      setThreads(list)
      setStats(s)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không tải được forum')
      setThreads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort])

  useEffect(() => {
    const t = setTimeout(load, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const goNew = () => {
    if (!apiKey) {
      navigate('/login')
      return
    }
    navigate('/forum/new')
  }

  const filteredCount = threads?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero + CTA */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-sm mb-2">
              <MessagesSquare size={16} />
              <span>Diễn đàn cộng đồng</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">
              Forum L2S
            </h1>
            <p className="text-slate-400 max-w-2xl">
              Hỏi-đáp, chia sẻ workflow thực tế, bài học kinh nghiệm từ cộng đồng người dùng L2S.
            </p>
          </div>
          <button
            onClick={goNew}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg font-semibold transition shadow-lg shadow-teal-500/20"
          >
            <Plus size={18} />
            Đặt câu hỏi / Chia sẻ
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(['qa', 'tutorial', 'showcase', 'announcement'] as ForumCategory[]).map((c) => {
              const meta = CATEGORY_LABEL[c]
              const count = stats.by_category[c] || 0
              const active = category === c
              return (
                <button
                  key={c}
                  onClick={() => setCategory(active ? '' : c)}
                  className={`p-3 rounded-lg border text-left transition ${
                    active
                      ? 'bg-slate-700 border-teal-500'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-2 ${meta.iconCls}`}>
                    <meta.Icon size={15} />
                  </div>
                  <div className="text-xs text-slate-400">{meta.name}</div>
                  <div className="text-lg font-bold text-white">{count}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* Search + Sort + ViewToggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung…"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-800 border border-slate-700 rounded-lg">
            {([
              { v: 'recent', label: 'Mới nhất', Icon: Clock },
              { v: 'popular', label: 'Hot', Icon: Flame },
              { v: 'unanswered', label: 'Chưa trả lời', Icon: Inbox },
            ] as { v: SortMode; label: string; Icon: any }[]).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => setSort(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                  sort === v
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {category && (
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-slate-400">
              Đang lọc: <strong className="text-white">{CATEGORY_LABEL[category].name}</strong>
            </span>
            <button onClick={() => setCategory('')} className="text-teal-400 hover:text-teal-300 underline text-xs">
              Xoá filter
            </button>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Đang tải…
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 mb-4">
            <AlertCircle size={18} className="mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredCount === 0 && (
          <EmptyState query={query} onNew={goNew} />
        )}

        {/* List OR Grid */}
        {!loading && !error && threads && threads.length > 0 && (
          viewMode === 'list' ? (
            <div className="bg-slate-800/30 border border-slate-800 rounded-lg divide-y divide-slate-800">
              {threads.map((t) => <ThreadRow key={t.id} t={t} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {threads.map((t) => <ThreadCard key={t.id} t={t} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ---------- Components ----------

function ThreadRow({ t }: { t: ForumThreadSummary }) {
  const meta = CATEGORY_LABEL[t.category]
  const CatIcon = meta.Icon
  return (
    <Link
      to={`/forum/${t.id}`}
      className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition"
    >
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${meta.iconCls}`}>
        <CatIcon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {t.is_pinned && (
            <Pin size={12} className="text-amber-400" aria-label="Ghim" />
          )}
          {t.is_locked && (
            <Lock size={12} className="text-slate-500" aria-label="Khoá" />
          )}
          <h3 className="font-semibold text-white text-sm group-hover:text-teal-300 transition truncate">
            {t.title}
          </h3>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <User size={11} />
            {t.author.username}
            {t.author.is_admin && <ShieldCheck size={10} className="text-purple-400" />}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={11} />
            {t.reply_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={11} />
            {t.view_count}
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <Clock size={11} />
            {formatRelative(t.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function ThreadCard({ t }: { t: ForumThreadSummary }) {
  const meta = CATEGORY_LABEL[t.category]
  const CatIcon = meta.Icon
  return (
    <Link
      to={`/forum/${t.id}`}
      className="group block p-4 bg-slate-800/60 border border-slate-700 hover:border-teal-500/50 rounded-lg transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${meta.iconCls}`}>
          <CatIcon size={13} />
        </div>
        <span className="text-xs text-slate-400">{meta.name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {t.is_pinned && <Pin size={12} className="text-amber-400" />}
          {t.is_locked && <Lock size={12} className="text-slate-500" />}
        </div>
      </div>
      <h3 className="font-semibold text-white text-sm mb-2 group-hover:text-teal-300 transition line-clamp-2 min-h-[2.5rem]">
        {t.title}
      </h3>
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
        <span className="inline-flex items-center gap-1 truncate">
          <User size={11} />
          <span className="truncate">{t.author.username}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle size={10} />{t.reply_count}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Eye size={10} />{t.view_count}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{formatRelative(t.updated_at)}</p>
    </Link>
  )
}

function EmptyState({ query, onNew }: { query: string; onNew: () => void }) {
  return (
    <div className="text-center py-16 px-6 bg-slate-800/30 border border-slate-800 rounded-lg">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
        <MessagesSquare size={28} className="text-slate-500" />
      </div>
      {query ? (
        <>
          <p className="text-slate-300 mb-1">Không tìm thấy bài nào khớp "{query}"</p>
          <p className="text-slate-500 text-sm">Thử từ khóa khác hoặc tạo bài mới.</p>
        </>
      ) : (
        <>
          <p className="text-slate-300 mb-1">Chưa có bài viết nào ở đây</p>
          <p className="text-slate-500 text-sm mb-4">Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ kiến thức.</p>
        </>
      )}
      <button
        onClick={onNew}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg text-sm font-medium transition"
      >
        <Plus size={14} />
        Đăng bài mới
      </button>
    </div>
  )
}
