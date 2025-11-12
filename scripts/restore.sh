#!/bin/bash

# =============================================================================
# Database Restore Script
# =============================================================================
# This script restores a PostgreSQL database from a backup
# Usage: ./scripts/restore.sh <backup-file>

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Please provide a backup file!"
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if database container is running
if ! docker compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    print_error "Database container is not running!"
    print_info "Start it with: docker compose -f $COMPOSE_FILE up -d postgres"
    exit 1
fi

# Warning
echo ""
print_info "⚠️  WARNING: This will REPLACE the current database!"
print_info "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
echo ""

if [ "$REPLY" != "yes" ]; then
    print_info "Restore cancelled"
    exit 0
fi

# Create backup of current database before restore
print_info "Creating backup of current database first..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP="./backups/pre_restore_$TIMESTAMP.sql.gz"
docker compose -f $COMPOSE_FILE exec -T postgres \
    pg_dump -U postgres booking_platform | gzip > "$CURRENT_BACKUP"
print_success "Current database backed up to: $CURRENT_BACKUP"

# Stop backend services during restore
print_info "Stopping backend services..."
docker compose -f $COMPOSE_FILE stop backend worker

# Drop and recreate database
print_info "Preparing database for restore..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U postgres <<EOF
DROP DATABASE IF EXISTS booking_platform;
CREATE DATABASE booking_platform;
EOF

# Restore backup
print_info "Restoring database from backup..."
if gunzip -c "$BACKUP_FILE" | docker compose -f $COMPOSE_FILE exec -T postgres \
    psql -U postgres booking_platform > /dev/null; then

    print_success "Database restored successfully!"

    # Restart services
    print_info "Restarting services..."
    docker compose -f $COMPOSE_FILE up -d backend worker

    print_success "Services restarted"
    print_success "Restore completed successfully!"

    echo ""
    print_info "Your current database was backed up to:"
    print_info "$CURRENT_BACKUP"
else
    print_error "Restore failed!"
    print_info "Attempting to restore previous database..."

    # Try to restore the backup we just made
    gunzip -c "$CURRENT_BACKUP" | docker compose -f $COMPOSE_FILE exec -T postgres \
        psql -U postgres booking_platform > /dev/null

    docker compose -f $COMPOSE_FILE up -d backend worker

    print_error "Restore failed, but previous database was recovered"
    exit 1
fi
