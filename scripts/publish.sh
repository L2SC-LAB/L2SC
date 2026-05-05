#!/usr/bin/env bash
# L2SC — build + push 1 image all-in-one (BE + FE) lên Docker Hub.
#
# Yêu cầu trước:
#   1. docker login                     # login Docker Hub
#   2. docker buildx create --use       # buildx instance (1 lần đầu)
#
# Usage:
#   ./scripts/publish.sh                    # tag latest + version từ VERSION
#   ./scripts/publish.sh 1.0.0-beta         # tag riêng
#   ./scripts/publish.sh 1.0.0-beta dryrun  # build local-only, KHÔNG push
#
# Env override:
#   IMAGE_PREFIX=baphongpine ./scripts/publish.sh
#   PLATFORMS=linux/amd64 ./scripts/publish.sh   # chỉ amd64

set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE_PREFIX="${IMAGE_PREFIX:-baphongpine}"
VERSION="${1:-$(cat VERSION 2>/dev/null || echo 1.0.0-beta)}"
DRYRUN="${2:-}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'; C_CYAN='\033[0;36m'; C_RED='\033[0;31m'; C_OFF='\033[0m'

say()  { printf "${C_CYAN}==>${C_OFF} %s\n" "$*"; }
ok()   { printf "${C_GREEN}  ✓${C_OFF} %s\n" "$*"; }
warn() { printf "${C_YELLOW}  !${C_OFF} %s\n" "$*"; }
err()  { printf "${C_RED}  ✗${C_OFF} %s\n" "$*" >&2; }

need() { command -v "$1" >/dev/null || { err "Thiếu lệnh: $1"; exit 1; }; }
need docker

if [ "$DRYRUN" != "dryrun" ]; then
    if ! docker buildx inspect &>/dev/null; then
        err "Docker buildx chưa setup. Chạy: docker buildx create --use"
        exit 1
    fi
    if ! docker info 2>/dev/null | grep -q "Username:"; then
        warn "Có vẻ chưa docker login. Push fail thì chạy: docker login"
    fi
fi

IMG="${IMAGE_PREFIX}/l2sc"
printf "\n"
printf "${C_CYAN}┌─────────────────────────────────────────┐${C_OFF}\n"
printf "${C_CYAN}│${C_OFF}  L2SC Docker Hub Publish (all-in-one)   ${C_CYAN}│${C_OFF}\n"
printf "${C_CYAN}├─────────────────────────────────────────┤${C_OFF}\n"
printf "${C_CYAN}│${C_OFF}  Image:    %-29s ${C_CYAN}│${C_OFF}\n" "${IMG}"
printf "${C_CYAN}│${C_OFF}  Tags:     %-29s ${C_CYAN}│${C_OFF}\n" "${VERSION}, latest"
printf "${C_CYAN}│${C_OFF}  Platform: %-29s ${C_CYAN}│${C_OFF}\n" "${PLATFORMS}"
printf "${C_CYAN}│${C_OFF}  Mode:     %-29s ${C_CYAN}│${C_OFF}\n" "$([ "$DRYRUN" = "dryrun" ] && echo "DRYRUN (build only)" || echo "PUSH to Docker Hub")"
printf "${C_CYAN}└─────────────────────────────────────────┘${C_OFF}\n\n"

read -p "Tiếp tục? [y/N] " confirm
if [ "${confirm,,}" != "y" ]; then
    warn "Huỷ"
    exit 0
fi

say "Build l2sc all-in-one (BE + FE) → ${IMG}:${VERSION} + :latest"

if [ "$DRYRUN" = "dryrun" ]; then
    docker build -t "${IMG}:${VERSION}" -t "${IMG}:latest" .
    ok "Image built local: ${IMG}:${VERSION}"
    docker images "${IMG}" --format "  {{.Repository}}:{{.Tag}}\t{{.Size}}"
else
    docker buildx build \
        --platform "${PLATFORMS}" \
        -t "${IMG}:${VERSION}" \
        -t "${IMG}:latest" \
        --push \
        .
    ok "Image pushed: ${IMG}:{${VERSION},latest}"
fi

printf "\n${C_GREEN}✓ Hoàn tất${C_OFF}\n\n"

if [ "$DRYRUN" != "dryrun" ]; then
    cat <<EOF
End-user pull về chạy theo guide ở Docker Hub overview:

  → https://hub.docker.com/r/${IMAGE_PREFIX}/l2sc

⚠ L2SC chủ yếu dùng public instance tại https://l2s.io.vn — hầu hết user
KHÔNG cần self-host. Self-host chỉ khi cần private community nội bộ.

Tóm tắt self-host: copy docker-compose.yml + tạo .env với 2 secret + up -d
EOF
fi
