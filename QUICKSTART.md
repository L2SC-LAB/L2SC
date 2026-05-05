# L2SC — Community Marketplace

> **L2SC** (L2S Communicate) — server cộng đồng cho hệ sinh thái L2S. Browse + share workflow công khai, tham gia Forum hỏi đáp, đọc Docs cho 96 plugins L2S.

## 🌐 Dùng public instance — `l2s.io.vn`

**Cách đơn giản nhất**: vào thẳng **[https://l2s.io.vn](https://l2s.io.vn)** — không cần cài gì.

L2SC là **server chung** cho mọi người trong cộng đồng:
- Browse + import workflow do người khác share
- Đăng ký tài khoản → publish workflow của bạn lên cộng đồng
- Tham gia Forum hỏi đáp về L2S
- Đọc Docs cho 96 plugins L2S

→ **Hầu hết người dùng chỉ cần truy cập `l2s.io.vn`**, không cần self-host L2SC. L2S local của bạn (cài qua Docker) **mặc định đã kết nối** với L2SC tại `l2s.io.vn` rồi.

---

## L2SC vs L2S — khác nhau thế nào?

| | **L2S** (cài local) | **L2SC** (chỉ truy cập web) |
|---|---|---|
| **Mục đích** | Workflow builder + execution engine | Community marketplace + forum + docs |
| **Cài ở đâu** | Tự host trên máy bạn | Server chung tại `l2s.io.vn` |
| **Cần Docker?** | ✅ Có ([baphongpine/l2s](https://hub.docker.com/r/baphongpine/l2s)) | ❌ Không — vào browser thôi |
| **Có gì** | 96 plugins, canvas drag-drop, run pipeline | Browse workflow public, Forum, Plugin docs |
| **Source** | [github.com/ngohongthong1832004/L2S](https://github.com/ngohongthong1832004/L2S) (gating 183⭐) | [github.com/ngohongthong1832004/L2SC](https://github.com/ngohongthong1832004/L2SC) (public) |

---

## Self-host L2SC (chỉ cần thiết cho team/công ty muốn community riêng)

> ⚠️ **Bạn KHÔNG cần làm bước này** nếu chỉ dùng L2S cá nhân — đã có sẵn `l2s.io.vn` công cộng.
>
> Self-host khi:
> - Công ty muốn private community nội bộ (workflow nhạy cảm không share public)
> - Đại học/lab muốn instance riêng cho sinh viên
> - Dev contributor muốn test L2SC code trước khi submit PR

### Yêu cầu

- **Docker** 20+ và **Docker Compose** v2
- **RAM**: ≥1GB
- **Disk**: ≥1GB

L2SC nhẹ — chỉ 2 container (app + Postgres), không cần MinIO/Redis/ML libs.

---

## Cài đặt — 3 bước

### Bước 1: Clone source code

L2SC source đã public — clone về để có đầy đủ compose + frontend + backend code:

```bash
git clone https://github.com/ngohongthong1832004/L2SC.git
cd L2SC
```

> Hoặc nếu chỉ muốn chạy mà không sửa code: tải riêng `docker-compose.hub.yml` (xem [Phụ lục](#phụ-lục-nội-dung-docker-composehubyml-tự-tạo)) — image L2SC sẽ tự pull.

### Bước 2: Sinh `.env`

```bash
cat > .env <<EOF
# Database password
L2SC_POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

# Admin API key — dùng để login lần đầu (sau đó set password qua UI)
L2SC_ADMIN_API_KEY=l2sc_$(python3 -c "import secrets; print(secrets.token_urlsafe(20))")
EOF

chmod 600 .env

# IN ra api_key admin để bạn copy
echo
echo "Admin API Key (lưu lại — dùng để login):"
grep "L2SC_ADMIN_API_KEY=" .env
```

⚠️ **Copy `L2SC_ADMIN_API_KEY` ra giấy/note** — đây là key admin login lần đầu.

### Bước 3: Pull và start

```bash
docker compose -f docker-compose.hub.yml up -d
```

Lần đầu pull ~400MB (l2sc 380MB + postgres 80MB). Khi services healthy:

```bash
docker compose -f docker-compose.hub.yml ps
```

Phải thấy 2 container `running`/`healthy`:
- `l2sc-platform` (app — UI + API)
- `l2sc-platform-postgres` (database)

---

## Truy cập + Login

Mở browser: **http://localhost:9991**

Trang Landing hiện ngay. Để vào admin panel (duyệt workflow, manage forum):

1. Click **Login** → tab **API Key**
2. Paste `L2SC_ADMIN_API_KEY` từ `.env` của bạn
3. Vào **Dashboard** → click nút **Set mật khẩu** (badge amber ở trên cùng)
4. Đặt password → từ lần sau login bằng email/password tiện hơn

Tài khoản admin mặc định:
| Username | Email | Login |
|---|---|---|
| `admin` | `admin@l2sc.local` | API Key (xem `.env`) |

---

## Lệnh hữu ích

```bash
# Log realtime
docker compose -f docker-compose.hub.yml logs -f l2sc

# Status
docker compose -f docker-compose.hub.yml ps

# Restart
docker compose -f docker-compose.hub.yml restart l2sc

# Update version
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d

# Stop (giữ data)
docker compose -f docker-compose.hub.yml down

# Reset data (CẨN THẬN — mất threads/workflows/contributors)
docker compose -f docker-compose.hub.yml down -v
```

---

## Tuỳ chỉnh

Set thêm vào `.env`:

```bash
# Đổi port public (default 9991)
L2SC_PORT=8080

# Pin version (default `latest`)
IMAGE_TAG=1.0.0-beta

# Tăng RAM/CPU
L2SC_MEM=2g
L2SC_CPUS=2

# CORS whitelist (production)
L2SC_CORS_ORIGINS=https://yourdomain.com
```

---

## Bật Cloudflare Tunnel (expose ra Internet)

L2SC instance public dùng Cloudflare Tunnel để expose qua domain (vd `community.yourcompany.com`) không cần mở port firewall.

### Setup tunnel

1. Vào **Cloudflare Zero Trust dashboard** → Networks → Tunnels → **Create tunnel**
2. Chọn **Cloudflared** connector → đặt tên (vd `l2sc`)
3. Copy **tunnel token** → thêm vào `.env`:
   ```
   CLOUDFLARE_TUNNEL_TOKEN=<paste token>
   ```
4. Tab **Public Hostname** trên Cloudflare Dashboard, add 1 ingress:
   ```
   Subdomain:  (để trống)
   Domain:     yourdomain.com
   Path:       (để trống)
   Service:    HTTP — l2sc-platform:991
   ```

### Start tunnel

```bash
COMPOSE_PROFILES=tunnel docker compose -f docker-compose.hub.yml up -d
```

Sau ~10s, https://yourdomain.com sẽ trỏ về L2SC instance của bạn.

Tắt tunnel:
```bash
docker compose -f docker-compose.hub.yml down
docker compose -f docker-compose.hub.yml up -d   # không bật profile = không có cloudflared
```

---

## Trước khi public ra Internet

- [ ] Đổi password admin (qua UI) hoặc rotate `L2SC_ADMIN_API_KEY`
- [ ] `L2SC_POSTGRES_PASSWORD` random ≥24 ký tự (script trên đã làm)
- [ ] `L2SC_CORS_ORIGINS=https://yourdomain.com` (whitelist domain)
- [ ] HTTPS qua Cloudflare Tunnel (recommend) hoặc reverse proxy nginx/caddy
- [ ] Backup định kỳ: `docker exec l2sc-platform-postgres pg_dump -U postgres l2sc | gzip > backup-$(date +%F).sql.gz`

---

## Troubleshoot

### `docker compose up` báo `L2SC_POSTGRES_PASSWORD bắt buộc`
→ Chưa tạo `.env`. Quay lại Bước 2.

### Login API Key fail
→ Check `L2SC_ADMIN_API_KEY` trong `.env` có khớp với key bạn paste vào UI không. Nếu mất key:
```bash
docker exec l2sc-platform-postgres psql -U postgres -d l2sc -c "SELECT username, api_key FROM contributors WHERE is_admin=true;"
```

### Port 9991 đã bị chiếm
→ Đổi: `L2SC_PORT=8080` trong `.env` rồi `up -d`.

### Container `l2sc-platform` restart liên tục
→ `docker logs l2sc-platform --tail 50` xem error. Phổ biến:
- Postgres chưa ready → đợi 30s
- Migration fail → reset DB: `docker compose down -v && docker compose up -d`

### Forum/Docs trống
→ Default chưa có data. Seed demo data từ source repo:
```bash
git clone https://github.com/ngohongthong1832004/L2SC.git && cd L2SC
docker cp scripts/seed_community.py l2sc-platform:/tmp/seed.py
docker exec -w /app -e PYTHONPATH=/app l2sc-platform python /tmp/seed.py
```

---

## Phụ lục: nội dung `docker-compose.hub.yml` (tự tạo nếu chưa có repo)

```yaml
services:
  l2sc:
    image: baphongpine/l2sc:${IMAGE_TAG:-latest}
    container_name: l2sc-platform
    restart: unless-stopped
    ports:
      - "${L2SC_PORT:-9991}:991"
    environment:
      - DATABASE_URL=postgresql://postgres:${L2SC_POSTGRES_PASSWORD}@postgres:5432/l2sc
      - L2SC_ADMIN_API_KEY=${L2SC_ADMIN_API_KEY:-}
      - L2SC_CORS_ORIGINS=${L2SC_CORS_ORIGINS:-*}
    depends_on:
      postgres: { condition: service_healthy }
    mem_limit: ${L2SC_MEM:-1g}

  postgres:
    image: postgres:15-alpine
    container_name: l2sc-platform-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${L2SC_POSTGRES_PASSWORD:?required}
      - POSTGRES_DB=l2sc
    volumes:
      - l2sc_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 10
    mem_limit: 512m

  cloudflared:
    profiles: ["tunnel"]
    image: cloudflare/cloudflared:latest
    container_name: l2sc-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on: [l2sc]

volumes:
  l2sc_postgres_data:
```

---

## Cho maintainer — push image lên Docker Hub

```bash
git clone https://github.com/ngohongthong1832004/L2SC.git && cd L2SC

docker login
docker buildx create --use --name l2sc-builder

# Build + push multi-arch (qua script)
./scripts/publish.sh

# Hoặc manual:
docker buildx build --platform linux/amd64,linux/arm64 \
  -t baphongpine/l2sc:1.0.0-beta \
  -t baphongpine/l2sc:latest \
  --push .

# Single-arch nhanh:
docker build -t baphongpine/l2sc:1.0.0-beta .
docker push baphongpine/l2sc:1.0.0-beta
```

---

## ⭐ Star L2SC repo để mở khoá L2S source

L2SC source **đã public** tại https://github.com/ngohongthong1832004/L2SC. Đây là community space — workflow marketplace + forum + docs.

L2S (workflow engine, project song hành) hiện chỉ public qua **Docker image** [`baphongpine/l2s`](https://hub.docker.com/r/baphongpine/l2s). Source code L2S sẽ public hoàn toàn khi repo này đạt **183 stars**.

→ Nếu thấy L2SC + L2S hữu ích, nhớ **star L2SC repo** trên GitHub. Cộng đồng giúp đẩy nhanh ngày L2S source mở 100% miễn phí cho mọi người fork/contribute.

---

## Thông tin

- **L2SC Docker image**: https://hub.docker.com/r/baphongpine/l2sc
- **L2SC source code** (public, ⭐ tại đây): https://github.com/ngohongthong1832004/L2SC
- **L2S Docker image** (companion — workflow engine): https://hub.docker.com/r/baphongpine/l2s
- **Public community instance**: https://l2s.io.vn
- **L2S demo online**: https://workflows.l2s.io.vn
- **License**: MIT (L2SC public; L2S sau gating)

---

**Build community workflow vui!** 🌐
