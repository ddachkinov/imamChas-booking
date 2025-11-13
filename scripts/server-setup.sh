#!/bin/bash

# =============================================================================
# Server Initial Setup Script
# =============================================================================
# Run this script on a fresh Ubuntu 22.04 server to prepare it for deployment
# Usage: bash server-setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

echo "========================================="
echo "  Server Setup for Booking Platform"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# Install essential packages
print_info "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    ufw \
    fail2ban
print_success "Essential packages installed"

# Install Docker
print_info "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed"
else
    print_info "Docker already installed"
fi

# Install Docker Compose
print_info "Installing Docker Compose..."
apt install -y docker-compose-plugin
print_success "Docker Compose installed"

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker

# Configure firewall
print_info "Configuring firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
print_success "Firewall configured"

# Create application directory
print_info "Creating application directory..."
mkdir -p /opt/booking-platform
chown -R $SUDO_USER:$SUDO_USER /opt/booking-platform
print_success "Application directory created: /opt/booking-platform"

# Create backup directory
mkdir -p /opt/booking-platform/backups
print_success "Backup directory created"

# Setup automatic security updates
print_info "Setting up automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
print_success "Automatic security updates configured"

# Install monitoring tools
print_info "Installing monitoring tools..."
apt install -y netdata
systemctl enable netdata
systemctl start netdata
print_success "Monitoring tools installed (access at: http://YOUR_IP:19999)"

# Optimize for Docker
print_info "Optimizing system for Docker..."
cat >> /etc/sysctl.conf << EOF

# Docker optimizations
fs.file-max = 65536
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF
sysctl -p
print_success "System optimized"

# Create swap if not exists (for low memory servers)
if [ ! -f /swapfile ]; then
    print_info "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    print_success "Swap file created"
fi

# Setup logrotate for Docker
print_info "Setting up log rotation..."
cat > /etc/logrotate.d/docker << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
EOF
print_success "Log rotation configured"

# Display system information
echo ""
echo "========================================="
echo "  Server Setup Complete!"
echo "========================================="
echo ""
print_success "Server is ready for deployment"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/booking-platform"
echo "2. Configure .env.production"
echo "3. Run: ./deploy.sh"
echo ""
echo "System Information:"
echo "-------------------"
echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk space: $(df -h / | awk 'NR==2 {print $4}')"
echo "IP Address: $(curl -s ifconfig.me)"
echo ""
print_info "Don't forget to:"
echo "  - Configure DNS records to point to this server"
echo "  - Update SSH port (optional but recommended)"
echo "  - Disable password authentication for SSH"
echo ""
