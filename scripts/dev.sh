#!/bin/sh

postgres_nyalain() {
  if pg_isready -h localhost -q 2>/dev/null; then
    echo "[dev] PostgreSQL sudah berjalan."
    return 0
  fi

  echo "[dev] PostgreSQL belum berjalan. Menyalakan services postgresql@18..."
  brew services start postgresql@18

  i=0
  while [ "$i" -lt 40 ]; do
    if pg_isready -h localhost -q 2>/dev/null; then
      echo "[dev] PostgreSQL siap."
      return 0
    fi
    sleep 1
    i=$((i+1))
  done

  echo "[dev] ERROR: PostgreSQL gagal dinyalakan. Cek: brew services list." >&2
  return 1
}

postgres_nyalain

node_modules/.bin/tsx watch src/index.ts &
TSX_PID=$!

CleaningUp=0

cleanup() {
  if [ "$CleaningUp" = "1" ]; then
    kill "$TSX_PID" 2>/dev/null
    wait "$TSX_PID" 2>/dev/null
    exit 1
  fi
  CleaningUp=1

  echo ""
  printf 'Apakah DB PostgreSQL perlu dimatikan juga? (y/n) '
  read -r ans
  case "$ans" in
    y|Y)
      if brew services list 2>/dev/null | grep -q "postgresql@18 started"; then
        brew services stop postgresql@18 >/dev/null 2>&1
        echo "[stop] PostgreSQL dimatikan."
      else
        echo "[stop] PostgreSQL sudah tidak berjalan."
      fi
      ;;
    *)
      echo "[stop] PostgreSQL dibiarkan berjalan."
      ;;
  esac

  kill "$TSX_PID" 2>/dev/null
  wait "$TSX_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

wait "$TSX_PID"
