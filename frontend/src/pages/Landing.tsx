import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, ArrowRight, Workflow, Server, Users, Play,
  Download, Upload, CheckCircle2, Zap, Shield, BookOpen,
  ChevronRight, BarChart2, Cpu, Boxes, Star,
  Brain, Database, GitBranch, FlaskConical, Bot, Layers,
  Network, Code2, Heart, Github, X, Minus, ExternalLink, Video,
  Terminal, Copy, Package, Check,
} from 'lucide-react'
import { api, Stats } from '../api/client'
import { useAuthStore } from '../store/authStore'

const L2S_REPO_URL = 'https://github.com/L2SC-LAB/L2S'
const L2SC_REPO_URL = 'https://github.com/L2SC-LAB/L2SC'
const PROMO_VIDEO_URL = ''

export default function Landing() {
  const { apiKey } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between max-w-7xl">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-shadow">
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base leading-none">L2SC</span>
              <span className="block text-[11px] text-teal-400/80 leading-none mt-0.5 font-medium tracking-wide">L2S Communicate</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="#about"    className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">Giới thiệu</a>
            <a href="#power"    className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">Sức mạnh</a>
            <a href="#compare"  className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">So sánh</a>
            <a href="#how"      className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">Cách dùng</a>
            <a href="#install"  className="px-3 py-1.5 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg transition font-medium">Cài đặt</a>
            <a href="#promo"    className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">Video</a>
            <Link to="/browse"  className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition">Browse</Link>
          </nav>

          <div className="flex items-center gap-2">
            {apiKey ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium">
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login"    className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition text-sm">Đăng nhập</Link>
                <Link to="/register" className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-lg transition text-sm font-medium shadow-lg shadow-teal-500/25">
                  Tham gia <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4  w-64 h-64 bg-teal-500/5  rounded-full blur-2xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-500/5  rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="container mx-auto px-6 max-w-5xl relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 text-sm mb-8 backdrop-blur">
            <Zap size={13} className="text-teal-400" />
            Nền tảng workflow cộng đồng mở — Made in Vietnam
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            <span className="text-white">Chia sẻ &</span><br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">kết nối workflow</span><br />
            <span className="text-white">với cộng đồng</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-slate-200">L2SC</strong> là registry công khai cho hệ sinh thái{' '}
            <strong className="text-teal-400">L2S</strong> — nơi bạn có thể browse, import và
            kích hoạt hàng ngàn workflow đã được cộng đồng xây dựng sẵn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://workflows.l2s.io.vn/login" className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl transition font-semibold text-base shadow-2xl shadow-emerald-500/30">
              <Terminal size={18} /> Trải nghiệm ngay  
            </a>
            <a href="#install" className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl transition font-semibold text-base shadow-2xl shadow-emerald-500/30">
              <Terminal size={18} /> Cài đặt L2S  
            </a>
            {/* <Link to="/browse"   className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl transition font-semibold text-base shadow-2xl shadow-teal-500/30">
              <Globe size={18} /> Browse Workflows
            </Link> */}
            <Link to="/register" className="flex items-center gap-2 px-7 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-xl transition font-semibold text-base">
              <Upload size={18} /> Contribute
            </Link>
          </div>

          {stats && (
            <div className="mt-16 flex flex-wrap justify-center gap-6 md:gap-12">
              {[
                { label: 'Workflows công khai', value: stats.approved_workflows },
                { label: 'Contributors',         value: stats.total_contributors },
                { label: 'L2S Nodes',            value: stats.total_nodes },
                { label: 'Lượt thực thi',        value: stats.total_runs },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── WHAT IS L2S ─── */}
      <section id="about" className="py-24 border-t border-slate-800/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs font-medium mb-5">
                <Cpu size={12} /> Nền tảng gốc
              </div>
              <h2 className="text-4xl font-bold text-white mb-5 leading-tight">L2S — Low-code<br />Data Platform</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                <strong className="text-slate-200">L2S</strong> là nền tảng xây dựng pipeline dữ liệu
                bằng giao diện kéo-thả trực quan. Doanh nghiệp và cá nhân có thể deploy{' '}
                <strong className="text-slate-300">on-premise</strong> — toàn quyền kiểm soát dữ liệu, không phụ thuộc cloud.
              </p>
              <ul className="space-y-3">
                {['Visual workflow editor — kéo thả node pipeline', 'Hỗ trợ BigData, ETL, ML, NLP, automation',
                  'Deploy on-premise trên máy chủ riêng', 'Plugin system — mở rộng không giới hạn',
                  'Multi-node cluster cho workload lớn', 'AI assistant tích hợp sẵn'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur shadow-2xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-slate-500">L2S Workflow Editor</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'CSV / Parquet Loader', color: 'from-blue-500/20   to-blue-600/10',   border: 'border-blue-500/30',   dot: 'bg-blue-400' },
                    { label: 'Data Cleaner',          color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', dot: 'bg-violet-400' },
                    { label: 'ML Trainer (XGBoost)',  color: 'from-amber-500/20  to-amber-600/10',  border: 'border-amber-500/30',  dot: 'bg-amber-400' },
                    { label: 'Dashboard Export',      color: 'from-teal-500/20   to-teal-600/10',   border: 'border-teal-500/30',   dot: 'bg-teal-400' },
                  ].map((node, i) => (
                    <div key={node.label} className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${node.color} border ${node.border} flex-1`}>
                        <div className={`w-2 h-2 rounded-full ${node.dot}`} />
                        <span className="text-sm text-white font-medium">{node.label}</span>
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      {i < 3 && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BarChart2 size={11} /> 4 nodes · 3 edges</span>
                  <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> Running</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT IS L2SC ─── */}
      <section className="py-24 border-t border-slate-800/50 bg-gradient-to-b from-slate-900/30 to-transparent">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Globe size={20} className="text-teal-400" />,    title: 'Public Registry',   desc: 'Kho workflow công khai' },
                  { icon: <Play size={20} className="text-cyan-400" />,     title: 'Live Execute',      desc: 'Kích hoạt qua node' },
                  { icon: <Download size={20} className="text-sky-400" />,  title: 'Import dễ dàng',   desc: 'Clone về L2S của bạn' },
                  { icon: <Users size={20} className="text-violet-400" />,  title: 'Community-driven', desc: 'Ai cũng có thể đóng góp' },
                  { icon: <Shield size={20} className="text-emerald-400" />,title: 'Kiểm duyệt',       desc: 'Admin review trước khi public' },
                  { icon: <Boxes size={20} className="text-amber-400" />,   title: 'Multi-node',       desc: 'Kết nối nhiều L2S instance' },
                ].map((card) => (
                  <div key={card.title} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:border-teal-500/30 transition">
                    <div className="mb-2">{card.icon}</div>
                    <div className="text-sm font-semibold text-white mb-1">{card.title}</div>
                    <div className="text-xs text-slate-500">{card.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-teal-300 text-xs font-medium mb-5">
                <Globe size={12} /> Community Layer
              </div>
              <h2 className="text-4xl font-bold text-white mb-5 leading-tight">L2SC — Registry &<br />Execution Proxy</h2>
              <p className="text-slate-400 leading-relaxed mb-5">
                <strong className="text-slate-200">L2SC</strong> là lớp kết nối cộng đồng bên trên L2S.
                Được deploy tập trung bởi nhóm phát triển — bất kỳ ai cũng có thể truy cập,
                browse và kích hoạt workflow mà không cần cài gì thêm.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Khi bạn đăng ký L2S node của mình, L2SC sẽ <strong className="text-slate-300">proxy</strong> execution
                request về đúng instance — workflow chạy trên hạ tầng riêng nhưng vẫn public cho cộng đồng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POWER FEATURES ─── */}
      <section id="power" className="py-24 border-t border-slate-800/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-medium mb-4">
              <Zap size={12} /> Sức mạnh vượt trội
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">
              Làm được — thì chắc chắn có node
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              L2S không chỉ là automation tool. Đây là nền tảng xử lý dữ liệu toàn diện —
              từ BigData đến AI/ML, từ ETL đến test environment, tất cả trong một giao diện kéo-thả.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Database size={28} className="text-blue-400" />,
                glow: 'shadow-blue-500/10',
                bg: 'from-blue-500/10 to-blue-900/5',
                border: 'border-blue-500/20 hover:border-blue-400/40',
                badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                badgeText: 'BigData',
                title: 'Xử lý BigData Low-code',
                desc: 'Kéo node Spark / Pandas / Dask vào editor, nối dây là xong. Xử lý hàng triệu dòng không cần viết một dòng code — L2S lo phần còn lại.',
                points: ['Parquet, CSV, JSON, Delta Lake', 'Streaming + batch processing', 'Tích hợp MinIO / S3 artifact store'],
              },
              {
                icon: <Network size={28} className="text-violet-400" />,
                glow: 'shadow-violet-500/10',
                bg: 'from-violet-500/10 to-violet-900/5',
                border: 'border-violet-500/20 hover:border-violet-400/40',
                badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
                badgeText: 'Multi-node',
                title: 'Phân tán tài nguyên đa máy',
                desc: 'Chạy L2S trên nhiều máy trong LAN, tự động phân phối task. Khi máy A bận, máy B nhận việc — không downtime, không bottleneck.',
                points: ['Cluster mode: coordinator + workers', 'mDNS auto-discovery trong LAN', 'Load balancing tự động'],
              },
              {
                icon: <Brain size={28} className="text-pink-400" />,
                glow: 'shadow-pink-500/10',
                bg: 'from-pink-500/10 to-pink-900/5',
                border: 'border-pink-500/20 hover:border-pink-400/40',
                badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
                badgeText: 'AI / ML',
                title: 'Train model AI không cần code',
                desc: 'Drag node sklearn, XGBoost, PyTorch, Hugging Face vào pipeline. Kéo dataset — chọn model — chạy. Kết quả trực tiếp trên dashboard.',
                points: ['Classification, Regression, Clustering', 'Fine-tune LLM / Embedding model', 'Auto export model artifact'],
              },
              {
                icon: <GitBranch size={28} className="text-teal-400" />,
                glow: 'shadow-teal-500/10',
                bg: 'from-teal-500/10 to-teal-900/5',
                border: 'border-teal-500/20 hover:border-teal-400/40',
                badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
                badgeText: 'ETL',
                title: 'ETL data lớn, tốc độ cao',
                desc: 'Pipeline Extract → Transform → Load hoàn chỉnh. Kết nối nhiều nguồn dữ liệu, biến đổi, chuẩn hóa rồi đẩy về warehouse chỉ bằng vài click.',
                points: ['100+ connector: DB, API, file, stream', 'Transform: join, filter, aggregate, pivot', 'Incremental load + CDC support'],
              },
              {
                icon: <FlaskConical size={28} className="text-emerald-400" />,
                glow: 'shadow-emerald-500/10',
                bg: 'from-emerald-500/10 to-emerald-900/5',
                border: 'border-emerald-500/20 hover:border-emerald-400/40',
                badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                badgeText: 'Test Env',
                title: 'Giả lập môi trường test nhanh',
                desc: 'Spin up container test environment trong vài giây. Chạy workflow ở chế độ sandbox — không ảnh hưởng production, xóa sạch sau khi test xong.',
                points: ['Docker-in-Docker tích hợp sẵn', 'Mock data injection per node', 'One-click teardown'],
              },
              {
                icon: <Bot size={28} className="text-cyan-400" />,
                glow: 'shadow-cyan-500/10',
                bg: 'from-cyan-500/10 to-cyan-900/5',
                border: 'border-cyan-500/20 hover:border-cyan-400/40',
                badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                badgeText: 'Automation',
                title: 'Công cụ tự động hóa đầy đủ',
                desc: 'Schedule workflow theo cron, trigger theo event, webhook, hay kết nối API bên ngoài. Mọi tác vụ lặp đi lặp lại đều có thể tự động hóa.',
                points: ['Cron scheduler + event trigger', 'Webhook in/out + API gateway', 'Notification: email, Slack, Telegram'],
              },
              {
                icon: <Layers size={28} className="text-sky-400" />,
                glow: 'shadow-sky-500/10',
                bg: 'from-sky-500/10 to-sky-900/5',
                border: 'border-sky-500/20 hover:border-sky-400/40',
                badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
                badgeText: 'Low-code',
                title: 'Dễ dùng từ ngày đầu tiên',
                desc: 'Không cần biết lập trình vẫn xây được pipeline phức tạp. Giao diện drag-and-drop trực quan, template có sẵn, tài liệu đầy đủ bằng tiếng Việt.',
                points: ['50+ template workflow sẵn có', 'Visual node config panel', 'Không cần DevOps — 1 lệnh khởi động'],
              },
              {
                icon: <Code2 size={28} className="text-amber-400" />,
                glow: 'shadow-amber-500/10',
                bg: 'from-amber-500/10 to-amber-900/5',
                border: 'border-amber-500/20 hover:border-amber-400/40',
                badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                badgeText: 'Plugin',
                title: 'Nếu code được, chắc có node',
                desc: 'Plugin system mở — bất kỳ thư viện Python nào cũng có thể biến thành node kéo-thả. Community tạo node, L2SC chia sẻ, mọi người cùng dùng.',
                points: ['Hot-install plugin không restart', 'PyPI package → node tự động', 'Share plugin qua L2SC marketplace'],
              },
              {
                icon: <Brain size={28} className="text-rose-400" />,
                glow: 'shadow-rose-500/10',
                bg: 'from-rose-500/10 to-rose-900/5',
                border: 'border-rose-500/20 hover:border-rose-400/40',
                badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                badgeText: 'AI Assistant',
                title: 'AI hỗ trợ tận răng',
                desc: 'AI agent tích hợp ngay trong editor — gợi ý node tiếp theo, debug lỗi, giải thích output, tự động viết transform logic. Như có senior developer ngồi bên.',
                points: ['LLM-powered node suggestion', 'Auto-debug + error explanation', 'Natural language → workflow generation'],
              },
            ].map((f) => (
              <div key={f.title} className={`p-6 rounded-2xl bg-gradient-to-br ${f.bg} border ${f.border} transition-all shadow-xl ${f.glow}`}>
                <div className="flex items-start justify-between mb-4">
                  {f.icon}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${f.badge}`}>{f.badgeText}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2 leading-snug">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 size={12} className="text-teal-400 flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARE WITH AUTOMATION SYSTEMS ─── */}
      <section id="compare" className="py-24 border-t border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-300 text-xs font-medium mb-4">
              <BarChart2 size={12} /> So sánh
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">L2S vs Hệ thống automation</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Nhiều hệ thống automation mạnh ở tác vụ tích hợp nhanh, còn L2S tập trung sâu vào
              <strong className="text-slate-200"> data engineering &amp; AI</strong> với khả năng mở rộng cao hơn.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left p-4 text-slate-400 font-medium w-2/5">Tính năng</th>
                  <th className="p-4 text-center w-[30%]">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/40 rounded-lg">
                      <Globe size={14} className="text-teal-400" />
                      <span className="text-white font-bold">L2S</span>
                    </div>
                  </th>
                  <th className="p-4 text-center w-[30%]">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                      <span className="text-slate-300 font-semibold">Hệ thống automation</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Visual drag-and-drop editor',          l2s: true,    automation: true,   note: '' },
                  { feature: 'On-premise self-hosted',               l2s: true,    automation: 'half', note: 'Nhiều nền tảng cloud-first, self-host cần cấu hình nâng cao' },
                  { feature: 'BigData processing (Spark / Dask)',     l2s: true,    automation: false,  note: 'Thường tối ưu automation tác vụ, chưa tập trung BigData native' },
                  { feature: 'Multi-node distributed cluster',        l2s: true,    automation: false,  note: 'Ít hệ thống hỗ trợ phân tán tài nguyên LAN-native' },
                  { feature: 'Train AI / ML model',                   l2s: true,    automation: 'half', note: 'Phổ biến ở tích hợp AI API, ít tập trung training pipeline' },
                  { feature: 'ETL pipeline quy mô lớn',               l2s: true,    automation: 'half', note: 'Phù hợp ETL nhỏ-vừa, chưa tối ưu mạnh cho dữ liệu lớn' },
                  { feature: 'Test environment sandbox',              l2s: true,    automation: false,  note: '' },
                  { feature: 'Automation & webhook',                  l2s: true,    automation: true,   note: '' },
                  { feature: 'AI assistant tích hợp',                 l2s: true,    automation: 'half', note: 'Nhiều nền tảng có AI node, nhưng chưa có trợ lý sâu theo ngữ cảnh pipeline' },
                  { feature: 'Plugin / custom node từ PyPI',          l2s: true,    automation: 'half', note: 'Hỗ trợ mở rộng khác nhau tùy hệ sinh thái công nghệ' },
                  { feature: 'Community workflow marketplace',        l2s: true,    automation: true,   note: '' },
                  { feature: 'Chi phí self-host dài hạn',             l2s: true,    automation: 'paid', note: 'Một số nền tảng cần gói trả phí cho tính năng nâng cao' },
                  { feature: 'Tài liệu tiếng Việt',                   l2s: true,    automation: false,  note: '' },
                  { feature: 'Made in Vietnam',                       l2s: true,    automation: false,  note: 'Định hướng cộng đồng IT Việt và nhu cầu doanh nghiệp nội địa' },
                ].map((row, i) => (
                  <tr key={row.feature} className={`border-b border-slate-800/60 ${i % 2 === 0 ? 'bg-slate-900/20' : ''} hover:bg-slate-800/20 transition`}>
                    <td className="p-4 text-slate-300">
                      <span>{row.feature}</span>
                      {row.note && <span className="block text-xs text-slate-600 mt-0.5">{row.note}</span>}
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle2 size={18} className="text-teal-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      {row.automation === true ? (
                        <CheckCircle2 size={18} className="text-emerald-400 mx-auto" />
                      ) : row.automation === 'half' ? (
                        <Minus size={18} className="text-amber-400 mx-auto" />
                      ) : row.automation === 'paid' ? (
                        <span className="text-xs text-amber-400 font-medium">Paid+</span>
                      ) : (
                        <X size={18} className="text-red-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            So sánh dựa trên nhóm tính năng phổ biến của các hệ thống automation hiện nay.
          </p>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-24 border-t border-slate-800/50">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-medium mb-4">
              <BookOpen size={12} /> Hướng dẫn nhanh
            </div>
            <h2 className="text-4xl font-bold text-white">Cách hoạt động</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              4 bước để workflow của bạn trở thành tài nguyên của cả cộng đồng
            </p>
          </div>

          <div className="relative">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '01', icon: <Cpu size={22} className="text-blue-400" />,      color: 'from-blue-500/20   to-blue-600/10',   border: 'border-blue-500/30',   title: 'Deploy L2S',      desc: 'Cài đặt L2S on-premise trên máy chủ của bạn.' },
                { step: '02', icon: <Workflow size={22} className="text-violet-400" />,color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', title: 'Tạo Workflow',    desc: 'Kéo-thả các node để xây dựng pipeline xử lý dữ liệu.' },
                { step: '03', icon: <Upload size={22} className="text-teal-400" />,    color: 'from-teal-500/20   to-teal-600/10',   border: 'border-teal-500/30',   title: 'Submit lên L2SC', desc: 'Đăng ký node và submit workflow. Admin L2SC sẽ review.' },
                { step: '04', icon: <Globe size={22} className="text-cyan-400" />,     color: 'from-cyan-500/20   to-cyan-600/10',   border: 'border-cyan-500/30',   title: 'Cộng đồng dùng',  desc: 'Ai cũng có thể browse, import hoặc execute trực tiếp.' },
              ].map((step, index, steps) => (
                <div key={step.step} className="relative text-center">
                  {index < steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden md:block absolute top-10 left-[calc(50%+2.5rem)] w-[calc(100%-3.5rem)] pointer-events-none"
                    >
                      <div className="h-[2px] rounded-full bg-gradient-to-r from-blue-400/25 via-cyan-400/55 to-teal-400/25 shadow-[0_0_14px_rgba(34,211,238,0.25)]" />
                      <div className="absolute -top-[3px] left-0 w-2 h-2 rounded-full bg-cyan-400/45" />
                      <div className="absolute -top-[3px] right-0 w-2 h-2 rounded-full bg-cyan-300/70 animate-pulse" />
                    </div>
                  )}

                  <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.color} border ${step.border} flex items-center justify-center mb-4 relative z-10`}>
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-400 flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── INSTALL L2S ─── */}
      <InstallL2SSection />

      {/* ─── MADE IN VIETNAM ─── */}
      <section className="py-24 border-t border-slate-800/50 relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-red-500/5 via-yellow-500/5 to-red-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 max-w-5xl relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-300 text-xs font-medium mb-6">
                <Heart size={12} className="text-red-400" /> Made in Vietnam
              </div>
              <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
                Xây dựng bởi người Việt<br />
                <span className="bg-gradient-to-r from-red-400 to-yellow-400 bg-clip-text text-transparent">
                  vì cộng đồng IT Việt
                </span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-5">
                L2S ra đời từ nhu cầu thực tế của các kỹ sư dữ liệu Việt Nam —
                khi các giải pháp nước ngoài quá đắt, quá phức tạp, hoặc không phù hợp với
                bài toán của doanh nghiệp vừa và nhỏ trong nước.
              </p>
              <p className="text-slate-400 leading-relaxed mb-6">
                Chúng tôi tin rằng <strong className="text-slate-200">cộng đồng IT Việt Nam</strong> hoàn toàn
                có thể xây dựng sản phẩm đẳng cấp thế giới. L2S &amp; L2SC là bước đầu —
                và chúng tôi cần sự đồng hành của các bạn.
              </p>

              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <Github size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-semibold text-sm mb-1">Cam kết Open Source</p>
                    <p className="text-slate-400 text-sm">
                      Khi repository đạt <strong className="text-amber-300">183 sao GitHub</strong>,
                      chúng tôi sẽ <strong className="text-white">public toàn bộ source code core</strong> của L2S
                      dưới giấy phép mã nguồn mở. Cộng đồng sẽ có thể fork, contribute và
                      cùng phát triển nền tảng này.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={L2S_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition text-sm font-medium"
                >
                  <Github size={16} />
                  L2S Source
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded border border-amber-500/30">
                    <Star size={11} /> 183 sao = OSS
                  </span>
                </a>

                <a
                  href={L2SC_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition text-sm font-medium"
                >
                  <Github size={16} />
                  L2SC Source
                </a>

                <Link
                  to="/register"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl transition text-sm font-medium"
                >
                  <Users size={16} />
                  Tham gia ngay
                </Link>
              </div>
            </div>

            {/* Right side: values */}
            <div className="space-y-4">
              {[
                {
                  icon: <Heart size={18} className="text-red-400" />,
                  title: 'Sản phẩm Việt cho người Việt',
                  desc: 'Giao diện, tài liệu, support — tất cả bằng tiếng Việt. Không barrier ngôn ngữ, không barrier chi phí.',
                },
                {
                  icon: <Users size={18} className="text-teal-400" />,
                  title: 'Cộng đồng là sức mạnh',
                  desc: 'Mỗi workflow bạn share lên L2SC là một đóng góp cho hàng ngàn kỹ sư khác. Cộng đồng mạnh — sản phẩm mạnh.',
                },
                {
                  icon: <Shield size={18} className="text-amber-400" />,
                  title: 'Cam kết minh bạch',
                  desc: '183 sao GitHub = public source code core. Không lock-in, không surprise pricing. Lời hứa trước cộng đồng.',
                },
                {
                  icon: <BookOpen size={18} className="text-sky-400" />,
                  title: 'Tri thức không biên giới',
                  desc: 'Doanh nghiệp nhỏ, startup, sinh viên hay freelancer — ai cũng có quyền dùng công nghệ data tốt như các tập đoàn lớn.',
                },
              ].map((v) => (
                <div key={v.title} className="flex gap-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-slate-600/60 transition">
                  <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-900/60 flex items-center justify-center flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{v.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── GITHUB + PROMO VIDEO ─── */}
      <section id="promo" className="py-24 border-t border-slate-800/50 bg-gradient-to-b from-slate-900/30 to-transparent">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-medium mb-5">
                <Video size={12} /> Video quảng cáo
              </div>
              <h2 className="text-4xl font-bold text-white mb-5 leading-tight">
                Xem L2SC hoạt động<br />
                qua demo ngắn
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Section này dùng để gắn video giới thiệu sản phẩm và dẫn người xem về GitHub.
                Khi có link video chính thức, chỉ cần cập nhật <span className="text-slate-200">PROMO_VIDEO_URL</span>
                trong landing page là khung phát sẽ tự hiển thị.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  'Xem nhanh flow browse, import và execute workflow',
                  'Dẫn thẳng về repository để star, fork hoặc contribute',
                  'Phù hợp để demo trong báo cáo, thuyết trình và README',
                  'Không phụ thuộc nền tảng video cụ thể',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-teal-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={L2SC_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl transition text-sm font-semibold shadow-lg shadow-teal-500/25"
                >
                  <Github size={16} />
                  Mở GitHub L2SC
                  <ExternalLink size={14} />
                </a>
                <a
                  href={L2S_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition text-sm font-medium"
                >
                  <Github size={16} />
                  Xem L2S Core
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-sky-500/10 rounded-3xl blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-slate-500">L2SC promo preview</span>
                </div>

                <div className="aspect-video bg-slate-950">
                  {PROMO_VIDEO_URL ? (
                    <iframe
                      className="w-full h-full"
                      src={PROMO_VIDEO_URL}
                      title="Video quảng cáo L2SC"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={L2SC_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-full h-full flex flex-col items-center justify-center text-center px-6 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_55%)]"
                    >
                      <span className="w-20 h-20 rounded-full border border-teal-400/40 bg-teal-500/15 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                        <Play size={34} className="text-teal-300 ml-1" />
                      </span>
                      <span className="text-white font-semibold text-lg">Gắn video quảng cáo tại đây</span>
                      <span className="text-slate-500 text-sm mt-2 max-w-md">
                        Cập nhật link embed vào PROMO_VIDEO_URL hoặc mở GitHub để xem source và tài liệu demo.
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-28 border-t border-slate-800/50">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-sky-500/10 rounded-3xl blur-3xl" />
            <div className="relative p-12 rounded-3xl border border-slate-700/60 bg-slate-900/40 backdrop-blur">
              <div className="w-14 h-14 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                <Heart size={26} className="text-red-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Cùng nhau xây dựng</h2>
              <p className="text-slate-400 text-lg mb-3 max-w-lg mx-auto">
                Hàng ngàn kỹ sư dữ liệu Việt đang dùng L2S mỗi ngày.
                Workflow của bạn sẽ giúp ích cho tất cả.
              </p>
              <p className="text-slate-500 text-sm mb-8">Star GitHub để chúng tôi sớm open-source core.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl font-semibold text-base transition shadow-2xl shadow-teal-500/30"
                >
                  <Users size={18} /> Đăng ký Contributor
                </Link>
                <Link
                  to="/browse"
                  className="flex items-center gap-2 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold text-base transition"
                >
                  <Globe size={18} /> Browse Workflows
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800/50 py-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Globe size={15} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-sm">L2SC</span>
                <span className="block text-[11px] text-slate-500">L2S Communicate — Made in Vietnam</span>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <Link to="/browse"   className="hover:text-white transition">Browse</Link>
              <Link to="/register" className="hover:text-white transition">Register</Link>
              <Link to="/login"    className="hover:text-white transition">Login</Link>
              <a
                href={L2S_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1"
              >
                <Github size={13} /> L2S GitHub
              </a>
              <a
                href={L2SC_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition flex items-center gap-1"
              >
                <Github size={13} /> L2SC GitHub
              </a>
              <a href="/docs"      className="hover:text-white transition flex items-center gap-1"><BookOpen size={13} /> API Docs</a>
            </nav>
            <p className="text-xs text-slate-600">
              Cộng đồng IT Việt — <span className="text-teal-500">L2S</span> ecosystem
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ============================================================
// Install L2S section — hướng dẫn cài đặt cho user mới
// ============================================================

// docker-compose.yml content — render trong code block riêng có nút Copy + Download.
const DOCKER_COMPOSE_YML = `services:
  l2s:
    image: baphongpine/l2s:latest
    container_name: l2s-platform
    restart: unless-stopped
    ports:
      - "9996:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@postgres:5432/l2s_platform
      - REDIS_URL=redis://redis:6379/0
      - L2S_SECRET_KEY=\${L2S_SECRET_KEY}
      - L2S_ARTIFACT_BACKEND=auto
      - L2S_MINIO_ENDPOINT=minio:9000
      - L2S_MINIO_ACCESS_KEY=\${L2S_MINIO_ACCESS_KEY}
      - L2S_MINIO_SECRET_KEY=\${L2S_MINIO_SECRET_KEY}
      - L2S_MINIO_BUCKET=l2s-artifacts
      - L2S_CLUSTER_ENABLED=false
      - L2S_CLUSTER_TOKEN=\${L2S_CLUSTER_TOKEN}
      # Auto-connect L2SC community: backend tự register node lên hub lúc startup
      # bằng L2S_CLUSTER_TOKEN — KHÔNG cần đăng ký account/paste API key.
      - L2SC_URL=https://service.l2s.io.vn
      - L2SC_WEB_URL=https://l2s.io.vn
      - L2S_PUBLIC_URL=\${L2S_PUBLIC_URL:-}
      - L2S_CORS_ORIGINS=\${L2S_CORS_ORIGINS:-*}
      - L2S_RATE_LIMIT_ENABLED=\${L2S_RATE_LIMIT_ENABLED:-true}
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_started }
      minio:    { condition: service_healthy }
    volumes:
      - plugin_deps:/plugin_deps
      - vector_stores:/app/vector_stores
      - agent_memory:/app/agent_memory
      - /var/run/docker.sock:/var/run/docker.sock
    privileged: true
    mem_limit: 4g

  postgres:
    image: postgres:15-alpine
    container_name: l2s-platform-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}
      - POSTGRES_DB=l2s_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "PGPASSWORD=$$POSTGRES_PASSWORD psql -U postgres -d l2s_platform -c 'SELECT 1' || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s
    mem_limit: 1g

  redis:
    image: redis:7-alpine
    container_name: l2s-platform-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    mem_limit: 512m

  minio:
    image: minio/minio:latest
    container_name: l2s-platform-minio
    restart: unless-stopped
    ports:
      - "9998:9001"
    environment:
      - MINIO_ROOT_USER=\${L2S_MINIO_ACCESS_KEY:-l2sadmin}
      - MINIO_ROOT_PASSWORD=\${L2S_MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      retries: 5
    mem_limit: 1g

volumes:
  postgres_data:
  redis_data:
  minio_data:
  plugin_deps:
  vector_stores:
  agent_memory:
`

const QUICK_START_HUB_UNIX = `# Linux / macOS — bash / zsh
# Chạy trong cùng thư mục có docker-compose.yml ở trên

# 1. Sinh .env với 5 secret random
#    L2S_CLUSTER_TOKEN được dùng làm contributor identity — backend tự đăng ký
#    lên L2SC community lúc startup, KHÔNG cần đăng ký account thủ công.
cat > .env <<EOF
L2S_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
L2S_CLUSTER_TOKEN=$(python3 -c "import secrets; print(secrets.token_hex(32))")
L2S_MINIO_ACCESS_KEY=l2sadmin
L2S_MINIO_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
EOF
chmod 600 .env

# 2. Pull image + start (lần đầu ~1.4GB)
docker compose up -d

# 3. Mở http://localhost:9996 → admin/admin123 → ĐỔI PASSWORD ngay
#    Browse / import / publish workflow lên community đều work ngay,
#    không cần config gì thêm.`

const QUICK_START_HUB_WIN = `# Windows — PowerShell (KHÔNG dùng CMD/Command Prompt)
# Chạy trong cùng thư mục có docker-compose.yml ở trên

# 1. Sinh secrets random rồi ghi .env
#    L2S_CLUSTER_TOKEN được dùng làm contributor identity — backend tự đăng ký
#    lên L2SC community lúc startup, KHÔNG cần đăng ký account thủ công.
$secret  = python -c "import secrets; print(secrets.token_urlsafe(48))"
$pgpass  = python -c "import secrets; print(secrets.token_urlsafe(24))"
$cluster = python -c "import secrets; print(secrets.token_hex(32))"
$minio   = python -c "import secrets; print(secrets.token_urlsafe(32))"

@"
L2S_SECRET_KEY=$secret
POSTGRES_PASSWORD=$pgpass
L2S_CLUSTER_TOKEN=$cluster
L2S_MINIO_ACCESS_KEY=l2sadmin
L2S_MINIO_SECRET_KEY=$minio
"@ | Out-File -FilePath .env -Encoding ascii -NoNewline

# 2. Pull image + start (lần đầu ~1.4GB)
docker compose up -d

# 3. Mở http://localhost:9996 → admin/admin123 → ĐỔI PASSWORD ngay
#    Browse / import / publish workflow lên community đều work ngay,
#    không cần config gì thêm.`

const QUICK_START_SOURCE_UNIX = `# Linux / macOS — bash / zsh

# 1. Clone repo (cần đạt 183⭐ ở L2SC repo thì L2S source mới mở)
git clone https://github.com/L2SC-LAB/L2S.git
cd L2S

# 2. Chạy start script — tự sinh .env random + build + up
./start.sh

# 3. Mở http://localhost:9996 → admin/admin123 → ĐỔI PASSWORD ngay
#
# Lệnh khác:
#   ./start.sh down     — dừng stack
#   ./start.sh logs     — xem log
#   ./start.sh status   — kiểm tra service`

const QUICK_START_SOURCE_WIN = `# Windows — PowerShell (KHÔNG dùng CMD)

# 1. Clone repo (cần đạt 183 sao ở L2SC repo thì L2S source mới mở)
git clone https://github.com/L2SC-LAB/L2S.git
cd L2S

# 2. Cho phép chạy script PowerShell (1 lần, nếu chưa làm)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 3. Chạy start script — tự sinh .env random + build + up
.\\start.ps1

# 4. Mở http://localhost:9996 → admin/admin123 → ĐỔI PASSWORD ngay`

function InstallL2SSection() {
  const [tab, setTab] = useState<'hub' | 'source'>('hub')
  const [os, setOs] = useState<'unix' | 'win'>('unix')
  const [copied, setCopied] = useState(false)
  const [composeCopied, setComposeCopied] = useState(false)

  const hubCode = os === 'unix' ? QUICK_START_HUB_UNIX : QUICK_START_HUB_WIN
  const sourceCode = os === 'unix' ? QUICK_START_SOURCE_UNIX : QUICK_START_SOURCE_WIN
  const code = tab === 'hub' ? hubCode : sourceCode

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const doCopyCompose = async () => {
    try {
      await navigator.clipboard.writeText(DOCKER_COMPOSE_YML)
      setComposeCopied(true)
      setTimeout(() => setComposeCopied(false), 2000)
    } catch {
      setComposeCopied(false)
    }
  }

  const doDownloadCompose = () => {
    const blob = new Blob([DOCKER_COMPOSE_YML], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'docker-compose.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <section id="install" className="py-24 border-t border-slate-800/50 bg-gradient-to-b from-slate-900/40 to-transparent">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-medium mb-4">
            <Terminal size={12} /> Cài đặt L2S
          </div>
          <h2 className="text-4xl font-bold text-white">Bắt đầu trong 30 giây</h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            L2S chạy trên máy local của bạn — toàn quyền dữ liệu, không upload SaaS bên ngoài.
            Chọn 1 trong 2 cách dưới.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700 rounded-lg">
            <button
              onClick={() => setTab('hub')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'hub'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package size={14} />
              Pull image (recommend)
            </button>
            <button
              onClick={() => setTab('source')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                tab === 'source'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Github size={14} />
              From source (Nếu đủ 183 sao)
            </button>
          </div>
        </div>

        {/* docker-compose.yml block — chỉ hiện khi tab=hub. Có nút Copy + Download */}
        {tab === 'hub' && (
          <div className="relative bg-slate-950 border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Package size={13} className="text-blue-400" />
                <span className="font-mono">docker-compose.yml</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
                  Bước 1 — copy hoặc download file này vào thư mục mới
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={doDownloadCompose}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white text-xs rounded transition border border-blue-500/40"
                  title="Tải file docker-compose.yml"
                >
                  <Download size={12} />
                  Download .yml
                </button>
                <button
                  onClick={doCopyCompose}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded transition"
                  title="Copy nội dung vào clipboard"
                >
                  {composeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {composeCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="p-5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
              <code>{DOCKER_COMPOSE_YML}</code>
            </pre>
          </div>
        )}

        {/* OS toggle — bash vs PowerShell có cú pháp khác nhau */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-slate-500">
            {tab === 'hub' ? 'Bước 2 — chọn OS để xem đúng cú pháp:' : 'Chọn OS:'}
          </span>
            <div className="inline-flex items-center gap-1 p-0.5 bg-slate-800/60 border border-slate-700 rounded-md">
              <button
                onClick={() => setOs('unix')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  os === 'unix'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Linux / macOS
              </button>
              <button
                onClick={() => setOs('win')}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  os === 'win'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Windows (PowerShell)
              </button>
            </div>
        </div>

        {/* Terminal commands block (sinh .env + start) */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Terminal size={13} />
              <span className="font-mono">
                {os === 'unix' ? 'bash' : 'PowerShell'}
              </span>
              {tab === 'hub' && (
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                  Bước 2 — chạy trong cùng thư mục với compose ở trên
                </span>
              )}
            </div>
            <button
              onClick={doCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded transition"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>

        {/* Pre-requisites + Help */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-2">
              <CheckCircle2 size={14} />
              Yêu cầu hệ thống
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Docker + Docker Compose</li>
              <li>• 4 GB RAM (8 GB nếu dùng LLM/ML)</li>
              <li>• 10 GB disk trống</li>
              <li>• Linux / macOS / Windows (WSL2)</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-2">
              <Shield size={14} />
              Trước khi public
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Đổi password admin ngay</li>
              <li>• Set <code className="text-amber-300">L2S_CORS_ORIGINS</code> domain thật</li>
              <li>• Reverse proxy + HTTPS</li>
              <li>• Xem <code className="text-amber-300">README.md</code> phần checklist</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-medium mb-2">
              <BookOpen size={14} />
              Học tiếp
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• <Link to="/docs" className="text-cyan-300 hover:underline">Docs nodes</Link> — 96 plugin</li>
              <li>• <Link to="/browse" className="text-cyan-300 hover:underline">Browse workflows</Link> mẫu</li>
              <li>• <Link to="/forum" className="text-cyan-300 hover:underline">Forum</Link> hỏi đáp</li>
              <li>
                • <a href={L2S_REPO_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:underline inline-flex items-center gap-1">
                    GitHub <ExternalLink size={10} />
                  </a> — issue / PR
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <a
            href="https://hub.docker.com/r/baphongpine/l2s"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-medium transition"
          >
            <Package size={16} />
            Docker Hub
            <ExternalLink size={13} />
          </a>
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg font-semibold transition shadow-lg shadow-emerald-500/20"
          >
            <BookOpen size={16} />
            Xem docs nodes
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
