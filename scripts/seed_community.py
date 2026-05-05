"""
Seed community demo data cho L2SC:
- 6 contributors realistic (Việt Nam, đa dạng role)
- 12 forum threads (mix Q&A / Tutorial / Showcase / Announcement) + replies
- 8 public workflows (đã approved) với workflow_def thực tế

Idempotent: nếu seed user đã tồn tại thì skip insert, không duplicate.
Chạy:
  docker exec -w /app -e PYTHONPATH=/app l2sc-service python /app/scripts/seed_community.py
"""
import bcrypt
import json
import secrets
import sys
from datetime import datetime, timedelta
from uuid import uuid4

from backend.database import SessionLocal, init_db
from backend import db_models


# ============================================================
# CONTRIBUTORS
# ============================================================

CONTRIBUTORS = [
    {
        "username": "minh.dev",
        "email": "minh.dev@example.com",
        "password": "Minh123!",
        "github_url": "https://github.com/minh-dev",
        "bio": "Full-stack engineer, 5 năm kinh nghiệm Python/React. Đang xây platform low-code cho SME.",
    },
    {
        "username": "linh.analyst",
        "email": "linh.analyst@example.com",
        "password": "Linh123!",
        "github_url": None,
        "bio": "Data analyst tại fintech, dùng L2S để build dashboard hằng tuần. Newbie ML.",
    },
    {
        "username": "tuan.ml",
        "email": "tuan.ml@example.com",
        "password": "Tuan123!",
        "github_url": "https://github.com/tuan-ml",
        "bio": "ML engineer, focus NLP + time series forecasting. Trước làm tại 1 e-commerce VN.",
    },
    {
        "username": "anh.devops",
        "email": "anh.devops@example.com",
        "password": "AnhAnh123!",
        "github_url": "https://github.com/anh-devops",
        "bio": "DevOps senior, chuyên Kubernetes + on-prem cluster. Test L2S cluster mode trên 3 máy LAN.",
    },
    {
        "username": "mai.bi",
        "email": "mai.bi@example.com",
        "password": "MaiMai123!",
        "github_url": None,
        "bio": "BI analyst — convert PowerBI workflow sang L2S để self-host on-prem cho công ty 50 người.",
    },
    {
        "username": "huong.student",
        "email": "huong.student@uni.edu.vn",
        "password": "Huong123!",
        "github_url": "https://github.com/huong-it",
        "bio": "Sinh viên năm 4 ngành Data Science. Học L2S để làm đồ án tốt nghiệp về RAG chatbot.",
    },
]


# ============================================================
# FORUM THREADS
# ============================================================

# Each thread: (category, title, body_md, author_username, replies)
# replies: list of (author_username, body_md)

