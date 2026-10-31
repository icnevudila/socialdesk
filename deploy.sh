#!/usr/bin/env bash
set -e

echo "=== Socialdesk Hetzner 24/7 Sunucu Kurulumu ==="

# 1. Sistem paketleri
if [ -x "$(command -v apt-get)" ]; then
  sudo apt-get update -y
  sudo apt-get install -y curl git python3 python3-pip python3-venv
fi

# 2. Node.js kontrolü (yoksa Node 20 LTS kur)
if ! command -v node &> /dev/null; then
  echo "Node.js kuruluyor..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 3. Python sanal ortamı ve instagrapi
echo "Python ortamı hazırlanıyor..."
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install instagrapi pillow requests

# 4. PM2 ile sürekli arka planda çalıştırma
if ! command -v pm2 &> /dev/null; then
  echo "PM2 kuruluyor..."
  sudo npm install -g pm2
fi

echo "Socialdesk servisi başlatılıyor..."
pm2 delete socialdesk 2>/dev/null || true
ENABLE_PUBLISHING=true pm2 start server.mjs --name "socialdesk" --node-args="--env-file-if-exists=.env"
pm2 save

echo "=== Kurulum Tamamlandı! ==="
echo "Socialdesk port 4317 üzerinde 7/24 çalışıyor."
echo "Durumu izlemek için: pm2 logs socialdesk"
