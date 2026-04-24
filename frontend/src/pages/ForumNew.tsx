import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import {
  ArrowLeft, Send, Loader2, AlertCircle, Sparkles,
  HelpCircle, BookOpen, Megaphone, MessagesSquare,
} from 'lucide-react'
import Header from '../components/Header'
import { api, ForumCategory } from '../api/client'
import { useAuthStore } from '../store/authStore'

const CATEGORIES: { value: ForumCategory; name: string; Icon: React.ComponentType<{ size?: number; className?: string }>; iconCls: string; hint: string }[] = [
  {
    value: 'qa',
    name: 'Hỏi & Đáp',
    Icon: HelpCircle,
    iconCls: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    hint: 'Bạn đang gặp vấn đề và cần giúp đỡ',
  },
  {
    value: 'tutorial',
    name: 'Hướng dẫn',
    Icon: BookOpen,
    iconCls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    hint: 'Chia sẻ cách làm, best practice',
  },
  {
    value: 'showcase',
    name: 'Showcase',
    Icon: Sparkles,
    iconCls: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    hint: 'Khoe workflow, sản phẩm đã build',
  },
  {
    value: 'announcement',
    name: 'Thông báo',
    Icon: Megaphone,
    iconCls: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    hint: 'Release, sự kiện cộng đồng (thường admin)',
  },
]

const DRAFT_KEY = 'l2sc_forum_draft'
const PLACEHOLDER = `## Mô tả

Nêu ngắn gọn bạn đang làm gì / gặp vấn đề gì.

## Đã thử

- Cách 1...
- Cách 2...

## Kỳ vọng

Bạn mong muốn điều gì?

## Thông tin bổ sung

(Phiên bản L2S, OS, log lỗi…)
`

export default function ForumNew() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { apiKey, contributor } = useAuthStore()

  const queryCategory = (params.get('category') || '').toLowerCase() as ForumCategory
  const initialCategory: ForumCategory = CATEGORIES.some((c) => c.value === queryCategory) ? queryCategory : 'qa'
  const prefillTitle = params.get('title') || ''
  const prefillBody = params.get('body') || ''

  const [category, setCategory] = useState<ForumCategory>(initialCategory)
  const [title, setTitle] = useState(prefillTitle)
  const [body, setBody] = useState<string | undefined>(prefillBody || PLACEHOLDER)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  // Restore draft nếu không có prefill từ query
  useEffect(() => {
    if (prefillTitle || prefillBody) return
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.title) setTitle(d.title)
        if (d.body) setBody(d.body)
        if (d.category && CATEGORIES.some((c) => c.value === d.category)) setCategory(d.category)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, category }))
    } catch {}
  }, [title, body, category])

  const submit = async () => {
    if (!apiKey) { navigate('/login'); return }
    setError('')
    const t = title.trim()
    const b = (body || '').trim()
    if (t.length < 5) { setError('Tiêu đề phải có ít nhất 5 ký tự'); return }
    if (b.length < 10) { setError('Nội dung phải có ít nhất 10 ký tự'); return }
    setPosting(true)
    try {
      const thread = await api.createThread({ title: t, body_md: b, category })
      // Xoá draft sau khi submit thành công
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      navigate(`/forum/${thread.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không gửi được')
    } finally {
      setPosting(false)
    }
  }

  const clearDraft = () => {
    if (!confirm('Xoá bản nháp và bắt đầu lại?')) return
    setTitle('')
    setBody(PLACEHOLDER)
    setCategory('qa')
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" data-color-mode="dark">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/forum" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm mb-4">
          <ArrowLeft size={14} />
          Về forum
        </Link>

        <div className="flex items-center gap-2 text-teal-400 text-sm mb-2">
          <MessagesSquare size={16} />
          <span>Đăng bài mới</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          {prefillTitle ? 'Viết bài chia sẻ workflow' : 'Đặt câu hỏi hoặc chia sẻ'}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Đăng nhập với <strong className="text-slate-300">{contributor?.username || '...'}</strong>. Bản nháp được tự lưu vào trình duyệt.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm mb-4">
            <AlertCircle size={15} className="mt-0.5" />
            {error}
          </div>
        )}

        {/* Category picker */}
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Chọn loại bài <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {CATEGORIES.map((c) => {
            const active = category === c.value
            const CatIcon = c.Icon
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`p-3 rounded-lg border text-left transition ${
                  active
                    ? 'bg-slate-700 border-teal-500'
                    : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 ${c.iconCls}`}>
                  <CatIcon size={14} />
                </div>
                <div className="text-sm font-medium text-white">{c.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.hint}</div>
              </button>
            )
          })}
        </div>

        {/* Title */}
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Tiêu đề <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Làm sao để connect PostgreSQL node trên Docker?"
          maxLength={200}
          className="w-full mb-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        />
        <p className="text-[11px] text-slate-500 mb-5">{title.length}/200 ký tự — tối thiểu 5</p>

        {/* Body editor */}
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Nội dung <span className="text-red-400">*</span>
        </label>
        <MDEditor
          value={body}
          onChange={setBody}
          height={450}
          preview="edit"
        />
        <p className="text-[11px] text-slate-500 mt-1 mb-5">
          Hỗ trợ Markdown: **đậm**, *nghiêng*, `code`, ```code block```, list, link, ảnh URL. Tối thiểu 10 ký tự.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={clearDraft}
            type="button"
            className="text-xs text-slate-500 hover:text-slate-300 underline"
          >
            Xoá bản nháp
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/forum')}
              type="button"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
            >
              Huỷ
            </button>
            <button
              onClick={submit}
              disabled={posting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Đăng bài
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