THREADS = [
    # ===== ANNOUNCEMENTS =====
    (
        "announcement",
        "🎉 L2S Platform — Beta launched! 96 plugins sẵn sàng",
        """Chào mọi người! Sau ~6 tháng dev, L2S Platform đã ra **bản Beta** mở cho cộng đồng trải nghiệm.

## Highlight
- **96 plugins** từ ETL → ML → LLM/RAG → Agent
- **17 LLM providers** (OpenAI, Anthropic, Gemini, Groq, Together, Ollama local…)
- **Cluster mode** — multi-node LAN tự dò nhau qua mDNS
- **Workflow templates** sẵn cho 35 use case phổ biến
- **API Generator** — kéo thả ra REST API có JWT auth + chart dashboard

## Tham gia
- Trang public: https://l2s.demo
- Source: github.com/...
- Forum này 👋

Mong nhận feedback — bug, ý tưởng plugin, template hay workflow showcase đều quý!""",
        "minh.dev",
        [
            ("anh.devops", "Cluster mode hoạt động ngon trên 3 máy của tôi 🚀 mDNS auto-discover gần như zero-config. Đã làm tutorial setup, sẽ post sau."),
            ("linh.analyst", "Quá hữu ích! Mình đang convert workflow Excel sang L2S để team data tự update. Cần hỏi thêm về Postgres connection."),
            ("huong.student", "Đang dùng L2S làm đồ án tốt nghiệp về RAG chatbot. Vector store + LLM agent quá tiện ạ!"),
        ],
    ),
    (
        "announcement",
        "📜 Quy tắc cộng đồng L2SC Forum",
        """Để forum là chỗ thoải mái cho mọi người, vài nguyên tắc cơ bản:

### Được khuyến khích
- ✅ Hỏi cụ thể (kèm log error, screenshot, version L2S)
- ✅ Chia sẻ workflow / template hữu ích
- ✅ Trả lời người mới — kể cả câu hỏi "ngơ"

### Tránh
- ❌ Spam, quảng cáo SaaS không liên quan
- ❌ Post code có chứa API key / password — luôn redact
- ❌ Đăng cùng câu hỏi lên 5 thread khác nhau

### Categories
- **Q&A**: Hỏi đáp kỹ thuật
- **Tutorial**: Hướng dẫn step-by-step
- **Showcase**: Khoe workflow / dự án real-world
- **Announcement**: Release notes, sự kiện

Vi phạm sẽ bị admin lock thread. Cảm ơn mọi người 🙏""",
        "minh.dev",
        [],
    ),

    # ===== Q&A =====
    (
        "qa",
        "Workflow đang chạy thì PostgreSQL connection refused — fix sao?",
        """Mình config postgres_query node với:
- host: `localhost`
- port: `5432`
- user: `postgres`

L2S chạy trong Docker, Postgres cũng trong Docker (compose riêng). Khi run workflow báo:

```
psycopg2.OperationalError: could not connect to server: Connection refused
        Is the server running on host "localhost" (127.0.0.1) and accepting
        TCP/IP connections on port 5432?
```

Đã thử ping được host của postgres. Có ai gặp tương tự không?""",
        "linh.analyst",
        [
            ("anh.devops", "L2S container không thấy `localhost` của host — `localhost` trong container = chính nó. Đổi `host` thành `host.docker.internal` (Mac/Win) hoặc IP LAN của host (Linux). Hoặc đưa Postgres vào cùng Docker network."),
            ("minh.dev", "@anh.devops nói đúng. Cách đơn giản nhất nếu L2S + Postgres cùng `docker compose`: dùng tên service làm host (vd: `postgres` thay vì `localhost`). Docker DNS sẽ resolve."),
            ("linh.analyst", "Cảm ơn cả hai! Đổi sang `host.docker.internal` thì work ngay 🎉 Sẽ note lại để tránh lần sau."),
        ],
    ),
    (
        "qa",
        "LLM Chat node timeout sau 30s — chỉnh được không?",
        """Mình dùng `llm_chat` với prompt khá dài (~3000 tokens) + Claude Sonnet. Mỗi lần chạy tới node này thì sau 30s báo timeout.

Đã set `max_tokens=4096` nhưng vẫn vậy. Có config global timeout ở đâu không?""",
        "huong.student",
        [
            ("tuan.ml", "Có 2 timeout cần phân biệt:\n\n1. **HTTP timeout** trong `llm_chat`: mặc định 60s. Mở Advanced Config → `request_timeout: 120` (giây).\n2. **Plugin timeout** ở workflow engine: mặc định 1800s, hiếm hit.\n\nCheck error message — nếu là `httpx.ReadTimeout` thì là (1). Nếu `WorkflowExecutionTimeout` mới là (2)."),
            ("huong.student", "Đúng là (1). Set `request_timeout: 180` xong work liền. Cảm ơn anh!"),
        ],
    ),
    (
        "qa",
        "Upload Excel có 5 sheet — node File Reader chỉ đọc sheet 1, làm sao chọn sheet khác?",
        """File `bao_cao_q4.xlsx` có:
- Sheet "Tóm tắt"
- Sheet "Doanh thu"
- Sheet "Chi phí"
- Sheet "Nhân sự"
- Sheet "Notes"

Mình muốn workflow đọc sheet "Doanh thu". File Reader hiện default sheet 1.""",
        "mai.bi",
        [
            ("minh.dev", "File Reader có field `sheet_name` trong config (textbox). Default rỗng = sheet đầu. Set `Doanh thu` (giữ nguyên dấu) thì OK.\n\nNếu muốn merge nhiều sheet: kéo nhiều File Reader → Concat DataFrames node."),
            ("mai.bi", "Tìm thấy field rồi, thanks! Workflow giờ đọc đúng sheet. Sẽ thử Concat cho báo cáo tổng hợp."),
        ],
    ),
    (
        "qa",
        "MinIO bucket bị 'AccessDenied' khi workflow ghi artifact",
        """Restart L2S xong workflow nào cũng fail ở step ghi artifact:

```
botocore.exceptions.ClientError: An error occurred (AccessDenied) when calling the PutObject operation
```

`L2S_MINIO_ACCESS_KEY` + `L2S_MINIO_SECRET_KEY` trong .env vẫn match container. Trước reset thì work bình thường.""",
        "anh.devops",
        [
            ("anh.devops", "Tự reply: hoá ra MinIO data volume bị xoá lúc `docker compose down -v`. Bucket `l2s-artifacts` mất → MinIO ko auto-create. Fix: vào MinIO Console (port 9998) → Buckets → Create `l2s-artifacts`. Hoặc set `L2S_MINIO_AUTO_CREATE_BUCKET=true` trong .env."),
            ("minh.dev", "Đã ghi vào TODO add auto-create flag mặc định. Bug cũ làm ai dùng `down -v` xong đều dính."),
        ],
    ),
    (
        "qa",
        "Cluster worker không join được coordinator dù cùng LAN",
        """Coordinator chạy ở 192.168.1.10:9995, worker ở 192.168.1.20. Cả 2 cùng wifi.

Worker log:
```
[mdns] Browse started — searching _l2s._tcp.local.
[mdns] No coordinator found after 30s
```

Đã check firewall mở port 5353/UDP. Có ai bị chưa?""",
        "anh.devops",
        [
            ("minh.dev", "mDNS bị block ở vài router consumer (TP-Link, Tenda hay filter multicast). Workaround: set thẳng `L2S_COORDINATOR_URL=http://192.168.1.10:9995` trong env worker thay vì auto-discover. Cluster vẫn work, chỉ bỏ qua bước dò."),
            ("anh.devops", "✓ Set URL thủ công thì worker join sau 5s. Confirm router của tôi (Mikrotik) có rule drop multicast — đã whitelist 224.0.0.251/5353. Nếu user dùng router cùi nên dùng cách thủ công."),
        ],
    ),

    # ===== TUTORIAL =====
    (
        "tutorial",
        "Build RAG chatbot trong 15 phút với L2S — full guide",
        """Hướng dẫn này: từ con số 0 → chatbot trả lời câu hỏi dựa trên 1 PDF dài 200 trang.

## Yêu cầu
- L2S đã chạy (`./start.sh`)
- 1 file PDF (vd: tài liệu nội bộ công ty)
- OpenAI API key (hoặc Ollama local)

## Bước 1: Index PDF (5 phút)
1. Tạo workflow mới tên `RAG Indexing`
2. Kéo nodes:
   - **File Upload** — chọn PDF
   - **Document Loader** (RAG category) — auto-detect PDF
   - **Text Chunker** — chunk_size=1000, overlap=200
   - **Embedding Generate** — provider: `openai`, model: `text-embedding-3-small`
   - **Vector Store Write** — collection: `my-docs`

3. Run flow → chờ 30-60s tuỳ PDF size.

## Bước 2: Chatbot query (5 phút)
Workflow mới `RAG Chatbot`:
- **Trigger** (chat input)
- **Vector Search** — collection: `my-docs`, top_k=5
- **Prompt Template**: `"Dựa vào context: {{context}}\\nCâu hỏi: {{question}}"`
- **LLM Chat** — provider: `openai`, model: `gpt-4o-mini`
- **Telegram Send** (hoặc Webhook return cho UI)

## Bước 3: Test (5 phút)
Run workflow với câu hỏi mẫu. Nếu trả lời sai context → check chunk size (giảm 500), top_k (tăng 10).

## Tips
- Bilingual: dùng `text-embedding-3-large` (đắt hơn nhưng VN/EN tốt)
- Latency: switch sang Ollama (`nomic-embed-text` + `llama3.1:8b`) → 100% local, free
- Re-rank: thêm node **RAG Rerank** sau Vector Search để tăng accuracy 10-15%

Anyone tried? Share kết quả của bạn nhé!""",
        "tuan.ml",
        [
            ("huong.student", "Đúng cái em đang tìm cho đồ án ạ! Đã thử với tài liệu 80 trang về luật, accuracy ~75% với top_k=5. Tăng lên top_k=10 + rerank thì lên ~88%. Anh có tip giảm hallucination không?"),
            ("tuan.ml", "Tăng `temperature=0`, dùng prompt explicit kiểu `\"Chỉ trả lời dựa vào context. Nếu không có thông tin, nói 'Tôi không biết'\"`. Combine với cite source (in chunk metadata vào prompt)."),
            ("minh.dev", "Tutorial chuẩn 👍 Mình sẽ link vào docs section RAG."),
        ],
    ),
    (
        "tutorial",
        "Tối ưu workflow ML training: giảm 60% thời gian với batch + caching",
        """Trước đây workflow ML train mỗi lần chạy mất 12 phút. Sau optimize còn 4.5 phút. Chia sẻ technique:

### 1. Cache feature engineering
Workflow gốc:
```
File Reader → Drop NA → Fill NA → Scale → One-hot → Train
```
Mỗi lần thay model phải chạy lại 5 step preprocessing → lãng phí.

**Fix**: Tách thành 2 workflow:
- WF1: `Preprocessing` — output Parquet vào MinIO `processed/v1.parquet`
- WF2: `Training` — đọc parquet đó, train.

Train 5 model khác nhau → preprocessing chỉ chạy 1 lần.

### 2. Batch upload thay vì 1-by-1
Sai: kéo 50 File Reader cho 50 file CSV → workflow chậm.
Đúng: 1 File Reader với glob pattern `data/*.csv` (đã support trong v0.9+) → đọc song song.

### 3. Reuse embedding cache cho RAG
Vector Store Write có flag `skip_existing=true` — chỉ embed chunk mới. 1M docs initial 4h, mỗi update sau ~5 phút.

### 4. Spark Transform thay duckdb_sql cho dataset > 50GB
Dataset lớn duckdb_sql vẫn fit được nhưng GC pause. Spark Transform với 4 executor giảm 70% thời gian.

Anyone có tip khác?""",
        "tuan.ml",
        [
            ("anh.devops", "Add #5: dùng Vector Store HNSW index thay vì IVF — query latency giảm 10x cho >100k docs. Trade-off là memory cao hơn 30%."),
            ("mai.bi", "Tách workflow là bước đổi đời, mình hồi xưa cứ train + preprocess chung → debug khổ. Mỗi WF 1 trách nhiệm rõ."),
        ],
    ),
    (
        "tutorial",
        "Setup L2S cluster mode trên 3 máy LAN — full walkthrough",
        """Thử setup cluster với 1 coordinator + 2 worker. Note lại để ai cần tham khảo.

## Hardware
- Coordinator: 8 cores / 16GB / Ubuntu 22.04
- Worker 1: 4 cores / 8GB / Ubuntu 22.04
- Worker 2: 4 cores / 8GB / Mac Mini M2

## Bước 1: Coordinator
```bash
git clone <repo> L2S && cd L2S
./start.sh cluster
```
Output:
```
✓ L2S đã khởi động (cluster coordinator)
LAN IP: 192.168.1.10
Cluster token: a8f3d9c2b1e5...
```

Note lại 2 thứ: **LAN IP** + **token**.

## Bước 2: Worker
Trên mỗi máy worker:
```bash
git clone <repo> L2S && cd L2S
L2S_COORDINATOR_URL=http://192.168.1.10:9995 \\
L2S_CLUSTER_TOKEN=a8f3d9c2b1e5... \\
./start.sh worker
```

Worker sẽ tự đăng ký vào coordinator.

## Bước 3: Verify
Vào UI coordinator → Header → click badge "Cluster (3 nodes)" → list:
- node-coord-... (coordinator)
- node-worker1-... (LAN 192.168.1.20)
- node-worker2-... (LAN 192.168.1.21)

## Tag node để dispatch theo capability
Worker với GPU: set `L2S_NODE_TAGS=gpu,ml` trong env. Plugin có `required_tags=["gpu"]` sẽ chỉ dispatch về node đó.

## Troubleshoot
- mDNS không thấy: dùng `L2S_COORDINATOR_URL` thủ công (xem thread khác)
- Worker offline sau N phút: tăng `L2S_HEARTBEAT_TIMEOUT=60` (default 30)

## Performance
Cluster 3 node với 16 workflow concurrent: throughput tăng 2.7x so với solo. Latency mỗi WF tương đương.""",
        "anh.devops",
        [
            ("minh.dev", "👏 Tutorial chuẩn. Sẽ pin thread này. Có thể thêm section so sánh `solo vs cluster` khi nào nên upgrade?"),
            ("tuan.ml", "Setup multiple GPU workers cho ML training là use case ngon. Thử 2 RTX 4090 — train ResNet50 trên ImageNet giảm từ 4h xuống 2.2h."),
        ],
    ),

    # ===== SHOWCASE =====
    (
        "showcase",
        "🎯 Phân tích sentiment 100k posts Facebook fanpage — workflow full",
        """Build cho 1 brand thời trang. Mỗi tuần crawl posts + comment, classify sentiment, gửi report Slack.

## Architecture
```
Facebook Posts (Reddit-like crawl)  →  Filter (remove spam)
            ↓                                    ↓
       Text Vectorize ─────────→  LLM Structured (sentiment + topic + intent)
                                        ↓
                              PostgreSQL Write (lưu kết quả)
                                        ↓
                              DuckDB SQL (aggregate by date/topic)
                                        ↓
                              Chart Plotly (3 chart: trend / topic distribution / hot posts)
                                        ↓
                              Slack Send (gửi summary + link dashboard)
```

## Stats
- 100k posts/tuần processed
- LLM cost: ~$2.5/tuần (gpt-4o-mini, batch 10 posts/call)
- Latency: 45 phút end-to-end
- Schedule: Sunday 23:00 (cron)

## Insights team marketing dùng
- Top 3 topic phàn nàn → input vào sprint Customer Care
- Sentiment trend tuần qua tuần → KPI manager
- Hot post (engagement >1000) → boost ads target audience tương tự

## Workflow JSON
~150 LOC. Đã publish lên L2SC (search "facebook-sentiment-pipeline").

## Lesson learned
- Đừng dùng GPT-4 full cho task này — overkill, gpt-4o-mini đủ
- Filter spam TRƯỚC khi gọi LLM — tiết kiệm 30% cost
- Cache LLM result theo hash post_id → re-run miễn phí

AMA!""",
        "tuan.ml",
        [
            ("mai.bi", "Workflow đẹp! Mình copy pattern này cho 3 fanpage F&B của khách hàng. LLM cost ~$5/fanpage/tháng — quá rẻ so với manual."),
            ("linh.analyst", "Mình muốn áp dụng cho TikTok comments thay Facebook. Cần đổi crawler thôi đúng không? Phần sau (LLM + chart) reuse 100%?"),
            ("tuan.ml", "@linh.analyst đúng rồi. Replace node `reddit_fetch` (mình dùng vì FB blocked nên scrape qua reddit-style) bằng twitter_search hoặc custom scraper. Pipeline sau giống hệt."),
        ],
    ),
    (
        "showcase",
        "📊 Tự động hoá báo cáo tuần: Postgres → DuckDB → LLM Summary → Slack",
        """Workflow chạy mỗi sáng thứ Hai 7h, gửi báo cáo tuần qua Slack cho CEO.

## Flow
1. **PostgreSQL Query** — pull data 7 ngày gần nhất từ 4 bảng (orders, users, refunds, support_tickets)
2. **DuckDB SQL** — JOIN + aggregate (revenue, AOV, refund rate, ticket volume)
3. **LLM Chat** — prompt: `"Viết báo cáo executive summary 200 từ dựa trên data: {{json}}"`
4. **Chart Plotly** — line chart revenue + bar chart top products
5. **Slack Send** — post vào channel `#weekly-report`

## Output sample
```
📈 Báo cáo tuần W42 (15-21/10)

Doanh thu: 2.1B VND (+12% vs W41)
Đơn hàng: 1,840 (AOV ~1.14M VND)
Refund rate: 3.2% (giảm từ 4.1% — improvement nhờ QA process mới)
Top product: Áo polo nam basic (340 đơn)
Tickets: 67 (avg response 3.2h, SLA 4h ✓)

⚠ Cảnh báo: Inventory áo size XL còn <50 cái, restock trước W44
```

## Setup time
- WF: 2.5 giờ design + test
- Maintenance: 0 (chạy stable 6 tháng rồi)

## Tiết kiệm
Trước manual analyst làm 4h/tuần → giờ 0. ROI ngay tuần đầu.""",
        "mai.bi",
        [
            ("minh.dev", "Đây là use case tôi mong nhất khi build L2S! \"Replace Excel macro hằng tuần\". Mời chị viết detail tutorial luôn được không?"),
            ("anh.devops", "Schedule node của L2S chạy ổn định bao lâu rồi? Có miss run lần nào chưa?"),
            ("mai.bi", "@anh.devops 6 tháng, miss 2 lần do server reboot OS update. Đã add health check Slack ping mỗi run."),
        ],
    ),
    (
        "showcase",
        "🤖 AutoML Kaggle Titanic — accuracy 0.82 trong 30 giây",
        """Test L2S AutoML node trên dataset Kaggle Titanic (đồ án thực hành).

## Workflow (4 nodes!)
1. **File Reader** — train.csv (Kaggle dataset)
2. **Drop NA** — drop column Cabin
3. **AutoML Train** — target: `Survived`, time_budget: 30s
4. **Model Evaluate** — metric: accuracy + ROC AUC

## Kết quả
- AutoML thử 6 model: LogisticReg, RandomForest, XGBoost, LightGBM, MLP, StackingEnsemble
- Best: **Stacking** với accuracy **0.823**, AUC **0.879**
- Training: 28 giây total

## So với manual
Trước em làm bằng tay (Jupyter): 3 ngày, accuracy 0.81. AutoML 30s ngang bằng. Đáng để baseline.

## Code/workflow
Em đã publish lên L2SC: search "titanic-automl-baseline".

## Đặt câu hỏi
- Có tip nào ép AutoML thử feature engineering không? (vd: tạo IsAlone, Title)""",
        "huong.student",
        [
            ("tuan.ml", "AutoML sẽ tự thử some feature engineering basic (one-hot, scale). Để custom: add node **Datetime Features** + **One-Hot Encode** trước AutoML, AutoML sẽ pick từ feature đã có. Workflow lên 6 nodes nhưng score thường +2-5%."),
            ("minh.dev", "Nice! 0.823 với 30s là baseline tốt. Title feature có thể đẩy lên 0.84+. Em thử share workflow updated nhé."),
        ],
    ),
    (
        "showcase",
        "Real-time stock dashboard với ClickHouse simulation + Plotly",
        """Build cho 1 quỹ đầu tư cá nhân — dashboard cập nhật giá 30 stocks mỗi 5 phút.

## Stack
- **Scheduled API** — gọi Yahoo Finance API mỗi 5 phút
- **ClickHouse** simulation (DuckDB backend) — store ticks
- **DuckDB SQL** — calculate MA(20), RSI, volume change
- **Chart Plotly** — candlestick + indicators
- **API Generator** — expose endpoint `/api/gen/stocks/_chart/...` cho FE riêng

## Tại sao ClickHouse sim thay vì thật?
- Solo dev, không muốn maintain ClickHouse cluster
- DuckDB analytical SQL gần tương đương cho dataset <10GB
- Migrate sang ClickHouse thật khi cần scale — chỉ đổi connection string

## Performance
- 30 stocks × 12 ticks/h × 24h = 8,640 ticks/ngày
- Query MA + RSI cho 30 stocks: <100ms
- Chart render: <200ms

## Demo
https://l2s-stock.demo (API behind JWT auth, screenshots)

Plan tiếp: thêm sentiment analysis tin tức tài chính, alert khi cross threshold.""",
        "anh.devops",
        [
            ("tuan.ml", "Sentiment news là combo classic. Recommend dataset financial-phrasebank để fine-tune sentiment cho domain chứng khoán — accuracy nhảy 10% so với general model."),
        ],
    ),
]


