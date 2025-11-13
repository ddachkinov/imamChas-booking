#!/bin/bash

# =============================================================================
# Booking Platform - Production Deployment Script
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env.production exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env.production file not found!"
        print_info "Copy .env.production.example to .env.production and configure it."
        exit 1
    fi

    print_success "All prerequisites met"
}

create_backup() {
    print_info "Creating database backup..."

    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

    if docker compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
        docker compose -f $COMPOSE_FILE exec -T postgres \
            pg_dump -U postgres booking_platform | gzip > "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
    else
        print_info "Database not running, skipping backup"
    fi
}

pull_latest_code() {
    print_info "Pulling latest code..."

    if [ -d .git ]; then
        git pull origin main
        print_success "Code updated"
    else
        print_info "Not a git repository, skipping"
    fi
}

build_images() {
    print_info "Building Docker images..."
    docker compose -f $COMPOSE_FILE build --no-cache
    print_success "Images built successfully"
}

run_migrations() {
    print_info "Running database migrations..."

    # Wait for backend to be ready
    sleep 5

    docker compose -f $COMPOSE_FILE exec backend npm run migration:run
    print_success "Migrations completed"
}

deploy() {
    print_info "Deploying application..."

    # Start services
    docker compose -f $COMPOSE_FILE up -d

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10

    # Check service status
    docker compose -f $COMPOSE_FILE ps

    print_success "Application deployed"
}

check_health() {
    print_info "Checking application health..."

    # Source environment variables
    source $ENV_FILE

    # Check backend health
    if curl -f -s "https://api.$MAIN_DOMAIN/health" > /dev/null; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi

    # Check frontend
    if curl -f -s "https://$MAIN_DOMAIN" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
}

show_logs() {
    print_info "Showing application logs..."
    docker compose -f $COMPOSE_FILE logs --tail=50 -f
}

# Main deployment flow
main() {
    echo "========================================="
    echo "  Booking Platform Deployment"
    echo "========================================="
    echo ""

    check_prerequisites

    # Ask for confirmation
    read -p "Do you want to continue with deployment? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi

    # Create backup (if database exists)
    create_backup

    # Pull latest code
    pull_latest_code

    # Build images
    build_images

    # Deploy
    deploy

    # Run migrations
    run_migrations

    # Check health
    sleep 5
    check_health

    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "========================================="
    echo "  Access your application at:"
    source $ENV_FILE
    echo "  https://$MAIN_DOMAIN"
    echo "  https://api.$MAIN_DOMAIN"
    echo "========================================="
    echo ""

    # Ask if user wants to see logs
    read -p "Do you want to view logs? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_logs
    fi
}

# Handle script arguments
case "${1:-}" in
    backup)
        create_backup
        ;;
    build)
        build_images
        ;;
    migrate)
        run_migrations
        ;;
    health)
        check_health
        ;;
    logs)
        show_logs
        ;;
    *)
        main
        ;;
esac
