# L2SC — L2S Communicate, 1-lệnh khởi động (Windows).
# Usage:
#   .\start.ps1         # Khởi động
#   .\start.ps1 down    # Dừng
#   .\start.ps1 logs    # Xem log
#   .\start.ps1 reset   # Xoá sạch data
param([string]$Command = "up")
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Say($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)  { Write-Host "  ✓ $m" -ForegroundColor Green }
function Warn($m){ Write-Host "  ! $m" -ForegroundColor Yellow }

switch ($Command.ToLower()) {
    { $_ -in "up","" } {
        Say "Khởi động L2SC..."
        docker compose up -d
        Say "Chờ service sẵn sàng..."
        for ($i = 0; $i -lt 30; $i++) {
            try {
                $r = Invoke-WebRequest -Uri "http://localhost:8100/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                if ($r.StatusCode -eq 200) { Ok "L2SC đã chạy"; break }
            } catch { Start-Sleep -Seconds 2; Write-Host "." -NoNewline }
        }
        Write-Host ""
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   ✓ L2SC đã khởi động" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Frontend:  http://localhost:8101" -ForegroundColor Yellow
        Write-Host "  API docs:  http://localhost:8100/docs" -ForegroundColor Yellow
        Write-Host "  Admin key: docker compose logs l2sc | Select-String 'Admin seeded'" -ForegroundColor Gray
        Write-Host ""
    }
    "down"  { Say "Dừng L2SC..."; docker compose down; Ok "Đã dừng" }
    "logs"  { docker compose logs -f --tail=100 }
    "reset" {
        Write-Host "CANH BAO: xoa toan bo data L2SC." -ForegroundColor Red
        $c = Read-Host "Go YES de xac nhan"
        if ($c -eq "YES") { docker compose down -v; Ok "Da reset" } else { Warn "Huy" }
    }
    default { Write-Host "Usage: .\start.ps1 [up|down|logs|reset]"; exit 1 }
}