# ============================================================
# PUBLIC WORKFLOWS (8 — đa dạng category)
# ============================================================

def _wf_def(nodes, edges):
    """Build workflow_def JSON tương thích L2S format."""
    return {"nodes": nodes, "edges": edges}


def _node(node_id, plugin_type, x, y, label, config=None):
    return {
        "id": node_id,
        "type": plugin_type,
        "position": {"x": x, "y": y},
        "data": {"label": label, "config": config or {}},
    }


def _edge(eid, source, target, src_handle="output", tgt_handle="input"):
    return {
        "id": eid,
        "source": source,
        "target": target,
        "sourceHandle": src_handle,
        "targetHandle": tgt_handle,
    }


WORKFLOWS = [
    {
        "title": "CSV → Chart trong 30 giây",
        "description": "Workflow đơn giản nhất: upload CSV, query SQL, vẽ chart. Phù hợp người mới.",
        "category": "data",
        "tags": ["beginner", "csv", "chart"],
        "contributor": "linh.analyst",
        "star_count": 47,
        "call_count": 312,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "file_reader", 100, 200, "Đọc CSV"),
                _node("n2", "duckdb_sql", 400, 200, "SQL aggregate", {"query": "SELECT category, SUM(amount) total FROM input GROUP BY category"}),
                _node("n3", "chart_plotly", 700, 200, "Bar chart", {"chart_type": "bar", "x_col": "category", "y_col": "total"}),
            ],
            edges=[
                _edge("e1", "n1", "n2"),
                _edge("e2", "n2", "n3"),
            ],
        ),
    },
    {
        "title": "AutoML Tabular — thử 6 model trong 30s",
        "description": "Upload CSV → AutoML thử RandomForest/XGBoost/LightGBM/MLP/Stacking → trả model tốt nhất + metrics.",
        "category": "ml",
        "tags": ["automl", "classification", "kaggle"],
        "contributor": "tuan.ml",
        "star_count": 89,
        "call_count": 521,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "file_reader", 100, 200, "Đọc dataset"),
                _node("n2", "drop_na", 350, 200, "Drop NA"),
                _node("n3", "automl_train", 600, 200, "AutoML 30s", {"target_column": "target", "time_budget": 30}),
                _node("n4", "model_evaluate", 850, 200, "Metrics", {"target_column": "target"}),
            ],
            edges=[_edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"), _edge("e3", "n3", "n4")],
        ),
    },
    {
        "title": "RAG Chatbot — index PDF + chat",
        "description": "Document Loader → Chunker → Embedding → Vector Store. Tutorial pin trên forum, copy là chạy.",
        "category": "ml",
        "tags": ["rag", "llm", "chatbot", "vector-search"],
        "contributor": "tuan.ml",
        "star_count": 134,
        "call_count": 892,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "document_loader", 100, 200, "Load PDF"),
                _node("n2", "text_chunker", 350, 200, "Chunk 1000/200", {"chunk_size": 1000, "overlap": 200}),
                _node("n3", "embedding_generate", 600, 200, "Embed", {"provider": "openai", "model": "text-embedding-3-small"}),
                _node("n4", "vector_store_write", 850, 200, "Vector store"),
            ],
            edges=[_edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"), _edge("e3", "n3", "n4")],
        ),
    },
    {
        "title": "Facebook Sentiment Pipeline — 100k posts/tuần",
        "description": "Crawl Reddit-style → LLM structured (sentiment + topic) → Postgres → DuckDB aggregate → Slack report.",
        "category": "automation",
        "tags": ["llm", "social-media", "sentiment", "slack"],
        "contributor": "tuan.ml",
        "star_count": 76,
        "call_count": 234,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "reddit_fetch", 100, 200, "Crawl posts"),
                _node("n2", "filter_rows", 350, 200, "Remove spam"),
                _node("n3", "llm_structured", 600, 200, "Sentiment + topic", {"provider": "openai", "model": "gpt-4o-mini"}),
                _node("n4", "postgres_write", 850, 200, "Save to DB"),
                _node("n5", "duckdb_sql", 600, 400, "Aggregate"),
                _node("n6", "slack_send", 850, 400, "Send Slack"),
            ],
            edges=[
                _edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"), _edge("e4", "n4", "n5"),
                _edge("e5", "n5", "n6"),
            ],
        ),
    },
    {
        "title": "Báo cáo tuần auto — Postgres + LLM Summary + Slack",
        "description": "Cron mỗi thứ Hai 7h: query DB → DuckDB aggregate → LLM viết summary 200 từ → chart → Slack channel.",
        "category": "automation",
        "tags": ["scheduled", "report", "llm-summary", "slack"],
        "contributor": "mai.bi",
        "star_count": 58,
        "call_count": 189,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "trigger", 100, 200, "Cron Mon 7am"),
                _node("n2", "postgres_query", 350, 200, "Pull 7d data", {"query": "SELECT * FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'"}),
                _node("n3", "duckdb_sql", 600, 200, "Aggregate KPIs"),
                _node("n4", "llm_chat", 850, 200, "Executive summary"),
                _node("n5", "chart_plotly", 600, 400, "Revenue chart"),
                _node("n6", "slack_send", 1100, 200, "Post to channel"),
            ],
            edges=[
                _edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"), _edge("e4", "n3", "n5"),
                _edge("e5", "n4", "n6"),
            ],
        ),
    },
    {
        "title": "Time Series Forecast — doanh số 30 ngày tới",
        "description": "Đọc data lịch sử → Datetime features → LSTM forecast 30 ngày → chart actual vs predicted.",
        "category": "ml",
        "tags": ["forecast", "lstm", "time-series"],
        "contributor": "tuan.ml",
        "star_count": 63,
        "call_count": 178,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "file_reader", 100, 200, "Đọc data"),
                _node("n2", "datetime_features", 350, 200, "Extract dow/month"),
                _node("n3", "lstm_forecast", 600, 200, "LSTM 30d", {"date_column": "date", "value_column": "revenue", "horizon": 30}),
                _node("n4", "chart_plotly", 850, 200, "Forecast chart"),
            ],
            edges=[_edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"), _edge("e3", "n3", "n4")],
        ),
    },
    {
        "title": "Stock Dashboard real-time — ClickHouse + Plotly",
        "description": "Mỗi 5 phút pull giá Yahoo Finance → ClickHouse store → MA20 + RSI → candlestick chart.",
        "category": "data",
        "tags": ["finance", "real-time", "dashboard"],
        "contributor": "anh.devops",
        "star_count": 42,
        "call_count": 95,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "scheduled_api", 100, 200, "Yahoo Finance every 5m", {"url": "https://query1.finance.yahoo.com/v8/finance/chart/AAPL", "interval_seconds": 300}),
                _node("n2", "clickhouse", 350, 200, "Store ticks", {"operation": "insert"}),
                _node("n3", "duckdb_sql", 600, 200, "Calc MA + RSI"),
                _node("n4", "chart_plotly", 850, 200, "Candlestick chart", {"chart_type": "candlestick"}),
            ],
            edges=[_edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"), _edge("e3", "n3", "n4")],
        ),
    },
    {
        "title": "Image Classification CNN — train trên dataset upload",
        "description": "Upload zip ảnh → auto detect class folders → CNN train → predict + confusion matrix.",
        "category": "ml",
        "tags": ["computer-vision", "cnn", "classification"],
        "contributor": "huong.student",
        "star_count": 31,
        "call_count": 87,
        "workflow_def": _wf_def(
            nodes=[
                _node("n1", "image_loader", 100, 200, "Load zip"),
                _node("n2", "image_dataset_prep", 350, 200, "Train/val split"),
                _node("n3", "cnn_train", 600, 200, "CNN 10 epochs", {"epochs": 10}),
                _node("n4", "image_predict", 850, 200, "Predict test"),
                _node("n5", "model_evaluate", 1100, 200, "Confusion matrix"),
            ],
            edges=[
                _edge("e1", "n1", "n2"), _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"), _edge("e4", "n4", "n5"),
            ],
        ),
    },
]


