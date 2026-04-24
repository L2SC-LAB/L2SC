import axios from 'axios'

const http = axios.create({ baseURL: '' })

http.interceptors.request.use((config) => {
  const key = localStorage.getItem('l2sc_api_key')
  if (key) config.headers['X-API-Key'] = key
  return config
})

export interface WorkflowOut {
  id: string
  public_token: string
  title: string
  description: string | null
  category: string | null
  tags: string[]
  version: string
  is_approved: boolean
  is_rejected: boolean
  is_active: boolean
  call_count: number
  star_count: number
  has_live_node: boolean
  contributor_username: string
  created_at: string
  updated_at: string
}

export interface WorkflowDetail extends WorkflowOut {
  workflow_def: { nodes: any[]; edges: any[] }
}

export interface NodeOut {
  id: string
  name: string
  base_url: string
  is_active: boolean
  last_seen_at: string | null
  created_at: string
}

export interface RunOut {
  id: string
  remote_run_id: string | null
  workflow_id: string | null
  workflow_title: string | null
  status: string
  payload: Record<string, any>
  result: Record<string, any> | null
  error: string | null
  started_at: string
  finished_at: string | null
}

export interface ContributorOut {
  id: string
  username: string
  email: string
  github_url: string | null
  bio: string | null
  is_admin: boolean
  has_password: boolean
  created_at: string
}

export interface LoginResponse {
  api_key: string
  contributor: ContributorOut
}

// ---------- Docs ----------

export interface NodeDocSummary {
  plugin_type: string
  label: string
  description: string | null
  category: string | null
  icon: string | null
  has_doc: boolean
}

export interface NodeDocFieldSchema {
  name: string
  label: string | null
  type: string | null
  required: boolean
  default: any
  description: string | null
  options: any[] | null
}

export interface NodeDocIO {
  name: string
  description: string | null
  schema_hint: any
}

export interface NodeDocDetail {
  plugin_type: string
  label: string
  description: string | null
  category: string | null
  icon: string | null
  config_fields: NodeDocFieldSchema[]
  inputs: NodeDocIO[]
  outputs: NodeDocIO[]
  what_it_does: string | null
  when_to_use: string | null
  example_md: string | null
  faq_md: string | null
  doc_updated_at: string | null
  doc_updated_by: string | null
}

export interface NodeDocEdit {
  what_it_does?: string | null
  when_to_use?: string | null
  example_md?: string | null
  faq_md?: string | null
}

// ---------- Forum ----------

export type ForumCategory = 'qa' | 'tutorial' | 'showcase' | 'announcement'

export interface ForumAuthor {
  id: string
  username: string
  is_admin: boolean
}

export interface ForumThreadSummary {
  id: string
  title: string
  category: ForumCategory
  author: ForumAuthor
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  created_at: string
  updated_at: string
}

export interface ForumReply {
  id: string
  thread_id: string
  body_md: string
  author: ForumAuthor
  created_at: string
  updated_at: string
}

export interface ForumThreadDetail extends ForumThreadSummary {
  body_md: string
  replies: ForumReply[]
}

export interface ForumStats {
  total_threads: number
  by_category: Record<ForumCategory, number>
  total_replies: number
}

export interface Stats {
  approved_workflows: number
  total_contributors: number
  total_nodes: number
  total_runs: number
}

export interface AdminStats extends Stats {
  total_workflows: number
  pending_workflows: number
  rejected_workflows: number
}

