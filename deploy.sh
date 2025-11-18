#!/bin/bash

# =============================================================================
# Floor Heating Designer v3.0 - VPS Deployment Script
# =============================================================================
# Usage: ./deploy.sh
#
# Before first use:
# 1. Edit configuration below (VPS_USER, VPS_IP, VPS_PATH)
# 2. chmod +x deploy.sh
# 3. Make sure you have SSH key access to your VPS
# =============================================================================

# CONFIGURATION - EDIT THESE VALUES
VPS_USER="root"                     # Your SSH username on VPS
VPS_IP="8.209.82.14"                # Your VPS IP or domain
VPS_PATH="/var/www/floor-heating-app"  # Path on VPS
LOCAL_BUILD_PATH="./dist"           # Local build directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}=============================================${NC}"
    echo -e "${BLUE}  Floor Heating Designer v3.0${NC}"
    echo -e "${BLUE}  VPS Deployment Script${NC}"
    echo -e "${BLUE}=============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_config() {
    # Config already set for 8.209.82.14
    # If you want to deploy to different server, edit VPS_USER and VPS_IP at the top of this file
    return 0
}

check_build() {
    if [ ! -d "$LOCAL_BUILD_PATH" ]; then
        print_error "Katalog build nie istnieje: $LOCAL_BUILD_PATH"
        echo ""
        print_info "Najpierw uruchom build:"
        echo "  npm run build"
        echo ""
        exit 1
    fi

    if [ ! -f "$LOCAL_BUILD_PATH/index.html" ]; then
        print_error "Brak pliku index.html w build!"
        echo ""
        print_info "Build może być niepełny. Spróbuj:"
        echo "  npm run build"
        echo ""
        exit 1
    fi

    # Count files in build
    FILE_COUNT=$(find "$LOCAL_BUILD_PATH" -type f | wc -l)
    BUILD_SIZE=$(du -sh "$LOCAL_BUILD_PATH" | cut -f1)

    print_success "Build znaleziony: $LOCAL_BUILD_PATH"
    print_info "Plików: $FILE_COUNT | Rozmiar: $BUILD_SIZE"
    echo ""
}

check_ssh() {
    print_info "Sprawdzanie połączenia SSH..."

    if ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_USER@$VPS_IP" "echo 'SSH OK'" &>/dev/null; then
        print_success "Połączenie SSH działa"
        echo ""
        return 0
    else
        print_error "Nie można połączyć się z VPS przez SSH"
        echo ""
        print_info "Sprawdź:"
        echo "  1. Czy VPS_USER i VPS_IP są poprawne"
        echo "  2. Czy masz skonfigurowany klucz SSH"
        echo "  3. Czy VPS jest dostępny"
        echo ""
        print_info "Test połączenia:"
        echo "  ssh $VPS_USER@$VPS_IP"
        echo ""
        exit 1
    fi
}

confirm_deployment() {
    echo -e "${YELLOW}🚀 Gotowy do deployment${NC}"
    echo "────────────────────────────────────────"
    echo "  Źródło: $LOCAL_BUILD_PATH"
    echo "  Cel:    $VPS_USER@$VPS_IP:$VPS_PATH"
    echo "────────────────────────────────────────"
    echo ""

    read -p "Czy chcesz kontynuować deployment? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment anulowany przez użytkownika"
        exit 0
    fi
    echo ""
}

create_remote_directory() {
    print_info "Tworzenie katalogu na serwerze..."

    ssh "$VPS_USER@$VPS_IP" "sudo mkdir -p $VPS_PATH" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Katalog utworzony: $VPS_PATH"
    else
        print_warning "Katalog prawdopodobnie już istnieje"
    fi
    echo ""
}

deploy_files() {
    print_info "Przesyłanie plików na serwer..."
    echo ""

    # rsync with progress
    rsync -avz --delete --progress \
        -e "ssh" \
        "$LOCAL_BUILD_PATH/" \
        "$VPS_USER@$VPS_IP:$VPS_PATH/"

    if [ $? -eq 0 ]; then
        echo ""
        print_success "Pliki przesłane pomyślnie"
        echo ""
    else
        echo ""
        print_error "Błąd podczas przesyłania plików"
        exit 1
    fi
}