# ============================================================
# SEED LOGIC
# ============================================================

def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def seed_contributors(db) -> dict:
    """Tạo contributors. Return dict {username: contributor_id}."""
    print("\n=== Seeding contributors ===")
    out = {}
    for c in CONTRIBUTORS:
        existing = db.query(db_models.Contributor).filter(
            db_models.Contributor.username == c["username"]
        ).first()
        if existing:
            print(f"  ↻ {c['username']} đã tồn tại — skip")
            out[c["username"]] = existing.id
            continue
        new_c = db_models.Contributor(
            id=str(uuid4()),
            username=c["username"],
            email=c["email"],
            api_key=f"l2sc_demo_{secrets.token_urlsafe(20)}",
            hashed_password=hash_password(c["password"]),
            github_url=c["github_url"],
            bio=c["bio"],
            is_active=True,
            is_admin=False,
        )
        db.add(new_c)
        db.flush()
        out[c["username"]] = new_c.id
        print(f"  + {c['username']} (password: {c['password']})")
    db.commit()
    return out


def seed_threads(db, contrib_ids: dict) -> int:
    """Tạo forum threads + replies. Return total threads."""
    print("\n=== Seeding forum threads ===")
    created = 0
    base_time = datetime.utcnow() - timedelta(days=14)

    for i, (category, title, body, author, replies) in enumerate(THREADS):
        existing = db.query(db_models.ForumThread).filter(
            db_models.ForumThread.title == title
        ).first()
        if existing:
            print(f"  ↻ Thread '{title[:40]}...' đã tồn tại — skip")
            continue

        # Spread thread create time over 14 days, oldest first
        thread_time = base_time + timedelta(hours=i * 18)
        # Set is_pinned for announcements
        is_pinned = category == "announcement"

        thread = db_models.ForumThread(
            id=str(uuid4()),
            title=title,
            body_md=body,
            category=category,
            author_id=contrib_ids[author],
            is_pinned=is_pinned,
            is_locked=False,
            view_count=20 + (i * 13) % 200,   # varied 20-220
            reply_count=len(replies),
            created_at=thread_time,
            updated_at=thread_time,
        )
        db.add(thread)
        db.flush()

        # Replies — 1h apart
        for j, (reply_author, reply_body) in enumerate(replies):
            reply_time = thread_time + timedelta(hours=2 + j * 3)
            r = db_models.ForumReply(
                id=str(uuid4()),
                thread_id=thread.id,
                body_md=reply_body,
                author_id=contrib_ids[reply_author],
                created_at=reply_time,
                updated_at=reply_time,
            )
            db.add(r)
            # Update thread updated_at to last reply
            thread.updated_at = reply_time

        created += 1
        print(f"  + [{category:12s}] {title[:55]}{'...' if len(title) > 55 else ''} ({len(replies)} replies)")

    db.commit()
    return created


