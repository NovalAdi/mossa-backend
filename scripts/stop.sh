#!/usr/bin/env bash
# scripts/stop.sh — Hentikan dev server, tanya-soal apakah mau matikan Postgres.
set -euo pipefail

echo "[stop] Mencari proses dev..."
if pkill -f "tsx watch src/index.ts" 2>/dev/null; then
  echo "[stop] Backend dihentikan."
else
  echo "[stop] Tidak ada proses dev terbuka."
fi

sleep 1
if pgrep -f "tsx watch src/index.ts" >/dev/null 2>&1; then
  echo "[stop] Proses masih hidup -> paksa mati."
  pkill -9 -f "tsx watch src/index.ts"
fi

read -r -p "Apakah DB PostgreSQL perlu dimatikan juga? (y/n) " ans
case "$ans" in
  y|Y )
    if brew services list 2>/dev/null | grep -q "postgresql@18 started"; then
      brew services stop postgresql@18
      echo "[stop] PostgreSQL dimatikan."
    else
      echo "[stop] PostgreSQL sudah tidak berjalan."
    fi
    ;;
  * )
    echo "[stop] PostgreSQL dibiarkan berjalan."
    ;;
esac
