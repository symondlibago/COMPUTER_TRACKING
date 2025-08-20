#!/bin/bash

# Script to set up cron job for automatic PC usage session cleanup
# This will run the cleanup script every minute to check for expired paused sessions

echo "Setting up cron job for PC usage session cleanup..."

# Get the current directory (where the Laravel project is located)
PROJECT_DIR=$(pwd)
CLEANUP_SCRIPT="$PROJECT_DIR/cleanup_expired_sessions.php"

# Check if the cleanup script exists
if [ ! -f "$CLEANUP_SCRIPT" ]; then
    echo "Error: Cleanup script not found at $CLEANUP_SCRIPT"
    echo "Please make sure the cleanup_expired_sessions.php file is in your Laravel project root."
    exit 1
fi

# Create a temporary cron file
TEMP_CRON=$(mktemp)

# Get existing cron jobs (if any)
crontab -l 2>/dev/null > "$TEMP_CRON"

# Check if our cron job already exists
if grep -q "cleanup_expired_sessions.php" "$TEMP_CRON"; then
    echo "Cron job for session cleanup already exists. Updating..."
    # Remove existing entry
    grep -v "cleanup_expired_sessions.php" "$TEMP_CRON" > "${TEMP_CRON}.tmp"
    mv "${TEMP_CRON}.tmp" "$TEMP_CRON"
fi

# Add our cron job (runs every minute)
echo "# PC Usage Session Cleanup - Auto-terminate paused sessions after 10 minutes" >> "$TEMP_CRON"
echo "* * * * * /usr/bin/php $CLEANUP_SCRIPT >> /var/log/pc_usage_cleanup.log 2>&1" >> "$TEMP_CRON"

# Install the new cron file
crontab "$TEMP_CRON"

# Clean up temporary file
rm "$TEMP_CRON"

# Create log directory if it doesn't exist
sudo mkdir -p /var/log
sudo touch /var/log/pc_usage_cleanup.log
sudo chmod 666 /var/log/pc_usage_cleanup.log

echo "✓ Cron job installed successfully!"
echo "✓ The cleanup script will run every minute to check for expired paused sessions."
echo "✓ Sessions paused for more than 10 minutes will be automatically terminated."
echo "✓ Logs will be written to /var/log/pc_usage_cleanup.log"
echo ""
echo "To view the current cron jobs:"
echo "  crontab -l"
echo ""
echo "To view the cleanup logs:"
echo "  tail -f /var/log/pc_usage_cleanup.log"
echo ""
echo "To remove the cron job:"
echo "  crontab -e"
echo "  (then delete the line containing 'cleanup_expired_sessions.php')"