def seed_workflows(db, contrib_ids: dict) -> int:
    """Tạo public workflows đã approved."""
    print("\n=== Seeding public workflows ===")
    created = 0
    base_time = datetime.utcnow() - timedelta(days=30)

    for i, w in enumerate(WORKFLOWS):
        existing = db.query(db_models.PublicWorkflow).filter(
            db_models.PublicWorkflow.title == w["title"]
        ).first()
        if existing:
            print(f"  ↻ '{w['title'][:40]}...' đã tồn tại — skip")
            continue

        wf_time = base_time + timedelta(days=i * 3)
        wf = db_models.PublicWorkflow(
            id=str(uuid4()),
            public_token=f"demo-{secrets.token_urlsafe(8)}",
            title=w["title"],
            description=w["description"],
            category=w["category"],
            tags=w["tags"],
            workflow_def=w["workflow_def"],
            contributor_id=contrib_ids[w["contributor"]],
            node_id=None,
            l2s_workflow_id=None,
            is_approved=True,    # All seed workflows pre-approved
            is_rejected=False,
            is_active=True,
            version="1.0.0",
            call_count=w["call_count"],
            star_count=w["star_count"],
            created_at=wf_time,
            updated_at=wf_time + timedelta(days=1),
        )
        db.add(wf)
        created += 1
        print(f"  + [{w['category']:11s}] {w['title']:50s} ⭐{w['star_count']} ▶{w['call_count']}")

    db.commit()
    return created


def main():
    print("=" * 60)
    print("  L2SC Community Seed — demo data cho launch")
    print("=" * 60)

    init_db()
    db = SessionLocal()
    try:
        contrib_ids = seed_contributors(db)
        n_threads = seed_threads(db, contrib_ids)
        n_workflows = seed_workflows(db, contrib_ids)

        # Stats summary
        print("\n=== Tổng kết ===")
        total_contrib = db.query(db_models.Contributor).count()
        total_threads = db.query(db_models.ForumThread).count()
        total_replies = db.query(db_models.ForumReply).count()
        total_wf = db.query(db_models.PublicWorkflow).count()
        print(f"  Contributors: {total_contrib} (seed thêm {len(contrib_ids)})")
        print(f"  Forum threads: {total_threads} (mới: {n_threads})")
        print(f"  Forum replies: {total_replies}")
        print(f"  Public workflows: {total_wf} (mới: {n_workflows})")
        print()
        print("Test login với 1 trong 6 user demo (password trong CONTRIBUTORS dict):")
        for c in CONTRIBUTORS:
            print(f"  {c['username']:18s} / {c['password']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
