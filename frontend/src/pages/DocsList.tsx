import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, Search, Sparkles, Loader2, AlertCircle, RefreshCw,
  Download, Shuffle, Database, FolderOpen, Bot, Brain, MessageSquare, Eye,
  TrendingUp, Settings, Cpu, SearchCode, Palette, BarChart3, Share2, Plug,
  Code2, Wrench, Package,
} from 'lucide-react'
import Header from '../components/Header'
import ViewToggle, { useViewMode } from '../components/ViewToggle'
import { api, NodeDocSummary } from '../api/client'
import { useAuthStore } from '../store/authStore'

type CategoryInfo = { name: string; Icon: React.ComponentType<{ size?: number; className?: string }>; desc: string }

const CATEGORY_LABEL: Record<string, CategoryInfo> = {
  data_source:    { name: 'Nguồn dữ liệu',           Icon: Download,      desc: 'Lấy dữ liệu từ file, API, dataset' },
  data_transform: { name: 'Biến đổi dữ liệu',        Icon: Shuffle,       desc: 'Lọc, gộp, chuẩn hoá, chia cột' },
  database:       { name: 'Cơ sở dữ liệu',           Icon: Database,      desc: 'PostgreSQL, MongoDB, MySQL…' },
  file_io:        { name: 'Đọc/Ghi file',            Icon: FolderOpen,    desc: 'HDFS, export, xuất model' },
  ml_classical:   { name: 'Machine Learning cổ điển', Icon: Bot,           desc: 'Random Forest, XGBoost, KMeans' },
  ml_deep:        { name: 'Deep Learning',           Icon: Brain,         desc: 'CNN, LSTM, Transfer Learning' },
  ml_nlp:         { name: 'Xử lý ngôn ngữ (NLP)',     Icon: MessageSquare, desc: 'Vector hoá, embedding văn bản' },
  ml_cv:          { name: 'Thị giác máy tính',        Icon: Eye,           desc: 'Phân loại ảnh' },
  ml_forecast:    { name: 'Dự báo chuỗi thời gian',   Icon: TrendingUp,    desc: 'Time series forecast' },
  ml_ops:         { name: 'ML Ops',                   Icon: Settings,      desc: 'Predict, đánh giá, tune, giải thích' },
  llm:            { name: 'LLM & AI Agent',           Icon: Cpu,           desc: 'GPT, Claude, Gemini, agent tools' },
  rag:            { name: 'RAG (Retrieval)',          Icon: SearchCode,    desc: 'Chunk, embedding, vector search' },
  multimodal:     { name: 'Đa phương tiện',           Icon: Palette,       desc: 'Ảnh, âm thanh, vision chat' },
  visualization:  { name: 'Trực quan hoá',            Icon: BarChart3,     desc: 'Biểu đồ Plotly, xem bảng' },
  social_media:   { name: 'Mạng xã hội',              Icon: Share2,        desc: 'Discord, Slack, Telegram, Twitter' },
  integration:    { name: 'Tích hợp REST',            Icon: Plug,          desc: 'Gọi API bên ngoài' },
  scripting:      { name: 'Code Python tự viết',      Icon: Code2,         desc: 'Python Script node' },
  infrastructure: { name: 'Hạ tầng & Lịch chạy',      Icon: Wrench,        desc: 'Trigger, timer, instance DB' },
}

function catMeta(cat: string | null | undefined): CategoryInfo {
  if (!cat) return { name: 'Khác', Icon: Package, desc: '' }
  return CATEGORY_LABEL[cat] || { name: cat, Icon: Package, desc: '' }
}

