import { useCallback, useEffect, useState } from 'react'
import {
  Users, Search, X, Loader2, Shield, ShieldCheck, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CheckCircle2, AlertCircle, Mail, Github, KeyRound, Workflow as WorkflowIcon,
  Server,
} from 'lucide-react'
import { api, AdminContributorOut } from '../api/client'

const PAGE_SIZE = 20

type Filter = 'all' | 'admins' | 'users' | 'disabled'

function formatRelative(iso?: string | null) {
  if (!iso) return '—'
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function AdminContributors({
  showToast,
}: {
  showToast: (kind: 'ok' | 'err', msg: string) => void
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<AdminContributorOut[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async (p = page, query = q, f = filter) => {
    setLoading(true)
    try {
      const params: any = {
        q: query.trim() || undefined,
        skip: (p - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }
      if (f === 'admins') params.is_admin = true
      else if (f === 'users') params.is_admin = false
      else if (f === 'disabled') params.is_active = false

      const res = await api.listAdminContributors(params)
      setItems(res.contributors)
      setTotal(res.total)
    } catch {
      showToast('err', 'Không tải được danh sách contributors')
    } finally {
      setLoading(false)
    }
  }, [page, q, filter, showToast])

  // Reset + reload when filter changes
  useEffect(() => {
    setPage(1)
    reload(1, q, filter)
  }, [filter])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); reload(1, q, filter) }, 280)
    return () => clearTimeout(t)
  }, [q])

  const handleToggleAdmin = async (c: AdminContributorOut) => {
    const action = c.is_admin ? 'bỏ quyền admin' : 'cấp quyền admin'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} cho '${c.username}'?`)) return
    try {
      await api.toggleContributorAdmin(c.id)
      showToast('ok', `Đã ${action} cho ${c.username}`)
      reload(page, q, filter)
    } catch (err: any) {
      showToast('err', err?.response?.data?.detail || 'Thao tác thất bại')
    }
  }

  const handleDelete = async (c: AdminContributorOut) => {
    const confirmMsg = `XOÁ contributor '${c.username}'?\n\n` +
      `⚠️ Sẽ xoá toàn bộ:\n` +
      `  • ${c.workflow_count} workflow\n` +
      `  • ${c.node_count} L2S node\n` +
      `\nKhông thể hoàn tác. Gõ chính xác username để xác nhận:`
    const ans = prompt(confirmMsg)
    if (ans !== c.username) {
      if (ans !== null) showToast('err', 'Username không khớp — đã huỷ xoá')
      return
    }
    try {
      const res = await api.deleteContributor(c.id)
      showToast('ok', res.message || `Đã xoá ${c.username}`)
      reload(page, q, filter)
    } catch (err: any) {
      showToast('err', err?.response?.data?.detail || 'Xoá thất bại')
    }
  }

  const handlePage = (p: number) => { setPage(p); reload(p, q, filter) }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filterOptions: { value: Filter; label: string }[] = [
    { value: 'all',      label: 'Tất cả' },
    { value: 'admins',   label: 'Admin' },
    { value: 'users',    label: 'User thường' },
    { value: 'disabled', label: 'Bị vô hiệu' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-3xl font-bold text-white">Quản lý Contributors</h2>
        <p className="text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-base">
          Xem, cấp/bỏ quyền admin, xoá contributor (cascade workflow + node)
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo username hoặc email..."
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
      </div>

      <div className="scrollbar-thin -mx-1 px-1 overflow-x-auto pb-1 mb-4">
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 w-max sm:inline-flex">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                filter === opt.value ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(q || filter !== 'all') && !loading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
          Hiển thị {total} contributor{q && ` · "${q}"`}{filter !== 'all' && ` · ${filterOptions.find(f => f.value === filter)?.label}`}
          <button onClick={() => { setQ(''); setFilter('all') }} className="text-purple-400 hover:text-purple-300 underline text-xs">
            Xóa filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-12 text-center">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Không có contributor nào khớp filter</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
            {items.map((c, idx) => (
              <ContributorRow
                key={c.id}
                c={c}
                isLast={idx === items.length - 1}
                onToggleAdmin={() => handleToggleAdmin(c)}
                onDelete={() => handleDelete(c)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalItems={total}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              onPageChange={handlePage}
            />
          )}
        </>
      )}
    </div>
  )
}

function ContributorRow({
  c, isLast, onToggleAdmin, onDelete,
}: {
  c: AdminContributorOut
  isLast: boolean
  onToggleAdmin: () => void
  onDelete: () => void
}) {
  return (
    <div className={`p-4 ${!isLast ? 'border-b border-slate-700/50' : ''} hover:bg-slate-800/60 transition`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-semibold text-white truncate">{c.username}</span>
            {c.is_admin && (
              <span className="px-1.5 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] rounded font-medium flex items-center gap-1">
                <ShieldCheck size={10} />Admin
              </span>
            )}
            {!c.is_active && (
              <span className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] rounded font-medium">
                Disabled
              </span>
            )}
            {c.has_password && (
              <span className="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] rounded font-medium" title="Đã có password — api_key đã được rotate sau khi set">
                Has password
              </span>
            )}
            {!c.has_password && (
              <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] rounded font-medium" title="Chưa set password — api_key gốc từ /register vẫn dùng được">
                Key-only
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Mail size={11} /> {c.email}
            </span>
            {c.github_url && (
              <a href={c.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white">
                <Github size={11} /> GitHub
              </a>
            )}
            <span className="flex items-center gap-1" title="Số workflow đã submit">
              <WorkflowIcon size={11} /> {c.workflow_count}
            </span>
            <span className="flex items-center gap-1" title="Số L2S node đã register">
              <Server size={11} /> {c.node_count}
            </span>
            <span title={new Date(c.created_at).toLocaleString('vi-VN')}>
              Tạo {formatRelative(c.created_at)}
            </span>
          </div>

          {c.bio && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{c.bio}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleAdmin}
            className={`p-2 rounded-lg border transition flex items-center gap-1.5 text-xs ${
              c.is_admin
                ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
            }`}
            title={c.is_admin ? 'Bỏ quyền admin' : 'Cấp quyền admin'}
          >
            <Shield size={13} />
            <span className="hidden sm:inline">{c.is_admin ? 'Bỏ admin' : 'Cấp admin'}</span>
          </button>
          <button
            onClick={onDelete}
            disabled={c.is_admin}
            className="p-2 rounded-lg border bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
            title={c.is_admin ? 'Bỏ quyền admin trước khi xoá' : 'Xoá contributor (cascade)'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Pagination({
  page, totalItems, totalPages, pageSize, onPageChange,
}: {
  page: number
  totalItems: number
  totalPages: number
  pageSize: number
  onPageChange: (p: number) => void
}) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
      <span className="text-xs text-slate-400">
        {start}–{end} / {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-slate-300 px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
