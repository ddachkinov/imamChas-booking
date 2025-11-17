#!/bin/bash

# =============================================================================
# Alternative Server Setup Methods
# =============================================================================
# Since the repository might be private, here are working alternatives

echo "Choose a method to run the server setup:"
echo ""
echo "Method 1: Direct Script (Recommended)"
echo "-----------------------------------"
cat << 'EOF'
# On your server, run:
cd /tmp
curl -O https://raw.githubusercontent.com/ddachkinov/imamChas-booking/main/scripts/server-setup.sh
chmod +x server-setup.sh
sudo bash server-setup.sh
EOF

echo ""
echo "Method 2: Clone Repository First"
echo "-----------------------------------"
cat << 'EOF'
# If repository is private:
cd /opt
git clone https://github.com/ddachkinov/imamChas-booking.git booking-platform
cd booking-platform
sudo bash scripts/server-setup.sh
EOF

echo ""
echo "Method 3: Copy-Paste Script"
echo "-----------------------------------"
echo "Copy the entire script content and paste it into your server terminal"
