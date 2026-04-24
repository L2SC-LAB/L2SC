import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen, ArrowLeft, Pencil, Save, X, Loader2, AlertCircle,
  Sparkles, HelpCircle, Package, ArrowRight, ArrowDown, Lightbulb,
  CheckCircle2, Info,
} from 'lucide-react'
import Header from '../components/Header'
import { api, NodeDocDetail, NodeDocEdit, NodeDocFieldSchema } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function DocDetail() {
  const { pluginType = '' } = useParams()
  const { contributor } = useAuthStore()
  const [doc, setDoc] = useState<NodeDocDetail | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<NodeDocEdit>({})

  const isAdmin = !!contributor?.is_admin

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const d = await api.getDoc(pluginType)
      setDoc(d)
      setDraft({
        what_it_does: d.what_it_does || '',
        when_to_use: d.when_to_use || '',
        example_md: d.example_md || '',
        faq_md: d.faq_md || '',
      })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không tải được tài liệu plugin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [pluginType])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await api.upsertDoc(pluginType, draft)
      setDoc(updated)
      setEditing(false)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không thể lưu tài liệu')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    if (doc) {
      setDraft({
        what_it_does: doc.what_it_does || '',
        when_to_use: doc.when_to_use || '',
        example_md: doc.example_md || '',
        faq_md: doc.faq_md || '',
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="flex items-center gap-2 text-slate-400 py-16 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Đang tải tài liệu plugin…
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link to="/docs" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm mb-4">
            <ArrowLeft size={14} />
            Về danh sách tài liệu
          </Link>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            <p className="font-medium mb-1">{error || 'Không tìm thấy plugin'}</p>
            <p className="text-xs text-red-400/70">Plugin type: <code>{pluginType}</code></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link to="/docs" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm mb-4">
          <ArrowLeft size={14} />
          Về danh sách tài liệu
        </Link>

        {/* Header */}
        <div className="mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                <BookOpen size={12} />
                <span>{doc.category || 'Khác'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{doc.label}</h1>
              <code className="text-xs text-slate-500 font-mono">{doc.plugin_type}</code>
              {doc.description && (
                <p className="text-slate-300 mt-3 leading-relaxed">{doc.description}</p>
              )}
            </div>
            {isAdmin && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded-lg text-sm transition"
              >
                <Pencil size={14} />
                Sửa nội dung
              </button>
            )}
            {editing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  <X size={14} />
                  Huỷ
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Lưu thay đổi
                </button>
              </div>
            )}
          </div>
          {doc.doc_updated_at && doc.doc_updated_by && (
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
              <Info size={11} />
              Lần cuối cập nhật bởi <span className="text-slate-400">{doc.doc_updated_by}</span> —{' '}
              {new Date(doc.doc_updated_at).toLocaleString('vi-VN')}
            </p>
          )}
        </div>

        {/* Section 1 — "Node này làm gì?" */}
        <Section icon={<Lightbulb size={16} className="text-yellow-400" />} title="Node này làm gì?">
          {editing ? (
            <textarea
              value={draft.what_it_does || ''}
              onChange={(e) => setDraft((d) => ({ ...d, what_it_does: e.target.value }))}
              rows={3}
              placeholder="Giải thích ngắn gọn 1-2 câu, tránh jargon. Ví dụ: 'Đọc file CSV/Excel và biến thành bảng dữ liệu cho các node sau dùng.'"
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : doc.what_it_does ? (
            <p className="text-slate-200 leading-relaxed">{doc.what_it_does}</p>
          ) : (
            <EmptyHint text="Chưa có mô tả đơn giản. Admin có thể thêm để người mới hiểu nhanh node này." />
          )}
        </Section>

        {/* Section 2 — "Khi nào dùng?" */}
        <Section icon={<CheckCircle2 size={16} className="text-emerald-400" />} title="Khi nào nên dùng?">
          {editing ? (
            <textarea
              value={draft.when_to_use || ''}
              onChange={(e) => setDraft((d) => ({ ...d, when_to_use: e.target.value }))}
              rows={5}
              placeholder={`Dùng markdown bullet point. Ví dụ:\n- Khi bạn muốn X\n- Khi cần Y trong pipeline ETL\n- Prototype nhanh không cần database`}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : doc.when_to_use ? (
            <Markdown text={doc.when_to_use} />
          ) : (
            <EmptyHint text="Chưa có gợi ý use case. Biết khi nào dùng sẽ giúp người mới chọn đúng node." />
          )}
        </Section>

        {/* Section 3 — Config (auto) */}
        <Section icon={<Package size={16} className="text-blue-400" />} title="Config cần điền">
          {doc.config_fields.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Node này không có config.</p>
          ) : (
            <div className="space-y-2">
              {doc.config_fields
                .filter((f) => !f.name.startsWith('__'))
                .map((f) => <ConfigField key={f.name} field={f} />)}
            </div>
          )}
        </Section>

        {/* Section 4 — Input/Output (auto) */}
        <Section icon={<ArrowRight size={16} className="text-cyan-400" />} title="Dữ liệu vào & ra">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IOBox
              title="Đầu vào"
              icon={<ArrowDown size={13} className="text-emerald-400" />}
              items={doc.inputs.map((i) => i.name)}
              empty="Node này không nhận input (nguồn gốc pipeline)"
            />
            <IOBox
              title="Đầu ra"
              icon={<ArrowRight size={13} className="text-cyan-400" />}
              items={doc.outputs.map((o) => o.name)}
              empty="Node này không trả output"
            />
          </div>
        </Section>

        {/* Section 5 — Ví dụ thực tế */}
        <Section icon={<Sparkles size={16} className="text-amber-400" />} title="Ví dụ thực tế từng bước">
          {editing ? (
            <textarea
              value={draft.example_md || ''}
              onChange={(e) => setDraft((d) => ({ ...d, example_md: e.target.value }))}
              rows={10}
              placeholder={`### Ví dụ: <tên case>\n\n1. Bước đầu tiên\n2. Bước thứ hai\n3. ...\n\n\`\`\`\nconfig mẫu\n\`\`\``}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : doc.example_md ? (
            <Markdown text={doc.example_md} />
          ) : (
            <EmptyHint text="Chưa có ví dụ thực tế. Admin có thể viết để người mới copy-paste làm theo." />
          )}
        </Section>

        {/* Section 6 — FAQ */}
        <Section icon={<HelpCircle size={16} className="text-rose-400" />} title="Lỗi thường gặp / FAQ">
          {editing ? (
            <textarea
              value={draft.faq_md || ''}
              onChange={(e) => setDraft((d) => ({ ...d, faq_md: e.target.value }))}
              rows={6}
              placeholder={`**Q: Lỗi X xảy ra là do?**\nA: Kiểm tra Y và Z.\n\n**Q: Cần cài gì thêm?**\nA: ...`}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : doc.faq_md ? (
            <Markdown text={doc.faq_md} />
          ) : (
            <EmptyHint text="Chưa có FAQ. Ghi lại lỗi thường gặp sẽ tiết kiệm thời gian support sau này." />
          )}
        </Section>
      </div>
    </div>
  )
}

// ---------- Sub-components ----------

function Section({
  icon, title, children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-6 p-4 sm:p-5 bg-slate-800/40 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-slate-500 text-sm italic flex items-start gap-1.5">
      <Info size={13} className="mt-0.5 flex-shrink-0" />
      {text}
    </p>
  )
}

function ConfigField({ field }: { field: NodeDocFieldSchema }) {
  const typeBadge = (t: string | null) => {
    const map: Record<string, { label: string; cls: string }> = {
      string: { label: 'Chuỗi', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
      number: { label: 'Số', cls: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
      bool: { label: 'Có/Không', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
      boolean: { label: 'Có/Không', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
      select: { label: 'Chọn', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
      textarea: { label: 'Văn bản dài', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
      code: { label: 'Code', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
      json: { label: 'JSON', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
      file: { label: 'File', cls: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
    }
    const m = map[t || ''] || { label: t || 'text', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/30' }
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${m.cls}`}>
        {m.label}
      </span>
    )
  }

  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">{field.label || field.name}</span>
            {typeBadge(field.type)}
            {field.required && (
              <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-[10px]">
                Bắt buộc
              </span>
            )}
          </div>
          <code className="text-[10px] text-slate-600 font-mono">{field.name}</code>
        </div>
      </div>
      {field.description && (
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{field.description}</p>
      )}
      {field.default !== null && field.default !== undefined && (
        <p className="text-xs text-slate-500 mt-1">
          Mặc định: <code className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">{JSON.stringify(field.default)}</code>
        </p>
      )}
      {field.options && field.options.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {field.options.slice(0, 8).map((opt, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px]">
              {String(opt)}
            </span>
          ))}
          {field.options.length > 8 && (
            <span className="text-[10px] text-slate-500">+{field.options.length - 8}</span>
          )}
        </div>
      )}
    </div>
  )
}

function IOBox({
  title, icon, items, empty,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  empty: string
}) {
  return (
    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-400">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((name) => (
            <code key={name} className="px-2 py-1 bg-slate-800 border border-slate-700 text-teal-300 rounded text-xs font-mono">
              {name}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-code:text-teal-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-a:text-teal-400 prose-strong:text-white prose-li:text-slate-300 prose-p:text-slate-300 prose-p:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}
