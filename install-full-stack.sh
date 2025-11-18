#!/bin/bash

# 🚀 Full Stack Deployment - Floor Heating Designer
# Deploys both frontend and backend to VPS

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_HOST="8.209.82.14"
VPS_USER="root"
FRONTEND_PATH="/var/www/html/heating"
BACKEND_PATH="/var/www/heating-backend"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Floor Heating Designer - Full Stack Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Frontend URL:${NC} http://${VPS_HOST}/heating"
echo -e "${YELLOW}Backend API:${NC} http://${VPS_HOST}:3001/api"
echo ""

# Check for sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  'sshpass' nie jest zainstalowane${NC}"
    echo ""
    echo "Zainstaluj sshpass:"
    echo "  sudo apt install sshpass"
    echo ""
    exit 1
fi

# Get password
echo -e "${YELLOW}Podaj hasło SSH dla root@${VPS_HOST}:${NC}"
read -s SSH_PASSWORD
echo ""

if [ -z "$SSH_PASSWORD" ]; then
    echo -e "${RED}❌ Hasło nie może być puste!${NC}"
    exit 1
fi

# Test connection
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[1/8]${NC} Test połączenia z VPS..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} exit 2>/dev/null; then
    echo -e "${RED}❌ Nie można połączyć z VPS - sprawdź hasło!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Połączenie OK${NC}"

# Build frontend
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[2/8]${NC} Budowanie frontendu..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build zakończony${NC}"

# Package frontend
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[3/8]${NC} Pakowanie frontendu..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd dist
tar -czf ../heating-frontend.tar.gz * 2>/dev/null
cd ..

echo -e "${GREEN}✅ Frontend spakowany${NC}"

# Build backend
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[4/8]${NC} Budowanie backendu..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd server
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend build failed!${NC}"
    exit 1
fi

# Package backend (dist + node_modules + package.json + uploads + database)
tar -czf ../heating-backend.tar.gz dist node_modules package.json package-lock.json database 2>/dev/null || {
    mkdir -p uploads
    tar -czf ../heating-backend.tar.gz dist node_modules package.json package-lock.json database uploads 2>/dev/null
}
cd ..

echo -e "${GREEN}✅ Backend spakowany${NC}"

# Upload packages
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[5/8]${NC} Przesyłanie na VPS..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no heating-frontend.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/
sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no heating-backend.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

echo -e "${GREEN}✅ Pliki przesłane${NC}"

# Install on VPS
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[6/8]${NC} Instalacja na serwerze..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} bash << 'ENDSSH'
set -e

# Install frontend
mkdir -p /var/www/html/heating
cd /var/www/html/heating
rm -rf *
tar -xzf /tmp/heating-frontend.tar.gz
chown -R www-data:www-data /var/www/html/heating
chmod -R 755 /var/www/html/heating

# Install backend
mkdir -p /var/www/heating-backend
cd /var/www/heating-backend
rm -rf *
tar -xzf /tmp/heating-backend.tar.gz

# Create .env if not exists
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=floor_heating
DB_USER=floor_heating_user
DB_PASSWORD=change_this_password

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
fi

mkdir -p uploads

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo ""
    echo "⚠️  PostgreSQL nie jest zainstalowany!"
    echo "Zainstaluj: apt install postgresql postgresql-contrib"
    exit 1
fi

# Cleanup
rm /tmp/heating-frontend.tar.gz /tmp/heating-backend.tar.gz

ENDSSH

echo -e "${GREEN}✅ Instalacja zakończona${NC}"

# Create systemd service
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[7/8]${NC} Konfiguracja systemd service..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} bash << 'ENDSSH'

# Create systemd service
cat > /etc/systemd/system/heating-backend.service << 'EOF'
[Unit]
Description=Floor Heating Designer Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/heating-backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Check if service should be started
if systemctl is-active --quiet heating-backend; then
    systemctl restart heating-backend
    echo "✅ Backend service restarted"
else
    echo "ℹ️  Backend service created but not started"
    echo "   To start: systemctl start heating-backend"
    echo "   To enable on boot: systemctl enable heating-backend"
fi

ENDSSH

echo -e "${GREEN}✅ Systemd service skonfigurowany${NC}"

# Verify
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[8/8]${NC} Weryfikacja..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FRONTEND_COUNT=$(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "ls -1 /var/www/html/heating/ | wc -l" 2>/dev/null)
echo -e "${GREEN}✅ Frontend files: ${FRONTEND_COUNT}${NC}"

BACKEND_EXISTS=$(sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "[ -f /var/www/heating-backend/dist/index.js ] && echo 'yes' || echo 'no'" 2>/dev/null)
echo -e "${GREEN}✅ Backend built: ${BACKEND_EXISTS}${NC}"

# Cleanup local
rm heating-frontend.tar.gz heating-backend.tar.gz

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              INSTALACJA ZAKOŃCZONA!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📱 Frontend:${NC} http://${VPS_HOST}/heating"
echo -e "${YELLOW}🔧 Backend:${NC} http://${VPS_HOST}:3001/api"
echo ""
echo -e "${YELLOW}⚠️  NASTĘPNE KROKI:${NC}"
echo ""
echo "1. Skonfiguruj PostgreSQL:"
echo "   ssh root@${VPS_HOST}"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE floor_heating;"
echo "   CREATE USER floor_heating_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE floor_heating TO floor_heating_user;"
echo "   \\q"
echo ""
echo "2. Zainicjalizuj schemat bazy:"
echo "   cd /var/www/heating-backend"
echo "   sudo -u postgres psql -d floor_heating -f database/schema.sql"
echo ""
echo "3. Zaktualizuj .env z hasłem do bazy"
echo "   nano /var/www/heating-backend/.env"
echo ""
echo "4. Uruchom backend:"
echo "   systemctl start heating-backend"
echo "   systemctl enable heating-backend"
echo ""
echo "5. Sprawdź status:"
echo "   systemctl status heating-backend"
echo "   curl http://localhost:3001/health"
echo ""
echo "6. Skonfiguruj Nginx proxy dla backendu (opcjonalnie)"
echo ""
