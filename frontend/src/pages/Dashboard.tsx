import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Server, Workflow, Plus, Trash2, X, Loader2, AlertCircle,
  CheckCircle2, Clock, Zap, Tag, RefreshCw, ExternalLink,
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
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => { refreshMe() }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (kind: 'ok' | 'err', msg: string) => setToast({ kind, msg })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Profile bar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-lg">
            {contributor?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{contributor?.username || '...'}</h1>
            <p className="text-slate-400 text-sm">{contributor?.email}</p>
          </div>
          {contributor?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-lg text-sm transition"
            >
              Admin Panel
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/50 border border-slate-700 rounded-xl mb-6 w-fit">
          {(['workflows', 'nodes'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'workflows' ? <Workflow size={15} /> : <Server size={15} />}
              {t === 'workflows' ? 'Workflows của tôi' : 'L2S Nodes'}
            </button>
          ))}
        </div>

        {tab === 'workflows' && <WorkflowsTab onToast={showToast} />}
        {tab === 'nodes' && <NodesTab onToast={showToast} />}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm ${toast.kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border-red-500/40 text-red-300'}`}>
            {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// WORKFLOWS TAB
// ============================================================

function WorkflowsTab({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [items, setItems] = useState<WorkflowOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [editTarget, setEditTarget] = useState<WorkflowOut | null>(null)

  const reload = async () => {
    setLoading(true)
    try { setItems(await api.listMyWorkflows()) }
    catch { onToast('err', 'Không tải được danh sách') }
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
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm">{items.length} workflow</span>
        <div className="flex gap-2">
          <button onClick={reload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-cyan-500/20"
          >
            <Plus size={15} />
            Submit workflow
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Workflow size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Bạn chưa submit workflow nào</p>
          <button onClick={() => setShowSubmit(true)} className="mt-4 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-sm border border-teal-500/30 transition">
            Submit workflow đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((wf) => (
            <WorkflowRow key={wf.id} wf={wf} onEdit={() => setEditTarget(wf)} onDelete={() => del(wf.id, wf.title)} />
          ))}
        </div>
      )}

      {(showSubmit || editTarget) && (
        <WorkflowFormDialog
          initial={editTarget}
          onClose={() => { setShowSubmit(false); setEditTarget(null) }}
          onDone={() => { setShowSubmit(false); setEditTarget(null); reload(); onToast('ok', editTarget ? 'Đã cập nhật' : 'Đã submit — chờ admin duyệt') }}
          onError={(m) => onToast('err', m)}
        />
      )}
    </>
  )
}

function WorkflowRow({ wf, onEdit, onDelete }: { wf: WorkflowOut; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-slate-600 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-white font-medium truncate">{wf.title}</span>
          {wf.is_approved ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/30">
              <CheckCircle2 size={10} /> Đã duyệt
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded border border-amber-500/30">
              <Clock size={10} /> Chờ duyệt
            </span>
          )}
          {wf.has_live_node && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 text-teal-300 text-xs rounded border border-teal-500/30">
              <Zap size={10} /> Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {wf.category && <span className="flex items-center gap-1"><Tag size={10} />{wf.category}</span>}
          <span>v{wf.version}</span>
          <span>{wf.call_count} lần chạy</span>
          <span>{formatRelative(wf.updated_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition">
          Sửa
        </button>
        <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <Trash2 size={15} />
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">{initial ? 'Cập nhật workflow' : 'Submit workflow mới'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 space-y-4 pr-1">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tiêu đề <span className="text-red-400">*</span></label>
            <input type="text" required value={form.title} onChange={upd('title')}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả</label>
            <textarea value={form.description} onChange={upd('description')} rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={upd('category')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c || '(không)'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Version</label>
              <input type="text" value={form.version} onChange={upd('version')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tags <span className="text-slate-500 text-xs">(phân cách bằng dấu phẩy)</span></label>
            <input type="text" value={form.tags} onChange={upd('tags')} placeholder="etl, csv, pandas"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">L2S Node <span className="text-slate-500 text-xs">(nếu workflow có thể chạy live)</span></label>
            <select value={form.node_id} onChange={upd('node_id')}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500">
              <option value="">(không — chỉ share definition)</option>
              {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} — {n.base_url}</option>)}
            </select>
          </div>

          {form.node_id && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">L2S Workflow ID <span className="text-slate-500 text-xs">(UUID của workflow trong L2S)</span></label>
              <input type="text" value={form.l2s_workflow_id} onChange={upd('l2s_workflow_id')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
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
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs resize-y focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
            {defErr && <p className="text-xs text-red-400 mt-1">{defErr}</p>}
            <p className="text-xs text-slate-500 mt-1">Format: {`{"nodes": [...], "edges": [...]}`}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">Hủy</button>
          <button
            onClick={submit}
            disabled={submitting || !form.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
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

function NodesTab({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [items, setItems] = useState<NodeOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const reload = async () => {
    setLoading(true)
    try { setItems(await api.listNodes()) }
    catch { onToast('err', 'Không tải được nodes') }
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
      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm">{items.length} node đã đăng ký</span>
        <div className="flex gap-2">
          <button onClick={reload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><RefreshCw size={15} /></button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-cyan-500/20"
          >
            <Plus size={15} />
            Đăng ký node
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Server size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Chưa có L2S node nào được đăng ký</p>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Đăng ký L2S instance của bạn để L2SC có thể forward execute requests về node đó.
          </p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-sm border border-teal-500/30 transition">
            Đăng ký node đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-slate-600 transition">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{n.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${n.is_active ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                    {n.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <a href={n.base_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-teal-400 transition">
                    <ExternalLink size={10} />{n.base_url}
                  </a>
                  {n.last_seen_at && <span>Last seen: {formatRelative(n.last_seen_at)}</span>}
                </div>
              </div>
              <button onClick={() => del(n.id, n.name)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-shrink-0">
                <Trash2 size={15} />
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Server size={18} className="text-teal-400" />Đăng ký L2S Node</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên node <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={upd('name')} placeholder="My L2S Instance"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Base URL <span className="text-red-400">*</span></label>
            <input type="url" value={form.base_url} onChange={upd('base_url')} placeholder="http://your-l2s-host:9995"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
            <p className="text-xs text-slate-500 mt-1">URL public có thể gọi từ L2SC server</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Node API Key <span className="text-red-400">*</span></label>
            <input type="password" value={form.node_api_key} onChange={upd('node_api_key')} placeholder="L2S JWT token hoặc API key"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" />
            <p className="text-xs text-slate-500 mt-1">L2SC dùng key này khi gọi ngược về L2S node của bạn</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">Hủy</button>
          <button
            onClick={submit}
            disabled={submitting || !form.name.trim() || !form.base_url.trim() || !form.node_api_key.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  )
}
