# 🌐 L2SC — Community space cho L2S

> **L2SC** (L2S Communicate) là nơi cộng đồng người dùng L2S **share workflow, hỏi đáp, đọc docs** plugin. Đây không phải app để tự host — bạn truy cập trực tiếp tại **[l2s.io.vn](https://l2s.io.vn)**.

Repo này chứa source code của community space (frontend + backend FastAPI). Phát triển công khai để mọi người contribute thread forum, workflow public, plugin docs.

---

## Giới thiệu L2S — sản phẩm chính

**L2S** là platform **low-code Data + AI** mã nguồn mở:

- 🎨 Build workflow Data / ML / AI bằng kéo-thả — không cần code
- 🤖 17 LLM providers (OpenAI, Anthropic, Gemini, Groq, Ollama local…)
- 📊 96 plugins ETL, ML, RAG, Agent, Visualization, Integration
- ⚡ Self-host on-prem, multi-user RBAC 4-level
- 🌐 Cluster mode multi-node LAN (mDNS auto-discovery)

**Đối tượng**: SME, startup, lab nghiên cứu — thay thế bộ Databricks + n8n + Zapier.

→ **Docker image**: [`baphongpine/l2s`](https://hub.docker.com/r/baphongpine/l2s) (multi-arch amd64/arm64).

---

## 🚀 Cách cài L2S (chạy local)

Hướng dẫn đầy đủ tại **[Docker Hub overview](https://hub.docker.com/r/baphongpine/l2s)**. Tóm tắt 3 bước:

### Bước 1 — Tạo file `docker-compose.yml`

Tạo thư mục mới, file `docker-compose.yml` với nội dung:

```yaml
services:
  l2s:
    image: baphongpine/l2s:latest
    container_name: l2s-platform
    restart: unless-stopped
    ports:
      - "9996:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/l2s_platform
      - REDIS_URL=redis://redis:6379/0
      - L2S_SECRET_KEY=${L2S_SECRET_KEY}
      - L2S_MINIO_ENDPOINT=minio:9000
      - L2S_MINIO_ACCESS_KEY=${L2S_MINIO_ACCESS_KEY}
      - L2S_MINIO_SECRET_KEY=${L2S_MINIO_SECRET_KEY}
      - L2S_CLUSTER_TOKEN=${L2S_CLUSTER_TOKEN}
      # L2SC community auto-connect: backend tự register node lên hub
      # bằng L2S_CLUSTER_TOKEN — KHÔNG cần đăng ký account thủ công.
      - L2SC_URL=https://service.l2s.io.vn
      - L2SC_WEB_URL=https://l2s.io.vn
      - L2S_PUBLIC_URL=${L2S_PUBLIC_URL:-}
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
      minio: { condition: service_healthy }
    volumes:
      - plugin_deps:/plugin_deps
      - vector_stores:/app/vector_stores
      - agent_memory:/app/agent_memory
      - /var/run/docker.sock:/var/run/docker.sock
    privileged: true
    mem_limit: 4g

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?required}
      - POSTGRES_DB=l2s_platform
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "PGPASSWORD=$$POSTGRES_PASSWORD psql -U postgres -d l2s_platform -c 'SELECT 1' || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  minio:
    image: minio/minio:latest
    ports: ["9998:9001"]
    environment:
      - MINIO_ROOT_USER=${L2S_MINIO_ACCESS_KEY:-l2sadmin}
      - MINIO_ROOT_PASSWORD=${L2S_MINIO_SECRET_KEY}
    volumes: [minio_data:/data]
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s

volumes:
  postgres_data:
  redis_data:
  minio_data:
  plugin_deps:
  vector_stores:
  agent_memory:
```

### Bước 2 — Sinh `.env` random secrets

**Linux / macOS** (bash / zsh):

```bash
cat > .env <<EOF
L2S_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
L2S_CLUSTER_TOKEN=$(python3 -c "import secrets; print(secrets.token_hex(32))")
L2S_MINIO_ACCESS_KEY=l2sadmin
L2S_MINIO_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
EOF
chmod 600 .env
```

**Windows** (PowerShell — KHÔNG dùng CMD/Command Prompt):

```powershell
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
```

### Bước 3 — Start

```bash
docker compose up -d
```

Sau ~30 giây mở http://localhost:9996, login `admin / admin123` → **đổi password ngay** (Admin Panel → Users).

### Update version

```bash
docker compose pull
docker compose up -d
```

---

## 📤 Cách push (publish) workflow lên L2SC community

> 🎉 **Không cần đăng ký account thủ công.** L2S backend tự register lên hub
> ngay lúc khởi động (dùng `L2S_CLUSTER_TOKEN` làm identity), idempotent qua
> nhiều lần restart. Cài xong là publish được liền.

### Publish workflow từ UI L2S

1. Mở workflow muốn share, click nút **Share** (góc phải trên)
2. Chọn tab **Community** (bên cạnh tab Users)
3. Điền:
   - **Tiêu đề công khai**: tên dễ hiểu (vd "Sentiment analysis Tiếng Việt với LLM")
   - **Mô tả**: workflow dùng để làm gì, input/output, dataset mẫu
   - **Category**: ETL / ML / Analytics / Notification / Visualization / Integration / Other
   - **Tags**: keyword cho dễ search (vd `nlp`, `vietnamese`, `llm`, `sentiment`)
   - **Version**: `1.0.0` (lần sau update bump version)
4. Click **Publish** — workflow sẽ submit dưới contributor `node-<hash>`
   (auto-generated từ token instance của bạn)

### (Optional) Publish dưới username thật

Mặc định contributor hiển thị là `node-<8-ký-tự-hash>`. Muốn xuất hiện dưới
username thật trên hub:

1. Đăng ký tại https://l2s.io.vn/register → copy **API Key** từ Dashboard
2. Sửa `.env` của L2S local, thêm:
   ```
   L2SC_CONTRIBUTOR_API_KEY=l2sc_xxx_paste_api_key_của_bạn
   ```
3. `docker compose up -d` — workflow publish sau đó sẽ gắn username này.

### Sau khi publish — chờ admin duyệt

Workflow sẽ ở trạng thái **pending review**. Admin L2SC kiểm tra:
- Workflow chạy được không (test trên instance demo)
- Title/description không spam
- Không chứa credential leak

Khi duyệt xong (thường <24h):
- Workflow xuất hiện ở **Browse** tại https://l2s.io.vn/browse
- Mọi người có thể **Import** về L2S local của họ để dùng
- Bạn nhận thông báo qua email + thấy ⭐ stars + lượt import trong **Dashboard**

### Tips publish workflow chất lượng

- ✅ Đặt title cụ thể, kèm domain (vd "PostgreSQL → BI Dashboard" thay vì "Workflow 1")
- ✅ Mô tả nêu rõ **input bắt buộc** (file CSV với cột nào, API key nào cần)
- ✅ Bỏ credentials trước khi share (LLM key, DB password)
- ✅ Tag đầy đủ để search ra (3-5 tag)
- ❌ Đừng publish workflow chưa test
- ❌ Đừng share workflow nội bộ chứa data nhạy cảm

---

## 💬 Khác

### Tham gia Forum

[https://l2s.io.vn/forum](https://l2s.io.vn/forum) — Q&A, Tutorial, Showcase, Announcement.

### Đọc Docs plugin

[https://l2s.io.vn/docs](https://l2s.io.vn/docs) — chi tiết 96 plugins L2S, có example use case.

### Source code

- **L2SC** (repo này, public): https://github.com/ngohongthong1832004/L2SC
- **L2S** (gating 183⭐ trên L2SC): https://github.com/ngohongthong1832004/L2S
- **L2S Docker image** (luôn miễn phí): https://hub.docker.com/r/baphongpine/l2s

→ Star repo L2SC nếu thấy hữu ích để giúp đẩy nhanh ngày L2S source open hoàn toàn.

### Contribute vào L2SC

Bug / feature request / PR cho community space:

```bash
git clone https://github.com/ngohongthong1832004/L2SC.git
cd L2SC
docker compose up -d   # backend + frontend dev server
```

Xem [QUICKSTART.md](./QUICKSTART.md) cho dev contributor (chi tiết deploy + tunnel + seed data).

---

## License

MIT