set_permissions() {
    print_info "Ustawianie uprawnień..."

    ssh "$VPS_USER@$VPS_IP" "sudo chown -R www-data:www-data $VPS_PATH && sudo chmod -R 755 $VPS_PATH" 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Uprawnienia ustawione (www-data:www-data)"
    else
        print_warning "Nie udało się ustawić uprawnień (sprawdź sudo access)"
    fi
    echo ""
}

reload_nginx() {
    print_info "Przeładowanie Nginx..."

    # Check if nginx is installed
    if ssh "$VPS_USER@$VPS_IP" "which nginx" &>/dev/null; then
        # Test nginx config first
        if ssh "$VPS_USER@$VPS_IP" "sudo nginx -t" &>/dev/null; then
            # Reload nginx
            if ssh "$VPS_USER@$VPS_IP" "sudo systemctl reload nginx" 2>/dev/null; then
                print_success "Nginx przeładowany"
            else
                print_warning "Nie udało się przeładować Nginx (sprawdź sudo access)"
            fi
        else
            print_warning "Nginx config ma błędy - sprawdź konfigurację"
        fi
    else
        print_warning "Nginx nie jest zainstalowany lub nie znaleziony"
    fi
    echo ""
}

print_summary() {
    echo ""
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}  ✅ Deployment zakończony pomyślnie!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo "🌐 Aplikacja dostępna na:"
    echo "   http://$VPS_IP"

    # Check if domain is used instead of IP
    if [[ ! "$VPS_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "   https://$VPS_IP (jeśli SSL skonfigurowane)"
    fi

    echo ""
    echo "📁 Lokalizacja na serwerze:"
    echo "   $VPS_PATH"
    echo ""
    echo "📊 Sprawdź logi w razie problemów:"
    echo "   ssh $VPS_USER@$VPS_IP"
    echo "   sudo tail -f /var/log/nginx/floor-heating-error.log"
    echo ""
    echo -e "${BLUE}=============================================${NC}"
}

print_first_time_setup() {
    echo ""
    echo -e "${YELLOW}=============================================${NC}"
    echo -e "${YELLOW}  ⚠️  PIERWSZE WDROŻENIE - KONFIGURACJA NGINX${NC}"
    echo -e "${YELLOW}=============================================${NC}"
    echo ""
    echo "Pliki zostały przesłane, ale musisz skonfigurować Nginx."
    echo ""
    echo "1. Połącz się z serwerem:"
    echo "   ssh $VPS_USER@$VPS_IP"
    echo ""
    echo "2. Utwórz konfigurację Nginx:"
    echo "   sudo nano /etc/nginx/sites-available/floor-heating-app"
    echo ""
    echo "3. Wklej konfigurację z pliku DEPLOY_VPS_UBUNTU.md (sekcja 'Krok 4')"
    echo ""
    echo "4. Aktywuj konfigurację:"
    echo "   sudo ln -s /etc/nginx/sites-available/floor-heating-app /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "5. Skonfiguruj firewall (jeśli nie masz):"
    echo "   sudo ufw allow 'Nginx Full'"
    echo ""
    echo "Szczegóły w pliku: DEPLOY_VPS_UBUNTU.md"
    echo ""
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    print_header

    # Step 1: Check configuration
    check_config

    # Step 2: Check if build exists
    check_build

    # Step 3: Check SSH connection
    check_ssh

    # Step 4: Confirm deployment
    confirm_deployment

    # Step 5: Create remote directory
    create_remote_directory

    # Step 6: Deploy files
    deploy_files

    # Step 7: Set permissions
    set_permissions

    # Step 8: Reload Nginx
    reload_nginx

    # Step 9: Print summary
    print_summary

    # Check if this might be first deployment
    if ! ssh "$VPS_USER@$VPS_IP" "[ -f /etc/nginx/sites-available/floor-heating-app ]" 2>/dev/null; then
        print_first_time_setup
    fi
}

# Run main function
main
