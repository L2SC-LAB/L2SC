import { useEffect, useState } from 'react'
import {
  ShieldCheck, CheckCircle2, XCircle, Trash2, RefreshCw,
  Loader2, AlertCircle, BarChart2, Users, Server, Workflow,
  Play, Clock,
} from 'lucide-react'
import { api, WorkflowOut, AdminStats } from '../api/client'
import Header from '../components/Header'

type Tab = 'pending' | 'all'

function formatRelative(iso?: string | null) {
  if (!iso) return '—'
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg })
    if (kind === 'ok') api.getAdminStats().then(setStats).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Quản lý workflows, contributors và hệ thống L2SC</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard icon={<Workflow size={18} className="text-teal-400" />} label="Tổng WF" value={stats.total_workflows} />
            <StatCard icon={<CheckCircle2 size={18} className="text-emerald-400" />} label="Đã duyệt" value={stats.approved_workflows} />
            <StatCard icon={<Clock size={18} className="text-amber-400" />} label="Chờ duyệt" value={stats.pending_workflows} highlight={stats.pending_workflows > 0} />
            <StatCard icon={<Users size={18} className="text-cyan-400" />} label="Contributors" value={stats.total_contributors} />
            <StatCard icon={<Server size={18} className="text-blue-400" />} label="Nodes" value={stats.total_nodes} />
            <StatCard icon={<Play size={18} className="text-violet-400" />} label="Lượt chạy" value={stats.total_runs} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/50 border border-slate-700 rounded-xl mb-6 w-fit">
          {(['pending', 'all'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'pending' ? (
                <><Clock size={14} /> Chờ duyệt {stats?.pending_workflows ? `(${stats.pending_workflows})` : ''}</>
              ) : (
                <><BarChart2 size={14} /> Tất cả</>
              )}
            </button>
          ))}
        </div>

        {tab === 'pending' && <PendingTab onToast={showToast} />}
        {tab === 'all' && <AllWorkflowsTab onToast={showToast} />}
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

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <div className={`text-2xl font-bold ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    </div>
  )
}

// ---------- Pending Tab ----------

function PendingTab({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [items, setItems] = useState<WorkflowOut[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try { setItems(await api.getPendingWorkflows()) }
    catch { onToast('err', 'Không tải được') }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const approve = async (id: string, approved: boolean) => {
    try {
      await api.approveWorkflow(id, approved)
      onToast('ok', approved ? 'Đã duyệt workflow' : 'Đã từ chối workflow')
      reload()
    } catch (err: any) { onToast('err', err?.response?.data?.detail || 'Lỗi') }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-slate-400" /></div>

  if (items.length === 0) return (
    <div className="text-center py-16">
      <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
      <p className="text-slate-300 font-medium">Không có workflow nào chờ duyệt</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{items.length} workflow đang chờ</span>
        <button onClick={reload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><RefreshCw size={15} /></button>
      </div>
      {items.map((wf) => (
        <AdminWorkflowCard key={wf.id} wf={wf} showApprove onApprove={(a) => approve(wf.id, a)} onDelete={async () => {
          try { await api.deleteWorkflowAdmin(wf.id); onToast('ok', 'Đã xoá'); reload() }
          catch { onToast('err', 'Xoá thất bại') }
        }} />
      ))}
    </div>
  )
}

// ---------- All Workflows Tab ----------

function AllWorkflowsTab({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [items, setItems] = useState<WorkflowOut[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try { setItems(await api.getAllWorkflowsAdmin()) }
    catch { onToast('err', 'Không tải được') }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const approve = async (id: string, approved: boolean) => {
    try {
      await api.approveWorkflow(id, approved)
      onToast('ok', approved ? 'Đã duyệt' : 'Đã thu hồi duyệt')
      reload()
    } catch (err: any) { onToast('err', err?.response?.data?.detail || 'Lỗi') }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-slate-400" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{items.length} workflow</span>
        <button onClick={reload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"><RefreshCw size={15} /></button>
      </div>
      {items.map((wf) => (
        <AdminWorkflowCard key={wf.id} wf={wf} showApprove onApprove={(a) => approve(wf.id, a)} onDelete={async () => {
          if (!confirm(`Xoá "${wf.title}"?`)) return
          try { await api.deleteWorkflowAdmin(wf.id); onToast('ok', 'Đã xoá'); reload() }
          catch { onToast('err', 'Xoá thất bại') }
        }} />
      ))}
    </div>
  )
}

// ---------- Card ----------

function AdminWorkflowCard({
  wf,
  showApprove,
  onApprove,
  onDelete,
}: {
  wf: WorkflowOut
  showApprove: boolean
  onApprove: (approved: boolean) => void
  onDelete: () => void
}) {
  return (
    <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:border-slate-600 transition">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-white font-medium">{wf.title}</span>
            <span className="text-xs text-slate-400">v{wf.version}</span>
            {wf.is_approved ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/30">
                <CheckCircle2 size={10} /> Đã duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs rounded border border-amber-500/30">
                <Clock size={10} /> Chờ duyệt
              </span>
            )}
          </div>
          {wf.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-2">{wf.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>by {wf.contributor_username}</span>
            {wf.category && <span>{wf.category}</span>}
            <span>{wf.call_count} lần chạy</span>
            <span>{formatRelative(wf.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showApprove && !wf.is_approved && (
            <>
              <button
                onClick={() => onApprove(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs transition"
              >
                <CheckCircle2 size={13} /> Duyệt
              </button>
              <button
                onClick={() => onApprove(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs transition"
              >
                <XCircle size={13} /> Từ chối
              </button>
            </>
          )}
          {showApprove && wf.is_approved && (
            <button
              onClick={() => onApprove(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs transition"
            >
              <XCircle size={13} /> Thu hồi
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
