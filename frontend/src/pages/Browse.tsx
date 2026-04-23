import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, Globe, Download, Play, Loader2, Tag, User,
  BarChart2, Zap, CheckCircle2, AlertCircle, Eye, FileText,
  Copy, Check,
} from 'lucide-react'
import { api, WorkflowOut, WorkflowDetail, RunOut } from '../api/client'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'

function formatRelative(iso?: string | null) {
  if (!iso) return ''
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  if (delta < 86400 * 7) return `${Math.floor(delta / 86400)} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

const CATEGORIES = ['', 'data', 'ml', 'etl', 'nlp', 'vision', 'automation', 'other']

export default function Browse() {
  const navigate = useNavigate()
  const { apiKey } = useAuthStore()

  const [items, setItems] = useState<WorkflowOut[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [detail, setDetail] = useState<WorkflowDetail | null>(null)
  const [executeTarget, setExecuteTarget] = useState<WorkflowOut | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const fetchItems = useCallback(async (q?: string, cat?: string) => {
    setLoading(true)
    try {
      const data = await api.listWorkflows({ q: q || undefined, category: cat || undefined })
      setItems(data)
    } catch {
      showToast('err', 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchItems(query.trim(), category), 250)
    return () => clearTimeout(t)
  }, [query, category])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg })
  }

  const openDetail = async (id: string) => {
    try {
      const d = await api.getWorkflow(id)
      setDetail(d)
    } catch {
      showToast('err', 'Không tải được chi tiết')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 text-sm mb-4">
            <Globe size={14} />
            Public Workflow Registry
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Khám phá & sử dụng workflow cộng đồng
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Browse hàng ngàn workflow đã được cộng đồng đóng góp.
            Import về L2S của bạn hoặc kích hoạt trực tiếp nếu workflow có node live.
          </p>
        </div>

        {/* Search + filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm workflow..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c ? c.toUpperCase() : 'Tất cả danh mục'}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700 rounded">
            <Globe size={12} className="text-teal-400" />
            {items.length} workflow{query || category ? ' khớp' : ' công khai'}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-slate-800/40 border border-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((wf) => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                onDetail={() => openDetail(wf.id)}
                onExecute={() => setExecuteTarget(wf)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      {detail && (
        <DetailDialog wf={detail} onClose={() => setDetail(null)} onExecute={() => { setDetail(null); setExecuteTarget(detail) }} />
      )}

      {/* Execute dialog */}
      {executeTarget && (
        <ExecuteDialog
          wf={executeTarget}
          onClose={() => setExecuteTarget(null)}
          onToast={showToast}
        />
      )}

      {toast && <Toast kind={toast.kind} msg={toast.msg} />}
    </div>
  )
}

// ---------- WorkflowCard ----------

function WorkflowCard({ wf, onDetail, onExecute }: { wf: WorkflowOut; onDetail: () => void; onExecute: () => void }) {
  return (
    <div className="group relative bg-slate-800/60 border border-slate-700 hover:border-teal-500/50 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-teal-500/10 flex flex-col">
      <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500" />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {wf.category && (
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 text-xs rounded border border-teal-500/30 flex-shrink-0">
                {wf.category}
              </span>
            )}
            {wf.has_live_node && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/30 flex-shrink-0">
                <Zap size={10} />
                Live
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
            <BarChart2 size={11} />
            {wf.call_count}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-1" title={wf.title}>
          {wf.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">
          {wf.description || 'Chưa có mô tả'}
        </p>

        {wf.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {wf.tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded">
                <Tag size={9} />
                {t}
              </span>
            ))}
            {wf.tags.length > 3 && (
              <span className="text-xs text-slate-500">+{wf.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center gap-2 text-xs text-slate-500">
          <User size={11} />
          <span className="truncate">{wf.contributor_username}</span>
          <span className="ml-auto">{formatRelative(wf.updated_at)}</span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-2">
          <button
            onClick={onDetail}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition"
          >
            <Eye size={14} />
            Chi tiết
          </button>
          {wf.has_live_node ? (
            <button
              onClick={onExecute}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-sm rounded-lg transition border border-teal-500/30"
            >
              <Play size={14} />
              Chạy
            </button>
          ) : (
            <button
              onClick={onDetail}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 text-sm rounded-lg transition border border-slate-700"
              title="Workflow này chỉ có definition, không có node live"
            >
              <Download size={14} />
              Import
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- DetailDialog ----------

function DetailDialog({ wf, onClose, onExecute }: { wf: WorkflowDetail; onClose: () => void; onExecute: () => void }) {
  const [copied, setCopied] = useState(false)

  const defStr = JSON.stringify(wf.workflow_def, null, 2)

  const copyDef = () => {
    navigator.clipboard.writeText(defStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-teal-400" />
            <h2 className="text-xl font-semibold text-white truncate">{wf.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin flex-1 space-y-4 pr-1">
          {wf.description && (
            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
                <FileText size={12} /> Mô tả
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{wf.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InfoPill label="Contributor" value={wf.contributor_username} />
            <InfoPill label="Version" value={wf.version} />
            <InfoPill label="Category" value={wf.category || '—'} />
            <InfoPill label="Lượt chạy" value={String(wf.call_count)} />
            <InfoPill label="Nodes" value={String(wf.workflow_def.nodes?.length ?? 0)} />
            <InfoPill label="Edges" value={String(wf.workflow_def.edges?.length ?? 0)} />
          </div>

          {wf.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {wf.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                  <Tag size={10} />{t}
                </span>
              ))}
            </div>
          )}

          {/* workflow_def preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">workflow_def (JSON)</span>
              <button
                onClick={copyDef}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Đã copy' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs text-slate-400 bg-slate-900/60 border border-slate-700 rounded-lg p-3 overflow-x-auto max-h-40 scrollbar-thin">
              {defStr}
            </pre>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
            Đóng
          </button>
          {wf.has_live_node && (
            <button
              onClick={onExecute}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium"
            >
              <Play size={15} />
              Kích hoạt
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- ExecuteDialog ----------

function ExecuteDialog({
  wf,
  onClose,
  onToast,
}: {
  wf: WorkflowOut
  onClose: () => void
  onToast: (kind: 'ok' | 'err', msg: string) => void
}) {
  const [payloadStr, setPayloadStr] = useState('{}')
  const [payloadErr, setPayloadErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [run, setRun] = useState<RunOut | null>(null)
  const [polling, setPolling] = useState(false)

  const validate = () => {
    try { JSON.parse(payloadStr); setPayloadErr(''); return true }
    catch (e: any) { setPayloadErr(e.message); return false }
  }

  const submit = async () => {
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      const res = await api.executeWorkflow(wf.public_token, JSON.parse(payloadStr))
      onToast('ok', 'Đã gửi — đang theo dõi kết quả...')
      pollRun(res.run_id)
    } catch (err: any) {
      onToast('err', err?.response?.data?.detail || 'Lỗi khi execute')
    } finally {
      setSubmitting(false)
    }
  }

  const pollRun = async (run_id: string) => {
    setPolling(true)
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const r = await api.getRun(run_id)
        setRun(r)
        if (r.status === 'success' || r.status === 'failed') { setPolling(false); return }
      } catch { break }
    }
    setPolling(false)
  }

  const statusColor = run
    ? run.status === 'success' ? 'text-emerald-400' : run.status === 'failed' ? 'text-red-400' : 'text-amber-400'
    : ''

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Play size={18} className="text-teal-400" />
            <h2 className="text-xl font-semibold text-white">Kích hoạt workflow</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm">
          <div className="text-slate-300 font-medium truncate">{wf.title}</div>
          <div className="text-xs text-slate-500 mt-0.5">bởi {wf.contributor_username} · {wf.call_count} lần chạy</div>
        </div>

        {!run ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Payload (JSON)
              </label>
              <textarea
                value={payloadStr}
                onChange={(e) => { setPayloadStr(e.target.value); setPayloadErr('') }}
                rows={5}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="{}"
              />
              {payloadErr && <p className="text-xs text-red-400 mt-1">{payloadErr}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">Hủy</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Chạy
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {polling ? (
                <Loader2 size={15} className="animate-spin text-amber-400" />
              ) : run.status === 'success' ? (
                <CheckCircle2 size={15} className="text-emerald-400" />
              ) : (
                <AlertCircle size={15} className="text-red-400" />
              )}
              <span className={`text-sm font-medium ${statusColor}`}>
                {polling ? 'Đang chạy...' : run.status}
              </span>
            </div>

            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-xs font-mono text-slate-400">
              <div className="text-slate-500 mb-1">run_id</div>
              {run.id}
            </div>

            {run.result && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Kết quả</div>
                <pre className="text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded-lg p-3 overflow-x-auto max-h-32 scrollbar-thin">
                  {JSON.stringify(run.result, null, 2)}
                </pre>
              </div>
            )}

            {run.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
                {run.error}
              </div>
            )}

            <button onClick={onClose} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm">
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- helpers ----------

function EmptyState({ query }: { query: string }) {
  if (query) return (
    <div className="text-center py-20">
      <Search size={36} className="mx-auto text-slate-600 mb-3" />
      <p className="text-slate-400">Không tìm thấy workflow nào khớp "{query}"</p>
    </div>
  )
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center">
        <Globe size={36} className="text-teal-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Chưa có workflow nào</h3>
      <p className="text-slate-400 mb-4">Hãy trở thành contributor đầu tiên chia sẻ workflow của bạn.</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm text-slate-200 mt-0.5 truncate">{value}</div>
    </div>
  )
}

function Toast({ kind, msg }: { kind: 'ok' | 'err'; msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm ${kind === 'ok' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border-red-500/40 text-red-300'}`}>
        {kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        {msg}
      </div>
    </div>
  )
}
