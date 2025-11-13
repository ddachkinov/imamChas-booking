#!/bin/bash

# =============================================================================
# Database Backup Script
# =============================================================================
# This script creates a backup of the PostgreSQL database
# Usage: ./scripts/backup.sh [backup-name]

set -e

# Configuration
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.prod.yml"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename
if [ -z "$1" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_$TIMESTAMP"
else
    BACKUP_NAME="$1"
fi

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

print_info "Creating database backup..."
print_info "Backup file: $BACKUP_FILE"

# Check if database container is running
if ! docker compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    print_error "Database container is not running!"
    exit 1
fi

# Create backup
if docker compose -f $COMPOSE_FILE exec -T postgres \
    pg_dump -U postgres booking_platform | gzip > "$BACKUP_FILE"; then

    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "Backup created successfully!"
    print_info "File: $BACKUP_FILE"
    print_info "Size: $BACKUP_SIZE"

    # Clean up old backups
    print_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    print_success "Old backups cleaned up"

    # List recent backups
    echo ""
    print_info "Recent backups:"
    ls -lh "$BACKUP_DIR" | tail -5
else
    print_error "Backup failed!"
    exit 1
fi
