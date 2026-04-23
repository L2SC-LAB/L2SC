import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Server, Workflow, Plus, Trash2, X, Loader2, AlertCircle,
  CheckCircle2, Clock, Zap, Hash, RefreshCw, ExternalLink,
  User, Shield, Tag, Star,
} from 'lucide-react'
import { api, NodeOut, WorkflowOut } from '../api/client'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'

type Tab = 'workflows' | 'nodes'

const CATEGORIES = ['', 'data', 'ml', 'etl', 'nlp', 'vision', 'automation', 'other']

function formatRelative(iso?: string | null) {
  if (!iso) return '—'
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { contributor, refreshMe } = useAuthStore()
  const [tab, setTab] = useState<Tab>('workflows')
  const [wfCount, setWfCount] = useState<{ total: number; pending: number; approved: number }>({ total: 0, pending: 0, approved: 0 })
  const [nodeCount, setNodeCount] = useState(0)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    refreshMe()
    api.listMyWorkflows().then((wfs) => {
      setWfCount({
        total: wfs.length,
        pending: wfs.filter((w) => !w.is_approved && !w.is_rejected).length,
        approved: wfs.filter((w) => w.is_approved).length,
      })
    }).catch(() => {})
    api.listNodes().then((ns) => setNodeCount(ns.length)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (kind: 'ok' | 'err', msg: string) => setToast({ kind, msg })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Page header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <User size={12} />
                <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-base shrink-0">
                  {contributor?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {contributor?.username || '...'}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm">{contributor?.email}</p>
                </div>
                {contributor?.is_admin && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-300 text-xs rounded border border-purple-500/30">
                    <Shield size={10} />
                    Admin
                  </span>
                )}
              </div>
            </div>
            {contributor?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-lg text-sm transition"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <StatCard
              label="Tổng WF"
              fullLabel="Tổng workflow"
              value={wfCount.total}
              icon={<Workflow size={15} className="text-teal-400" />}
              onClick={() => setTab('workflows')}
              active={tab === 'workflows'}
            />
            <StatCard
              label="Chờ duyệt"
              fullLabel="Chờ duyệt"
              value={wfCount.pending}
              icon={<Clock size={15} className="text-amber-400" />}
              pulse={wfCount.pending > 0}
            />
            <StatCard
              label="Đã duyệt"
              fullLabel="Đã được duyệt"
              value={wfCount.approved}
              icon={<CheckCircle2 size={15} className="text-emerald-400" />}
            />
            <StatCard
              label="L2S Nodes"
              fullLabel="L2S Nodes"
              value={nodeCount}
              icon={<Server size={15} className="text-sky-400" />}
              onClick={() => setTab('nodes')}
              active={tab === 'nodes'}
            />
          </div>

          {/* Tab chips */}
          <div className="scrollbar-thin -mx-1 px-1 overflow-x-auto pb-1 mb-4">
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 w-max">
              <button
                onClick={() => setTab('workflows')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition whitespace-nowrap ${
                  tab === 'workflows' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Workflow size={13} />
                Workflows của tôi
                <span className={`text-[10px] opacity-70`}>{wfCount.total}</span>
              </button>
              <button
                onClick={() => setTab('nodes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition whitespace-nowrap ${
                  tab === 'nodes' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Server size={13} />
                L2S Nodes
                <span className={`text-[10px] opacity-70`}>{nodeCount}</span>
              </button>
            </div>
          </div>

          {tab === 'workflows' && <WorkflowsTab onToast={showToast} onCountChange={setWfCount} />}
          {tab === 'nodes' && <NodesTab onToast={showToast} onCountChange={setNodeCount} />}

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm">
          <div className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm ${
            toast.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}>
            {toast.kind === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- StatCard ----------

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
    ? 'bg-slate-700/70 border-teal-500/50 ring-1 ring-teal-500/30'
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

// ============================================================
// WORKFLOWS TAB
// ============================================================

function WorkflowsTab({
  onToast,
  onCountChange,
}: {
  onToast: (k: 'ok' | 'err', m: string) => void
  onCountChange: (c: { total: number; pending: number; approved: number }) => void
}) {
  const [items, setItems] = useState<WorkflowOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkflowOut | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const wfs = await api.listMyWorkflows()
      setItems(wfs)
      onCountChange({
        total: wfs.length,
        pending: wfs.filter((w) => !w.is_approved && !w.is_rejected).length,
        approved: wfs.filter((w) => w.is_approved).length,
      })
    } catch { onToast('err', 'Không tải được danh sách') }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const del = async (id: string, title: string) => {
    if (!confirm(`Xoá workflow "${title}"?`)) return
    try {
      await api.deleteMyWorkflow(id)
      onToast('ok', 'Đã xoá workflow')
      reload()
    } catch (err: any) { onToast('err', err?.response?.data?.detail || 'Xoá thất bại') }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{items.length} workflow</span>
        <div className="flex gap-2">
          <button
            onClick={reload}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-teal-500/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Submit workflow</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-16 bg-slate-800/20 animate-pulse ${i < 3 ? 'border-b border-slate-700/50' : ''}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
            <Workflow size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-300 mb-1">Bạn chưa submit workflow nào</p>
          <button
            onClick={() => setShowSubmit(true)}
            className="mt-3 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-sm border border-teal-500/30 transition"
          >
            Submit workflow đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg">
          {items.map((wf, idx) => (
            <WorkflowRow
              key={wf.id}
              wf={wf}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onEdit={() => setEditTarget(wf)}
              onDelete={() => del(wf.id, wf.title)}
            />
          ))}
        </div>
      )}

      {(showSubmit || editTarget) && (
        <WorkflowFormDialog
          initial={editTarget}
          onClose={() => { setShowSubmit(false); setEditTarget(null) }}
          onDone={() => {
            setShowSubmit(false)
            setEditTarget(null)
            reload()
            onToast('ok', editTarget ? 'Đã cập nhật' : 'Đã submit — chờ admin duyệt')
          }}
          onError={(m) => onToast('err', m)}
        />
      )}
    </>
  )
}

function WorkflowRow({
  wf, isFirst, isLast, onEdit, onDelete,
}: {
  wf: WorkflowOut
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/30 transition group ${
      !isLast ? 'border-b border-slate-700/50' : ''
    } ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''}`}>

      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
        <Workflow size={15} className="text-teal-400" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{wf.title}</span>
          {wf.is_approved ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] rounded border border-emerald-500/30 whitespace-nowrap">
              <CheckCircle2 size={9} /> Đã duyệt
            </span>
          ) : wf.is_rejected ? (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/10 text-red-300 text-[10px] rounded border border-red-500/30 whitespace-nowrap">
              Từ chối
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] rounded border border-amber-500/30 whitespace-nowrap">
              <Clock size={9} /> Chờ duyệt
            </span>
          )}
          {wf.has_live_node && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-500/10 text-teal-300 text-[10px] rounded border border-teal-500/30 whitespace-nowrap">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-400" />
              </span>
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
          {wf.category && (
            <span className="flex items-center gap-0.5">
              <Tag size={9} />{wf.category.toUpperCase()}
            </span>
          )}
          <span>v{wf.version}</span>
          <span className="flex items-center gap-0.5"><Zap size={9} />{wf.call_count}</span>
          {(wf.star_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-amber-400/70">
              <Star size={9} />{wf.star_count}
            </span>
          )}
          <span className="hidden sm:inline">{formatRelative(wf.updated_at)}</span>
        </div>
      </div>

      {/* Updated at — desktop */}
      <div className="hidden lg:block text-xs text-slate-500 shrink-0 w-24 text-right">
        {formatRelative(wf.updated_at)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
        <button
          onClick={onEdit}
          className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition"
        >
          Sửa
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function WorkflowFormDialog({
  initial,
  onClose,
  onDone,
  onError,
}: {
  initial: WorkflowOut | null
  onClose: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [nodes, setNodes] = useState<NodeOut[]>([])
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || '',
    tags: initial?.tags.join(', ') || '',
    workflow_def: '{"nodes":[],"edges":[]}',
    node_id: '',
    l2s_workflow_id: '',
    version: initial?.version || '1.0.0',
  })
  const [submitting, setSubmitting] = useState(false)
  const [defErr, setDefErr] = useState('')

  useEffect(() => {
    api.listNodes().then(setNodes).catch(() => {})
  }, [])

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    try { JSON.parse(form.workflow_def) } catch (e: any) { setDefErr(e.message); return }
    setDefErr('')
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category || undefined,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        workflow_def: JSON.parse(form.workflow_def),
        node_id: form.node_id || undefined,
        l2s_workflow_id: form.l2s_workflow_id.trim() || undefined,
        version: form.version.trim() || '1.0.0',
      }
      if (initial) { await api.updateWorkflow(initial.id, payload) }
      else { await api.submitWorkflow(payload) }
      onDone()
    } catch (err: any) { onError(err?.response?.data?.detail || 'Lỗi khi lưu') }
    finally { setSubmitting(false) }
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-white">
            {initial ? 'Cập nhật workflow' : 'Submit workflow mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 space-y-4 pr-1">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tiêu đề <span className="text-red-400">*</span></label>
            <input type="text" required value={form.title} onChange={upd('title')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={upd('description')} rows={3}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={upd('category')} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c ? c.toUpperCase() : '(không)'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Version</label>
              <input type="text" value={form.version} onChange={upd('version')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Tags <span className="text-slate-500 text-xs">(phân cách bằng dấu phẩy)</span>
            </label>
            <input type="text" value={form.tags} onChange={upd('tags')} placeholder="etl, csv, pandas" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              L2S Node <span className="text-slate-500 text-xs">(nếu workflow có thể chạy live)</span>
            </label>
            <select value={form.node_id} onChange={upd('node_id')} className={inputCls}>
              <option value="">(không — chỉ share definition)</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} — {n.base_url}</option>)}
            </select>
          </div>
          {form.node_id && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                L2S Workflow ID <span className="text-slate-500 text-xs">(UUID)</span>
              </label>
              <input type="text" value={form.l2s_workflow_id} onChange={upd('l2s_workflow_id')}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={`${inputCls} font-mono text-xs`} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Workflow Definition (JSON) <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.workflow_def}
              onChange={(e) => { upd('workflow_def')(e); setDefErr('') }}
              rows={8}
              className={`${inputCls} font-mono text-xs resize-y`}
            />
            {defErr && <p className="text-xs text-red-400 mt-1">{defErr}</p>}
            <p className="text-xs text-slate-500 mt-1">{`{"nodes": [...], "edges": [...]}`}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
            Hủy
          </button>
          <button
            onClick={submit}
            disabled={submitting || !form.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {initial ? 'Cập nhật' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// NODES TAB
// ============================================================

function NodesTab({
  onToast,
  onCountChange,
}: {
  onToast: (k: 'ok' | 'err', m: string) => void
  onCountChange: (n: number) => void
}) {
  const [items, setItems] = useState<NodeOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const ns = await api.listNodes()
      setItems(ns)
      onCountChange(ns.length)
    } catch { onToast('err', 'Không tải được nodes') }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const del = async (id: string, name: string) => {
    if (!confirm(`Xoá node "${name}"?`)) return
    try { await api.deleteNode(id); onToast('ok', 'Đã xoá node'); reload() }
    catch (err: any) { onToast('err', err?.response?.data?.detail || 'Xoá thất bại') }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{items.length} node đã đăng ký</span>
        <div className="flex gap-2">
          <button
            onClick={reload}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-teal-500/20"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Đăng ký node</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-16 bg-slate-800/20 animate-pulse ${i < 2 ? 'border-b border-slate-700/50' : ''}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center">
            <Server size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-300 mb-1">Chưa có L2S node nào được đăng ký</p>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            Đăng ký L2S instance để L2SC có thể forward execute requests về node đó.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-sm border border-teal-500/30 transition"
          >
            Đăng ký node đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg">
          {items.map((n, idx) => (
            <div
              key={n.id}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-700/30 transition group ${
                idx < items.length - 1 ? 'border-b border-slate-700/50' : ''
              } ${idx === 0 ? 'rounded-t-lg' : ''} ${idx === items.length - 1 ? 'rounded-b-lg' : ''}`}
            >
              {/* Status dot */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center">
                  <Server size={15} className="text-sky-400" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${n.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">{n.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    n.is_active
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}>
                    {n.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                  <a
                    href={n.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-0.5 hover:text-teal-400 transition truncate max-w-xs"
                  >
                    <ExternalLink size={9} />{n.base_url}
                  </a>
                  {n.last_seen_at && (
                    <span className="hidden sm:inline">Last seen: {formatRelative(n.last_seen_at)}</span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => del(n.id, n.name)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <NodeFormDialog
          onClose={() => setShowAdd(false)}
          onDone={() => { setShowAdd(false); reload(); onToast('ok', 'Đã đăng ký node') }}
          onError={(m) => onToast('err', m)}
        />
      )}
    </>
  )
}

function NodeFormDialog({
  onClose,
  onDone,
  onError,
}: {
  onClose: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [form, setForm] = useState({ name: '', base_url: '', node_api_key: '' })
  const [submitting, setSubmitting] = useState(false)

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim() || !form.base_url.trim() || !form.node_api_key.trim()) return
    setSubmitting(true)
    try {
      await api.registerNode({ name: form.name.trim(), base_url: form.base_url.trim(), node_api_key: form.node_api_key.trim() })
      onDone()
    } catch (err: any) { onError(err?.response?.data?.detail || 'Đăng ký thất bại') }
    finally { setSubmitting(false) }
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base sm:text-xl font-semibold text-white flex items-center gap-2">
            <Server size={18} className="text-sky-400" />
            Đăng ký L2S Node
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên node <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={upd('name')} placeholder="My L2S Instance" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Base URL <span className="text-red-400">*</span></label>
            <input type="url" value={form.base_url} onChange={upd('base_url')} placeholder="http://your-l2s-host:9995"
              className={`${inputCls} font-mono text-xs`} />
            <p className="text-xs text-slate-500 mt-1">URL public có thể gọi từ L2SC server</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Node API Key <span className="text-red-400">*</span></label>
            <input type="password" value={form.node_api_key} onChange={upd('node_api_key')} placeholder="L2S JWT token hoặc API key"
              className={`${inputCls} font-mono text-xs`} />
            <p className="text-xs text-slate-500 mt-1">L2SC dùng key này khi gọi ngược về L2S node</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">Hủy</button>
          <button
            onClick={submit}
            disabled={submitting || !form.name.trim() || !form.base_url.trim() || !form.node_api_key.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  )
}