export default function DocsList() {
  const { contributor } = useAuthStore()
  const [docs, setDocs] = useState<NodeDocSummary[] | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useViewMode('docs', 'grid')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listDocs()
      setDocs(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không tải được danh sách plugin')
      setDocs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await api.refreshDocsCache()
      await load()
    } catch {
      // non-admin sẽ 403, silently
    } finally {
      setRefreshing(false)
    }
  }

  const filtered = useMemo(() => {
    if (!docs) return []
    const q = query.trim().toLowerCase()
    return docs.filter((d) => {
      if (category && d.category !== category) return false
      if (!q) return true
      return (
        d.plugin_type.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      )
    })
  }, [docs, query, category])

  const grouped = useMemo(() => {
    const map = new Map<string, NodeDocSummary[]>()
    for (const d of filtered) {
      const key = d.category || '_'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    // sort categories by count desc
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const allCategories = useMemo(() => {
    if (!docs) return []
    const s = new Set<string>()
    docs.forEach((d) => d.category && s.add(d.category))
    return Array.from(s).sort()
  }, [docs])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-teal-400 text-sm mb-2">
                <BookOpen size={16} />
                <span>Tài liệu hướng dẫn</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">
                Các node của L2S
              </h1>
              <p className="text-slate-400 max-w-2xl">
                Mỗi node là một "viên gạch" bạn kéo vào workflow. Click vào node bất kỳ để xem <strong className="text-white">nó làm gì</strong>, <strong className="text-white">khi nào nên dùng</strong>, và <strong className="text-white">ví dụ thực tế</strong>.
                Không cần biết code vẫn dùng được.
              </p>
            </div>
            {contributor?.is_admin && (
              <button
                onClick={refresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition disabled:opacity-50"
                title="Refresh cache từ L2S node (khi cài plugin mới)"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Refresh cache
              </button>
            )}
          </div>
        </div>

        {/* Search + filter + view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả… (ví dụ: 'đọc file', 'postgres', 'llm')"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">Tất cả nhóm ({docs?.length || 0})</option>
            {allCategories.map((c) => {
              const m = catMeta(c)
              const count = docs?.filter((d) => d.category === c).length || 0
              return (
                <option key={c} value={c}>
                  {m.name} ({count})
                </option>
              )
            })}
          </select>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Đang tải danh sách plugin…
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 mb-4">
            <AlertCircle size={18} className="mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-xs text-red-400/70 mt-1">
                Docs cần L2S node đã đăng ký với L2SC. Kiểm tra env <code className="text-red-300">L2SC_URL</code> trong L2S .env và thử lại.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Không tìm thấy plugin phù hợp.
          </div>
        )}

        {/* Grouped by category — grid OR list */}
        {grouped.map(([cat, items]) => {
          const m = catMeta(cat === '_' ? null : cat)
          const CatIcon = m.Icon
          return (
            <section key={cat} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 flex-shrink-0">
                  <CatIcon size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{m.name}</h2>
                  {m.desc && <p className="text-xs text-slate-500">{m.desc}</p>}
                </div>
                <span className="ml-auto text-xs text-slate-500">{items.length} node</span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((d) => (
                    <DocCard key={d.plugin_type} d={d} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/40 border border-slate-800 rounded-lg divide-y divide-slate-800">
                  {items.map((d) => (
                    <DocRow key={d.plugin_type} d={d} />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Card / Row components ----------

function DocCard({ d }: { d: NodeDocSummary }) {
  return (
    <Link
      to={`/docs/${d.plugin_type}`}
      className="group block p-4 bg-slate-800/60 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 rounded-lg transition"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-white text-sm group-hover:text-teal-300 transition">
          {d.label}
        </h3>
        {d.has_doc && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[10px] font-medium whitespace-nowrap">
            <Sparkles size={9} />
            Có tutorial
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 mb-2">
        {d.description || <span className="italic text-slate-600">Chưa có mô tả</span>}
      </p>
      <code className="text-[10px] text-slate-500 font-mono">{d.plugin_type}</code>
    </Link>
  )
}

function DocRow({ d }: { d: NodeDocSummary }) {
  return (
    <Link
      to={`/docs/${d.plugin_type}`}
      className="group flex items-center gap-4 px-4 py-3 hover:bg-slate-800/60 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-white text-sm group-hover:text-teal-300 transition truncate">
            {d.label}
          </h3>
          <code className="text-[10px] text-slate-500 font-mono shrink-0">{d.plugin_type}</code>
          {d.has_doc && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[10px] font-medium shrink-0">
              <Sparkles size={9} />
              Có tutorial
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-1">
          {d.description || <span className="italic text-slate-600">Chưa có mô tả</span>}
        </p>
      </div>
    </Link>
  )
}

