import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MDEditor from '@uiw/react-md-editor'
import {
  ArrowLeft, MessagesSquare, Loader2, AlertCircle, Pin, Lock, Unlock,
  User, ShieldCheck, Clock, MessageCircle, Eye, Trash2, Pencil,
  Send, X, CornerDownRight, HelpCircle, BookOpen, Sparkles, Megaphone,
} from 'lucide-react'
import Header from '../components/Header'
import { api, ForumThreadDetail, ForumReply, ForumCategory } from '../api/client'
import { useAuthStore } from '../store/authStore'

const CATEGORY_LABEL: Record<ForumCategory, {
  name: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  iconCls: string
}> = {
  qa:           { name: 'Hỏi & Đáp', Icon: HelpCircle, iconCls: 'bg-sky-500/15 border-sky-500/30 text-sky-300' },
  tutorial:     { name: 'Hướng dẫn', Icon: BookOpen,   iconCls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  showcase:     { name: 'Showcase',  Icon: Sparkles,   iconCls: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  announcement: { name: 'Thông báo', Icon: Megaphone,  iconCls: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN')
}

function formatRelative(iso: string) {
  const delta = (Date.now() - new Date(iso).getTime()) / 1000
  if (delta < 60) return 'vừa xong'
  if (delta < 3600) return `${Math.floor(delta / 60)} phút trước`
  if (delta < 86400) return `${Math.floor(delta / 3600)} giờ trước`
  if (delta < 86400 * 7) return `${Math.floor(delta / 86400)} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

export default function ForumDetail() {
  const { threadId = '' } = useParams()
  const navigate = useNavigate()
  const { contributor, apiKey } = useAuthStore()

  const [thread, setThread] = useState<ForumThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)

  const [editingThread, setEditingThread] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState<string | undefined>('')
  const [savingEdit, setSavingEdit] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const t = await api.getThread(threadId)
      setThread(t)
      setEditTitle(t.title)
      setEditBody(t.body_md)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Không tải được thread')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (threadId) load() }, [threadId])

  const postReply = async () => {
    if (!apiKey) { navigate('/login'); return }
    if (!thread || !replyText.trim()) return
    setPosting(true)
    try {
      await api.createReply(thread.id, { body_md: replyText })
      setReplyText('')
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không gửi được')
    } finally {
      setPosting(false)
    }
  }

  const saveThreadEdit = async () => {
    if (!thread) return
    if (editTitle.trim().length < 5) { alert('Tiêu đề quá ngắn'); return }
    if ((editBody || '').trim().length < 10) { alert('Nội dung quá ngắn'); return }
    setSavingEdit(true)
    try {
      await api.updateThread(thread.id, { title: editTitle.trim(), body_md: (editBody || '').trim() })
      setEditingThread(false)
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không lưu được')
    } finally {
      setSavingEdit(false)
    }
  }

  const delThread = async () => {
    if (!thread) return
    if (!confirm(`Xoá bài "${thread.title}"?`)) return
    try {
      await api.deleteThread(thread.id)
      navigate('/forum')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không xoá được')
    }
  }

  const togglePin = async () => {
    if (!thread) return
    try {
      await api.pinThread(thread.id)
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Thao tác lỗi')
    }
  }

  const toggleLock = async () => {
    if (!thread) return
    try {
      await api.lockThread(thread.id)
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Thao tác lỗi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="flex items-center gap-2 text-slate-400 py-16 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Đang tải bài viết…
        </div>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link to="/forum" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm mb-4">
            <ArrowLeft size={14} />
            Về forum
          </Link>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            <p className="font-medium">{error || 'Không tìm thấy bài viết'}</p>
          </div>
        </div>
      </div>
    )
  }

  const meta = CATEGORY_LABEL[thread.category]
  const CatIcon = meta.Icon
  const isOwner = contributor && thread.author.id === contributor.id
  const isAdmin = contributor?.is_admin || false
  const canEdit = isOwner || isAdmin
  const canReply = !!apiKey && (!thread.is_locked || isAdmin)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" data-color-mode="dark">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/forum" className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-sm mb-4">
          <ArrowLeft size={14} />
          Về forum
        </Link>

        {/* Thread header */}
        <div className="mb-4 p-5 bg-slate-800/50 border border-slate-800 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${meta.iconCls}`}>
              <CatIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                <span>{meta.name}</span>
                {thread.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Pin size={11} /> Đã ghim
                  </span>
                )}
                {thread.is_locked && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Lock size={11} /> Đã khoá
                  </span>
                )}
              </div>
              {editingThread ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl font-bold text-white bg-slate-900 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {thread.title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
              {isAdmin && (
                <>
                  <button
                    onClick={togglePin}
                    className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title={thread.is_pinned ? 'Bỏ ghim' : 'Ghim bài'}
                  >
                    <Pin size={14} className={thread.is_pinned ? 'text-amber-400' : ''} />
                  </button>
                  <button
                    onClick={toggleLock}
                    className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title={thread.is_locked ? 'Mở khoá' : 'Khoá bài'}
                  >
                    {thread.is_locked ? <Unlock size={14} /> : <Lock size={14} />}
                  </button>
                </>
              )}
              {canEdit && !editingThread && (
                <button
                  onClick={() => setEditingThread(true)}
                  className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  title="Sửa"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={delThread}
                  className="p-2 bg-slate-700/60 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg transition"
                  title="Xoá"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1">
              <User size={11} />
              <strong className="text-slate-300">{thread.author.username}</strong>
              {thread.author.is_admin && <ShieldCheck size={10} className="text-purple-400" />}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {formatDateTime(thread.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={11} />
              {thread.view_count} lượt xem
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={11} />
              {thread.reply_count} trả lời
            </span>
          </div>

          {editingThread ? (
            <div className="space-y-2">
              <MDEditor
                value={editBody}
                onChange={setEditBody}
                height={360}
                preview="edit"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditingThread(false); setEditTitle(thread.title); setEditBody(thread.body_md) }}
                  disabled={savingEdit}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  onClick={saveThreadEdit}
                  disabled={savingEdit}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded text-sm font-medium transition disabled:opacity-50"
                >
                  {savingEdit ? 'Đang lưu…' : 'Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <Markdown text={thread.body_md} />
          )}
        </div>

        {/* Replies section */}
        <div className="mt-6 mb-3 flex items-center gap-2 text-slate-300">
          <CornerDownRight size={16} />
          <h2 className="text-lg font-semibold">{thread.replies.length} Trả lời</h2>
        </div>

        {thread.replies.length > 0 && (
          <div className="space-y-3 mb-6">
            {thread.replies.map((r) => (
              <ReplyBlock key={r.id} reply={r} onReload={load} />
            ))}
          </div>
        )}

        {/* Reply composer */}
        {thread.is_locked && !isAdmin && (
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-lg text-slate-400 text-sm flex items-center gap-2">
            <Lock size={14} />
            Bài viết đã bị khoá — không thể trả lời thêm.
          </div>
        )}

        {!apiKey && !thread.is_locked && (
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-lg text-slate-400 text-sm">
            <Link to="/login" className="text-teal-400 hover:text-teal-300 underline">Đăng nhập</Link>{' '}
            để trả lời bài viết này.
          </div>
        )}

        {canReply && (
          <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <MessagesSquare size={14} className="text-teal-400" />
              Viết trả lời
            </h3>
            <MDEditor
              value={replyText}
              onChange={(v) => setReplyText(v || '')}
              height={200}
              preview="edit"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={postReply}
                disabled={posting || replyText.trim().length < 2}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Gửi trả lời
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Reply block ----------

function ReplyBlock({ reply, onReload }: { reply: ForumReply; onReload: () => void | Promise<void> }) {
  const { contributor } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string | undefined>(reply.body_md)
  const [saving, setSaving] = useState(false)

  const isOwner = contributor && reply.author.id === contributor.id
  const isAdmin = contributor?.is_admin || false
  const canEdit = isOwner || isAdmin

  const save = async () => {
    if (!draft || draft.trim().length < 2) { alert('Nội dung quá ngắn'); return }
    setSaving(true)
    try {
      await api.updateReply(reply.id, { body_md: draft.trim() })
      setEditing(false)
      await onReload()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không lưu được')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!confirm('Xoá trả lời này?')) return
    try {
      await api.deleteReply(reply.id)
      await onReload()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Không xoá được')
    }
  }

  return (
    <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-lg" data-color-mode="dark">
      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 flex-wrap">
        <span className="inline-flex items-center gap-1">
          <User size={11} />
          <strong className="text-slate-200">{reply.author.username}</strong>
          {reply.author.is_admin && <ShieldCheck size={10} className="text-purple-400" />}
        </span>
        <span>·</span>
        <span>{formatRelative(reply.created_at)}</span>
        <div className="ml-auto flex items-center gap-1">
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition"
              title="Sửa"
            >
              <Pencil size={12} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={del}
              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
              title="Xoá"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <MDEditor value={draft} onChange={setDraft} height={180} preview="edit" />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); setDraft(reply.body_md) }}
              disabled={saving}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition disabled:opacity-50"
            >
              <X size={12} className="inline" /> Huỷ
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-medium transition disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </div>
      ) : (
        <Markdown text={reply.body_md} />
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
