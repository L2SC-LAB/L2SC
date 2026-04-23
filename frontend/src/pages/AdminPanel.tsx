import { useEffect, useMemo, useCallback, useState } from 'react'
import {
  ShieldCheck, CheckCircle2, XCircle, Trash2, RefreshCw,
  Loader2, AlertCircle, Users, Server, Workflow as WorkflowIcon,
  Play, Clock, Search, X, Star, SlidersHorizontal,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RotateCcw, BarChart2,
} from 'lucide-react'
import { api, WorkflowOut, AdminStats } from '../api/client'
import Header from '../components/Header'

type TabStatus = 'pending' | 'approved' | 'rejected' | 'all'
const CATEGORIES = ['ETL', 'ML', 'Analytics', 'Notification', 'Visualization', 'Integration', 'Other']
const PAGE_SIZE = 20

function formatRelative(iso?: string | null) {
  if (!iso) return '—'
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [tab, setTab] = useState<TabStatus>('pending')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<WorkflowOut[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const reloadStats = useCallback(() => {
    api.getAdminStats().then(setStats).catch(() => {})
  }, [])

  const reload = useCallback(
    async (p = page, query = q, cat = category, status = tab) => {
      setLoading(true)
      try {
        const params = {
          status,
          q: query.trim() || undefined,
          category: cat || undefined,
          skip: (p - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        }
        const [data, cnt] = await Promise.all([
          api.getAdminWorkflows(params),
          api.getAdminWorkflowCount({ status, q: query.trim() || undefined, category: cat || undefined }),
        ])
        setItems(data)
        setTotal(cnt.total)
      } catch {
        showToast('err', 'Không tải được danh sách')
      } finally {
        setLoading(false)
      }
    },
    [page, q, category, tab]
  )

  useEffect(() => { reloadStats() }, [])

  // Reset + reload when tab changes
  useEffect(() => {
    setPage(1); setQ(''); setCategory('')
    reload(1, '', '', tab)
  }, [tab])

  // Debounce search/category
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); reload(1, q, category, tab) }, 280)
    return () => clearTimeout(t)
  }, [q, category])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg })
    if (kind === 'ok') reloadStats()
  }

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'revoke') => {
    try {
      await api.actionWorkflow(id, action)
      const msg = { approve: 'Đã duyệt workflow', reject: 'Đã từ chối workflow', revoke: 'Đã thu hồi duyệt' }[action]
      showToast('ok', msg)
      reload(page, q, category, tab)
    } catch (err: any) {
      showToast('err', err?.response?.data?.detail || 'Lỗi thao tác')
    }
  }

  const handleDelete = async (wf: WorkflowOut) => {
    if (!confirm(`Xoá "${wf.title}"?`)) return
    try { await api.deleteWorkflowAdmin(wf.id); showToast('ok', 'Đã xoá'); reload(page, q, category, tab) }
    catch { showToast('err', 'Xoá thất bại') }
  }

  const handlePage = (p: number) => { setPage(p); reload(p, q, category, tab) }

  const clearFilters = () => { setQ(''); setCategory('') }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // Tab options — clicking tab also acts as filter
  const tabOptions = [
    { value: 'all' as TabStatus,      label: 'Tất cả',    short: 'Tất cả',   count: stats?.total_workflows     ?? 0 },
    { value: 'pending' as TabStatus,  label: 'Chờ duyệt', short: 'Chờ',      count: stats?.pending_workflows   ?? 0 },
    { value: 'approved' as TabStatus, label: 'Đã duyệt',  short: 'Duyệt',    count: stats?.approved_workflows  ?? 0 },
    { value: 'rejected' as TabStatus, label: 'Từ chối',   short: 'Từ chối',  count: stats?.rejected_workflows  ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb + refresh */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck size={16} className="text-purple-400 shrink-0" />
              <span className="text-sm font-medium text-slate-200 truncate">Admin Panel</span>
            </div>
            <button
              onClick={() => reload(page, q, category, tab)}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Page header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-3xl font-bold text-white">Quản lý Workflows</h2>
            <p className="text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-base">
              Duyệt, từ chối và quản lý workflows trong hệ thống L2SC
            </p>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3 mb-4 sm:mb-6">
              <StatCard label="Tổng WF"      fullLabel="Tổng workflow"    value={stats.total_workflows}    icon={<WorkflowIcon size={16} className="text-blue-400" />}    onClick={() => setTab('all')}      active={tab === 'all'} />
              <StatCard label="Chờ duyệt"    fullLabel="Chờ duyệt"        value={stats.pending_workflows}  icon={<Clock size={16} className="text-amber-400" />}           onClick={() => setTab('pending')}  active={tab === 'pending'}  pulse={stats.pending_workflows > 0} />
              <StatCard label="Đã duyệt"     fullLabel="Đã duyệt"         value={stats.approved_workflows} icon={<CheckCircle2 size={16} className="text-emerald-400" />}  onClick={() => setTab('approved')} active={tab === 'approved'} />
              <StatCard label="Từ chối"      fullLabel="Từ chối"          value={stats.rejected_workflows ?? 0} icon={<XCircle size={16} className="text-red-400" />}   onClick={() => setTab('rejected')} active={tab === 'rejected'} />
              <StatCard label="Contributors" fullLabel="Contributors"     value={stats.total_contributors} icon={<Users size={16} className="text-cyan-400" />} />
              <StatCard label="Nodes"        fullLabel="L2S Nodes"        value={stats.total_nodes}        icon={<Server size={16} className="text-blue-400" />} />
              <StatCard label="Lượt chạy"    fullLabel="Tổng lượt chạy"   value={stats.total_runs}         icon={<Play size={16} className="text-violet-400" />} />
            </div>
          )}

          {/* Toolbar: search + mobile filter toggle */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm workflow..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
              {q && (
                <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileFilters((v) => !v)}
              className={`sm:hidden p-2 border rounded-lg shrink-0 transition ${
                showMobileFilters || category ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* Status + category filter chips */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block scrollbar-thin -mx-1 px-1 overflow-x-auto pb-1 mb-4`}>
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 w-max sm:w-auto sm:inline-flex flex-wrap sm:flex-nowrap">
              {/* Status tabs */}
              {tabOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTab(opt.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    tab === opt.value ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span className="sm:hidden">{opt.short}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                  <span className="opacity-70">{opt.count}</span>
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-4 bg-slate-600 mx-0.5 hidden sm:block" />

              {/* Category filter */}
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? '' : c)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    category === c ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter indicator */}
          {(q || category) && !loading && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-slate-400">
                Hiển thị {total} / {stats?.total_workflows ?? '?'} workflow
                {q && ` · "${q}"`}{category && ` · ${category}`}
              </span>
              <button onClick={clearFilters} className="text-purple-400 hover:text-purple-300 underline text-xs">
                Xóa filter
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <EmptyState tab={tab} hasFilter={!!(q || category)} onClear={clearFilters} />
          ) : (
            <>
              <div className="bg-slate-800/40 border border-slate-700 rounded-lg">
                {items.map((wf, idx) => (
                  <WorkflowRow
                    key={wf.id}
                    wf={wf}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    onAction={handleAction}
                    onDelete={() => handleDelete(wf)}
                    onToast={showToast}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <PaginationControls
                  page={page}
                  totalItems={total}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePage}
                />
              )}

              {totalPages === 1 && total >= PAGE_SIZE && (
                <div className="mt-3 text-xs text-slate-500 text-right">
                  {total} workflow
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm ${
            toast.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}>
            {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WorkflowRow ────────────────────────────────────────────────────────────

function WorkflowRow({
  wf, isFirst, isLast, onAction, onDelete, onToast,
}: {
  wf: WorkflowOut
  isFirst: boolean
  isLast: boolean
  onAction: (id: string, action: 'approve' | 'reject' | 'revoke') => void
  onDelete: () => void
  onToast: (k: 'ok' | 'err', m: string) => void
}) {
  const [starring, setStarring] = useState(false)
  const [starCount, setStarCount] = useState(wf.star_count ?? 0)

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (starring) return
    setStarring(true)
    try {
      const res = await api.starWorkflow(wf.id)
      setStarCount(res.star_count)
      onToast('ok', `Đã gắn sao (${res.star_count} ⭐)`)
    } catch {
      onToast('err', 'Không thể gắn sao')
    } finally {
      setStarring(false)
    }
  }

  const statusBadge = wf.is_approved ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] rounded border border-emerald-500/30 whitespace-nowrap">
      <CheckCircle2 size={9} />Đã duyệt
    </span>
  ) : wf.is_rejected ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-300 text-[10px] rounded border border-red-500/30 whitespace-nowrap">
      <XCircle size={9} />Từ chối
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] rounded border border-amber-500/30 whitespace-nowrap">
      <Clock size={9} />Chờ duyệt
    </span>
  )

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/30 transition group relative ${
        !isLast ? 'border-b border-slate-700/50' : ''
      } ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''}`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
        <WorkflowIcon size={16} className="text-blue-400" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        {/* Title + badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{wf.title}</span>
          <span className="text-[10px] text-slate-500">v{wf.version}</span>
          {statusBadge}
          {wf.category && (
            <span className="px-1.5 py-0.5 bg-sky-500/10 text-sky-300 text-[10px] rounded border border-sky-500/30 whitespace-nowrap">
              {wf.category}
            </span>
          )}
        </div>

        {/* Description + contributor — desktop */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
          <span className="truncate">{wf.description || 'Chưa có mô tả'}</span>
          <span className="text-slate-600 shrink-0">·</span>
          <span className="shrink-0">by <span className="text-slate-300">{wf.contributor_username}</span></span>
        </div>

        {/* Mobile: contributor + time */}
        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
          <span className="text-[10px] text-slate-500">{wf.contributor_username}</span>
          <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
            <Clock size={9} />{formatRelative(wf.created_at)}
          </span>
        </div>
      </div>

      {/* Call count — desktop */}
      <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 shrink-0 w-16 justify-end tabular-nums">
        <Play size={11} />{wf.call_count}
      </div>

      {/* Star count */}
      <button
        onClick={handleStar}
        disabled={starring}
        title="Gắn sao uy tín"
        className={`hidden sm:flex items-center gap-1 text-xs shrink-0 w-12 justify-end tabular-nums transition ${
          starCount >= 10
            ? 'text-amber-400 hover:text-amber-300'
            : starCount >= 5
            ? 'text-amber-500/70 hover:text-amber-400'
            : 'text-slate-500 hover:text-amber-400'
        } ${starring ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        <Star size={11} fill={starCount > 0 ? 'currentColor' : 'none'} />
        <span>{starCount}</span>
        {starCount >= 10 && <span className="text-[9px]">🔥</span>}
      </button>

      {/* Time — desktop */}
      <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 shrink-0 w-24 justify-end">
        <Clock size={11} />{formatRelative(wf.created_at)}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {!wf.is_approved && !wf.is_rejected && (
          <>
            <button
              onClick={() => onAction(wf.id, 'approve')}
              className="flex items-center gap-1 px-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs transition"
            >
              <CheckCircle2 size={12} />
              <span className="hidden sm:inline">Duyệt</span>
            </button>
            <button
              onClick={() => onAction(wf.id, 'reject')}
              className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs transition"
            >
              <XCircle size={12} />
              <span className="hidden sm:inline">Từ chối</span>
            </button>
          </>
        )}
        {wf.is_approved && (
          <button
            onClick={() => onAction(wf.id, 'revoke')}
            className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Thu hồi</span>
          </button>
        )}
        {wf.is_rejected && (
          <button
            onClick={() => onAction(wf.id, 'approve')}
            className="flex items-center gap-1 px-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs transition"
          >
            <CheckCircle2 size={12} />
            <span className="hidden sm:inline">Duyệt lại</span>
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  label, fullLabel, value, icon, onClick, active, pulse,
}: {
  label: string
  fullLabel?: string
  value: number
  icon: React.ReactNode
  onClick?: () => void
  active?: boolean
  pulse?: boolean
}) {
  const content = (
    <>
      <div className="relative shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
          {icon}
        </div>
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        )}
      </div>
      <div className="min-w-0 text-left">
        <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wide truncate">
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline">{fullLabel || label}</span>
        </div>
        <div className="text-base sm:text-lg font-semibold text-white leading-tight mt-0.5">{value}</div>
      </div>
    </>
  )

  const base = 'p-2.5 sm:p-3 border rounded-lg flex items-center gap-2 sm:gap-3 transition'
  const stateClass = active
    ? 'bg-slate-700/70 border-purple-500/50 ring-1 ring-purple-500/30'
    : 'bg-slate-800/60 border-slate-700'

  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} ${stateClass} hover:bg-slate-700/60 cursor-pointer w-full`}>
        {content}
      </button>
    )
  }
  return <div className={`${base} ${stateClass}`}>{content}</div>
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState({ tab, hasFilter, onClear }: { tab: TabStatus; hasFilter: boolean; onClear: () => void }) {
  if (hasFilter) return (
    <div className="text-center py-16 px-6 bg-slate-800/30 border border-slate-700 rounded-xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
        <Search size={32} className="text-slate-600" />
      </div>
      <p className="text-slate-300 mb-1">Không tìm thấy workflow</p>
      <p className="text-sm text-slate-500 mb-4">Thử từ khóa khác hoặc bỏ filter</p>
      <button onClick={onClear} className="text-purple-400 hover:text-purple-300 text-sm underline">Xóa filter</button>
    </div>
  )
  const msgMap: Record<TabStatus, string> = {
    pending: 'Không có workflow nào chờ duyệt',
    approved: 'Chưa có workflow nào được duyệt',
    rejected: 'Không có workflow nào bị từ chối',
    all: 'Chưa có workflow nào trong hệ thống',
  }
  const iconMap: Record<TabStatus, React.ReactNode> = {
    pending:  <CheckCircle2 size={36} className="text-emerald-500/60" />,
    approved: <CheckCircle2 size={36} className="text-emerald-500/60" />,
    rejected: <XCircle size={36} className="text-slate-600" />,
    all:      <BarChart2 size={36} className="text-slate-600" />,
  }
  return (
    <div className="text-center py-20 px-6 bg-slate-800/30 border border-slate-700 rounded-xl">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
        {iconMap[tab]}
      </div>
      <p className="text-slate-300 font-medium">{msgMap[tab]}</p>
    </div>
  )
}

// ─── LoadingSkeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`h-14 bg-slate-800/20 animate-pulse ${i < 7 ? 'border-b border-slate-700/50' : ''}`} />
      ))}
    </div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function PaginationControls({
  page, totalItems, totalPages, pageSize, onPageChange,
}: {
  page: number; totalItems: number; totalPages: number; pageSize: number; onPageChange: (p: number) => void
}) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pageNumbers = useMemo(() => {
    const delta = 1
    const nums: (number | '...')[] = []
    const range: number[] = []
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i)
    nums.push(1)
    if (range[0] > 2) nums.push('...')
    nums.push(...range)
    if (range[range.length - 1] < totalPages - 1) nums.push('...')
    if (totalPages > 1) nums.push(totalPages)
    return nums
  }, [page, totalPages])

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-slate-400">
        <span className="text-white">{start}–{end}</span> / {totalItems} workflow
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page <= 1}
          className="p-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronsLeft size={14} />
        </button>
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronLeft size={14} />
        </button>
        <div className="flex items-center gap-0.5 mx-1">
          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-slate-500 text-xs">…</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] px-2 py-1 rounded text-xs font-medium transition ${
                  p === page ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}>
                {p}
              </button>
            )
          )}
        </div>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronRight size={14} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}
          className="p-1.5 rounded border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