export const api = {
  // ---------- Public ----------
  listWorkflows: (params?: { category?: string; tag?: string; q?: string }) =>
    http.get<WorkflowOut[]>('/api/workflows', { params }).then((r) => r.data),

  getWorkflow: (id: string) =>
    http.get<WorkflowDetail>(`/api/workflows/${id}`).then((r) => r.data),

  executeWorkflow: (public_token: string, payload: Record<string, any>) =>
    http
      .post<{ run_id: string; status: string; message: string }>(
        `/api/workflows/${public_token}/execute`,
        { payload }
      )
      .then((r) => r.data),

  getRun: (run_id: string) =>
    http.get<RunOut>(`/api/runs/${run_id}`).then((r) => r.data),

  // ---------- Contributor ----------
  register: (body: {
    username: string
    email: string
    password?: string
    github_url?: string
    bio?: string
  }) =>
    http
      .post<{ id: string; username: string; api_key: string; message: string }>(
        '/api/contribute/register',
        body
      )
      .then((r) => r.data),

  login: (body: { identifier: string; password: string }) =>
    http.post<LoginResponse>('/api/contribute/login', body).then((r) => r.data),

  setPassword: (body: { new_password: string; current_password?: string }) =>
    http.post<{ message: string }>('/api/contribute/set-password', body).then((r) => r.data),

  getMe: () => http.get<ContributorOut>('/api/contribute/me').then((r) => r.data),

  listNodes: () => http.get<NodeOut[]>('/api/contribute/nodes').then((r) => r.data),

  registerNode: (body: { name: string; base_url: string; node_api_key: string }) =>
    http.post<NodeOut>('/api/contribute/nodes', body).then((r) => r.data),

  deleteNode: (id: string) =>
    http.delete(`/api/contribute/nodes/${id}`).then((r) => r.data),

  listMyWorkflows: () =>
    http.get<WorkflowOut[]>('/api/contribute/workflows').then((r) => r.data),

  submitWorkflow: (body: {
    title: string
    description?: string
    category?: string
    tags?: string[]
    workflow_def: object
    node_id?: string
    l2s_workflow_id?: string
    version?: string
  }) => http.post<WorkflowOut>('/api/contribute/workflows', body).then((r) => r.data),

  updateWorkflow: (
    id: string,
    body: {
      title?: string
      description?: string
      category?: string
      tags?: string[]
      workflow_def?: object
      node_id?: string
      l2s_workflow_id?: string
      version?: string
      is_active?: boolean
    }
  ) => http.put<WorkflowOut>(`/api/contribute/workflows/${id}`, body).then((r) => r.data),

  deleteMyWorkflow: (id: string) =>
    http.delete(`/api/contribute/workflows/${id}`).then((r) => r.data),

  // ---------- Admin ----------
  getAdminWorkflows: (params: {
    status?: string
    q?: string
    category?: string
    skip?: number
    limit?: number
  }) => http.get<WorkflowOut[]>('/api/admin/workflows', { params }).then((r) => r.data),

  getAdminWorkflowCount: (params: { status?: string; q?: string; category?: string }) =>
    http.get<{ total: number }>('/api/admin/workflows/count', { params }).then((r) => r.data),

  actionWorkflow: (id: string, action: 'approve' | 'reject' | 'revoke') =>
    http.post(`/api/admin/workflows/${id}/approve`, { action }).then((r) => r.data),

  deleteWorkflowAdmin: (id: string) =>
    http.delete(`/api/admin/workflows/${id}`).then((r) => r.data),

  starWorkflow: (id: string) =>
    http.post<{ star_count: number }>(`/api/workflows/${id}/star`).then((r) => r.data),

  getStats: () => http.get<Stats>('/api/stats').then((r) => r.data),

  getAdminStats: () => http.get<AdminStats>('/api/admin/stats').then((r) => r.data),

  // ---------- Docs ----------
  listDocs: () => http.get<NodeDocSummary[]>('/api/docs').then((r) => r.data),

  getDoc: (pluginType: string) =>
    http.get<NodeDocDetail>(`/api/docs/${pluginType}`).then((r) => r.data),

  upsertDoc: (pluginType: string, body: NodeDocEdit) =>
    http.put<NodeDocDetail>(`/api/docs/${pluginType}`, body).then((r) => r.data),

  refreshDocsCache: () =>
    http.post<{ count: number; source: string }>('/api/docs/_refresh-cache').then((r) => r.data),

  // ---------- Forum ----------
  forumStats: () => http.get<ForumStats>('/api/forum/stats').then((r) => r.data),

  listThreads: (params?: { category?: ForumCategory; q?: string; sort?: string; skip?: number; limit?: number }) =>
    http.get<ForumThreadSummary[]>('/api/forum/threads', { params }).then((r) => r.data),

  getThread: (id: string) => http.get<ForumThreadDetail>(`/api/forum/threads/${id}`).then((r) => r.data),

  createThread: (body: { title: string; body_md: string; category: ForumCategory }) =>
    http.post<ForumThreadDetail>('/api/forum/threads', body).then((r) => r.data),

  updateThread: (id: string, body: { title?: string; body_md?: string; category?: ForumCategory }) =>
    http.put<ForumThreadDetail>(`/api/forum/threads/${id}`, body).then((r) => r.data),

  deleteThread: (id: string) => http.delete(`/api/forum/threads/${id}`).then((r) => r.data),

  createReply: (threadId: string, body: { body_md: string }) =>
    http.post<ForumReply>(`/api/forum/threads/${threadId}/replies`, body).then((r) => r.data),

  updateReply: (replyId: string, body: { body_md: string }) =>
    http.put<ForumReply>(`/api/forum/replies/${replyId}`, body).then((r) => r.data),

  deleteReply: (replyId: string) => http.delete(`/api/forum/replies/${replyId}`).then((r) => r.data),

  pinThread: (id: string) => http.post<ForumThreadSummary>(`/api/forum/threads/${id}/pin`).then((r) => r.data),
  lockThread: (id: string) => http.post<ForumThreadSummary>(`/api/forum/threads/${id}/lock`).then((r) => r.data),

  // backward-compat kept for other callers
  getPendingWorkflows: () =>
    http.get<WorkflowOut[]>('/api/admin/workflows/pending').then((r) => r.data),

  getAllWorkflowsAdmin: () =>
    http.get<WorkflowOut[]>('/api/admin/workflows').then((r) => r.data),

  approveWorkflow: (id: string, approved: boolean) =>
    http.post(`/api/admin/workflows/${id}/approve`, { action: approved ? 'approve' : 'reject' }).then((r) => r.data),
}
