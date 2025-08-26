#!/bin/bash

# Script to set up cron job for automatic PC usage session and queue cleanup
# This will run the combined cleanup script every minute

# Colors for output
RED=\'\\033[0;31m\'
GREEN=\'\\033[0;32m\'
YELLOW=\'\\033[1;33m\'
BLUE=\'\\033[0;34m\'
NC=\'\\033[0m\' # No Color

echo -e "${BLUE}=== Automated Cleanup Cron Job Setup ===${NC}"
echo

# Get the current directory (where the Laravel project is located)
PROJECT_DIR=$(pwd)
CLEANUP_SCRIPT="${PROJECT_DIR}/cleanup_expired_sessions.php"
LOG_DIR="${PROJECT_DIR}/storage/logs"

echo -e "${YELLOW}Project Directory:${NC} $PROJECT_DIR"
echo -e "${YELLOW}Cleanup Script:${NC} $CLEANUP_SCRIPT"
echo

# Check if the cleanup script exists
if [ ! -f "$CLEANUP_SCRIPT" ]; then
    echo -e "${RED}Error: Cleanup script not found at $CLEANUP_SCRIPT${NC}"
    echo "Please make sure the cleanup_expired_sessions.php file exists in the project directory."
    exit 1
fi

# Make sure the script is executable
chmod +x "$CLEANUP_SCRIPT"
echo -e "${GREEN}✓${NC} Made cleanup script executable"

# Create logs directory if it doesn\'t exist
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}✓${NC} Created logs directory: $LOG_DIR"
fi

# Make sure the logs directory is writable
chmod 755 "$LOG_DIR"
echo -e "${GREEN}✓${NC} Set permissions for logs directory"

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo -e "${RED}Error: PHP is not installed or not in PATH${NC}"
    echo "Please install PHP before setting up the cron job."
    exit 1
fi

echo -e "${GREEN}✓${NC} PHP is available: $(php --version | head -n 1)"

# Create the cron job entry
CRON_JOB="* * * * * cd $PROJECT_DIR && php cleanup_expired_sessions.php >> storage/logs/cleanup_cron.log 2>&1"

echo
echo -e "${YELLOW}Cron job to be added:${NC}"
echo "$CRON_JOB"
echo

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "cleanup_expired_sessions.php"; then
    echo -e "${YELLOW}Warning: A cron job for cleanup already exists.${NC}"
    echo "Current crontab:"
    crontab -l 2>/dev/null | grep "cleanup_expired_sessions.php"
    echo
    read -p "Do you want to replace it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cron job setup cancelled.${NC}"
        exit 0
    fi
    
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "cleanup_expired_sessions.php" | crontab -
    echo -e "${GREEN}✓${NC} Removed existing cron job"
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Cron job added successfully!"
else
    echo -e "${RED}Error: Failed to add cron job${NC}"
    exit 1
fi

echo
echo -e "${BLUE}=== Cron Job Setup Complete ===${NC}"
echo
echo -e "${GREEN}The automated cleanup script will now run every minute to:${NC}"
echo "  • Clean up expired PC usage sessions (paused for >10 minutes)"
echo "  • Clean up expired queue assignments (5-minute timeout)"
echo "  • Assign available PCs to waiting students"
echo "  • Log all activities"
echo
echo -e "${YELLOW}Log files:${NC}"
echo "  • Combined cleanup: $LOG_DIR/cleanup.log"
echo "  • Cron output: $LOG_DIR/cleanup_cron.log"
echo
echo -e "${YELLOW}To view current cron jobs:${NC} crontab -l"
echo -e "${YELLOW}To remove the cron job:${NC} crontab -e (then delete the line)"
echo -e "${YELLOW}To test the script manually:${NC} cd $PROJECT_DIR && php cleanup_expired_sessions.php"
echo

# Test the script once to make sure it works
echo -e "${BLUE}Testing the cleanup script...${NC}"
cd "$PROJECT_DIR"
if php cleanup_expired_sessions.php; then
    echo -e "${GREEN}✓${NC} Cleanup script test successful!"
else
    echo -e "${RED}Error: Cleanup script test failed${NC}"
    echo "Please check the script and try again."
    exit 1
fi

echo
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}The cleanup will now be processed automatically every minute.${NC}"

