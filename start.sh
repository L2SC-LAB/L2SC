#!/usr/bin/env bash
# L2SC — L2S Communicate, 1-lệnh khởi động.
# Usage:
#   ./start.sh          # Khởi động
#   ./start.sh down     # Dừng
#   ./start.sh logs     # Xem log
#   ./start.sh reset    # Xoá sạch data

set -euo pipefail

C_CYAN='\033[0;36m'; C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'; C_RED='\033[0;31m'; C_OFF='\033[0m'
say()  { printf "${C_CYAN}==>${C_OFF} %s\n" "$*"; }
ok()   { printf "${C_GREEN}  ✓${C_OFF} %s\n" "$*"; }
warn() { printf "${C_YELLOW}  !${C_OFF} %s\n" "$*"; }

cd "$(dirname "$0")"

if ! docker compose version &>/dev/null; then
    printf "${C_RED}Cần Docker + Compose v2${C_OFF}\n"; exit 1
fi

case "${1:-up}" in
    up|"")
        say "Khởi động L2SC..."
        docker compose up -d
        say "Chờ service sẵn sàng..."
        for i in $(seq 1 30); do
            if curl -fsS --max-time 2 http://localhost:991/health &>/dev/null; then
                ok "L2SC đã chạy"
                break
            fi
            sleep 2; printf "."
        done
        printf "\n"
        LAN_IP=$(ip route get 8.8.8.8 2>/dev/null | awk '/src/{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1);exit}}' || echo "127.0.0.1")
        printf "\n${C_GREEN}========================================${C_OFF}\n"
        printf "${C_GREEN}   ✓ L2SC đã khởi động${C_OFF}\n"
        printf "${C_GREEN}========================================${C_OFF}\n\n"
        printf "  Frontend:   ${C_YELLOW}http://localhost:9991${C_OFF}\n"
        printf "  API docs:   ${C_YELLOW}http://localhost:991/docs${C_OFF}\n"
        printf "  LAN FE:     ${C_YELLOW}http://%s:9991${C_OFF}\n"
        printf "  LAN API:    ${C_YELLOW}http://%s:991${C_OFF}\n\n" "$LAN_IP" "$LAN_IP"
        printf "  Admin key:  xem log lần đầu — docker compose logs l2sc | grep 'Admin seeded'\n\n"
        ;;
    down)
        say "Dừng L2SC..."; docker compose down; ok "Đã dừng" ;;
    logs)
        docker compose logs -f --tail=100 ;;
    reset)
        printf "${C_RED}CẢNH BÁO: xoá toàn bộ data L2SC.${C_OFF}\n"
        read -p "Gõ YES để xác nhận: " c
        [ "$c" = "YES" ] && docker compose down -v && ok "Đã reset" || warn "Huỷ" ;;
    *)
        printf "Usage: %s [up|down|logs|reset]\n" "$0"; exit 1 ;;
esac
