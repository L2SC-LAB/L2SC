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
  is_active: boolean
  call_count: number
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
  created_at: string
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
  register: (body: { username: string; email: string; github_url?: string; bio?: string }) =>
    http
      .post<{ id: string; username: string; api_key: string; message: string }>(
        '/api/contribute/register',
        body
      )
      .then((r) => r.data),

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
  getPendingWorkflows: () =>
    http.get<WorkflowOut[]>('/api/admin/workflows/pending').then((r) => r.data),

  getAllWorkflowsAdmin: () =>
    http.get<WorkflowOut[]>('/api/admin/workflows').then((r) => r.data),

  approveWorkflow: (id: string, approved: boolean) =>
    http.post(`/api/admin/workflows/${id}/approve`, { approved }).then((r) => r.data),

  deleteWorkflowAdmin: (id: string) =>
    http.delete(`/api/admin/workflows/${id}`).then((r) => r.data),

  getStats: () => http.get<Stats>('/api/stats').then((r) => r.data),

  getAdminStats: () => http.get<AdminStats>('/api/admin/stats').then((r) => r.data),
}
