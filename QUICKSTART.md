# L2SC — Dev / Contributor Guide

> Repo này là **community space** của L2S, đang chạy public tại [l2s.io.vn](https://l2s.io.vn). File này dành cho **dev/contributor** muốn:
> - Setup L2SC local để test code trước khi PR
> - Self-host L2SC riêng cho team/công ty (private community)
>
> Nếu chỉ muốn **dùng L2S** → xem [README.md](./README.md). Hầu hết user chỉ cần `https://l2s.io.vn` để browse workflow + forum.

---

## Yêu cầu

- **Docker** 20+ và **Docker Compose** v2
- **RAM**: ≥1GB
- **Disk**: ≥1GB

L2SC nhẹ — chỉ 2 container (app + Postgres), không có Redis/MinIO/ML libs như L2S.

---

## Setup dev local từ source

```bash
git clone https://github.com/L2SC-LAB/L2SC.git
cd L2SC
```

Sinh `.env` (chọn theo OS):

**Linux / macOS** (bash):

```bash
cat > .env <<EOF
L2SC_POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
L2SC_ADMIN_API_KEY=l2sc_$(python3 -c "import secrets; print(secrets.token_urlsafe(20))")
EOF
```

**Windows** (PowerShell):

```powershell
$pgpass = python -c "import secrets; print(secrets.token_urlsafe(24))"
$apikey = python -c "import secrets; print('l2sc_' + secrets.token_urlsafe(20))"

@"
L2SC_POSTGRES_PASSWORD=$pgpass
L2SC_ADMIN_API_KEY=$apikey
"@ | Out-File -FilePath .env -Encoding ascii -NoNewline
```

Sau đó build + start (có hot-reload cho dev):

```bash
docker compose up -d --build
```

Mở http://localhost:9991, login với `L2SC_ADMIN_API_KEY` từ `.env` (tab **API Key**).

### Hot-reload

- **Backend**: `./backend/` mount vào container, uvicorn `--reload` tự pick up
- **Frontend**: `./frontend/` mount vào Vite dev server, HMR realtime

---

## Self-host từ Docker Hub image

Cho team/công ty muốn private community (không dùng public l2s.io.vn):

```yaml
# docker-compose.yml
services:
  l2sc:
    image: baphongpine/l2sc:latest
    container_name: l2sc-platform
    restart: unless-stopped
    ports:
      - "9991:991"
    environment:
      - DATABASE_URL=postgresql://postgres:${L2SC_POSTGRES_PASSWORD}@postgres:5432/l2sc
      - L2SC_ADMIN_API_KEY=${L2SC_ADMIN_API_KEY}
      - L2SC_CORS_ORIGINS=${L2SC_CORS_ORIGINS:-*}
    depends_on:
      postgres: { condition: service_healthy }

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${L2SC_POSTGRES_PASSWORD:?required}
      - POSTGRES_DB=l2sc
    volumes:
      - l2sc_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "PGPASSWORD=$$POSTGRES_PASSWORD psql -U postgres -d l2sc -c 'SELECT 1' || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

volumes:
  l2sc_postgres_data:
```

**Linux / macOS**:

```bash
cat > .env <<EOF
L2SC_POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")
L2SC_ADMIN_API_KEY=l2sc_$(python3 -c "import secrets; print(secrets.token_urlsafe(20))")
EOF

docker compose up -d
```

**Windows** (PowerShell):

```powershell
$pgpass = python -c "import secrets; print(secrets.token_urlsafe(24))"
$apikey = python -c "import secrets; print('l2sc_' + secrets.token_urlsafe(20))"

@"
L2SC_POSTGRES_PASSWORD=$pgpass
L2SC_ADMIN_API_KEY=$apikey
"@ | Out-File -FilePath .env -Encoding ascii -NoNewline

docker compose up -d
```

---

## Custom build args — point frontend vào API khác

Khi self-host private, frontend (UI cộng đồng) cần biết domain của backend để gọi cross-origin. Default đã bake `https://service.l2s.io.vn` vào image — nếu bạn dùng domain khác, rebuild với `--build-arg`:

```bash
docker build \
  --build-arg VITE_L2SC_API_URL=https://my-l2sc-api.local \
  -t l2sc:custom .
```

| Build-arg | Default | Vai trò |
|-----------|---------|---------|
| `VITE_L2SC_API_URL` | `https://service.l2s.io.vn` | Backend API URL frontend gọi (BẮT BUỘC khi tách FE/BE 2 domain) |

Nếu chạy FE + BE cùng 1 domain (1 tunnel duy nhất): để `VITE_L2SC_API_URL=` trống → frontend dùng relative URL, không cần build-arg.

---

## Cloudflare Tunnel (expose ra Internet)

Public L2SC private qua domain riêng (vd `community.yourdomain.com`):

1. Vào **Cloudflare Zero Trust** → Networks → Tunnels → **Create tunnel** → đặt tên (vd `l2sc-private`)
2. Copy token → thêm vào `.env`: `CLOUDFLARE_TUNNEL_TOKEN=<token>`
3. Tab **Public Hostname** trong Cloudflare:
   - Subdomain: (để trống)
   - Domain: `yourdomain.com`
   - Service: `HTTP — l2sc-platform:991`
4. Bật profile tunnel:
   ```bash
   COMPOSE_PROFILES=tunnel docker compose up -d
   ```

---

## Seed demo data (dev)

Sau khi start fresh, DB rỗng. Seed 6 contributor giả + 14 thread + 8 workflow để test UI:

```bash
docker cp scripts/seed_community.py l2sc-platform:/tmp/seed.py
docker exec -w /app -e PYTHONPATH=/app l2sc-platform python /tmp/seed.py
```

Output sẽ in 6 user demo + password để login test.

---

## Build + push Docker image (maintainer)

```bash
# Login Docker Hub
docker login

# Setup buildx multi-arch
docker buildx create --use --name l2sc-builder

# Push (script tự handle tag latest + version từ VERSION file)
./scripts/publish.sh

# Tag riêng
./scripts/publish.sh 1.1.0

# Manual:
docker buildx build --platform linux/amd64,linux/arm64 \
  -t baphongpine/l2sc:1.0.0-beta -t baphongpine/l2sc:latest \
  --push .
```

---

## Lệnh hữu ích

```bash
# Logs realtime
docker compose logs -f l2sc

# Reset DB (mất data)
docker compose down -v
docker compose up -d

# Backup
docker exec l2sc-platform-postgres pg_dump -U postgres l2sc | gzip > backup-$(date +%F).sql.gz

# Update version mới (production)
docker compose pull
docker compose up -d
```

---

## Production checklist (self-host)

- [ ] Đổi `L2SC_ADMIN_API_KEY` (rotate qua DB hoặc reset)
- [ ] `L2SC_POSTGRES_PASSWORD` random ≥24 ký tự
- [ ] `L2SC_CORS_ORIGINS=https://yourdomain.com` (whitelist)
- [ ] HTTPS qua Cloudflare Tunnel hoặc reverse proxy
- [ ] Backup định kỳ Postgres
- [ ] `L2SC_DOCS_ENABLED=false` (mặc định) — giữ `/docs` ẩn với public (bật `true` chỉ khi dev)
- [ ] `L2SC_RATE_LIMIT_ENABLED=true` (mặc định) — bật rate limit cho `/register`, `/login`, `/node-auth`

---

## Kiến trúc L2SC

```
┌──────────────────────────────────────────┐
│  Frontend (React 18 + React Router)      │
│  Landing · Browse · Forum · Docs         │
│  Dashboard · Admin Panel                 │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│  Backend (FastAPI)                       │
│  Routers: public, contribute, admin,     │
│           docs, forum                    │
│  Auth: API Key (X-API-Key header)        │
│  + bcrypt password (login bằng email)    │
└────────────────┬─────────────────────────┘
                 │
              Postgres
        (contributors, workflows,
         threads, replies, node_docs)
```

**~380 MB image**, ~1GB RAM khi chạy. Single port 991 serve cả UI + API (FastAPI mount static).

---

## Tài liệu liên quan

- **README L2SC** (giới thiệu L2S + cách push workflow): [README.md](./README.md)
- **Docker Hub L2SC image**: https://hub.docker.com/r/baphongpine/l2sc
- **L2S Docker image** (sản phẩm chính): https://hub.docker.com/r/baphongpine/l2s
- **Public community instance**: https://l2s.io.vn

---

## License

MIT
