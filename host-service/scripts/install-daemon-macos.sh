#!/bin/bash
# ====================================================================
# PARSEC CORE HOST - HEADLESS SYSTEM BOOT INSTALLER (macOS)
# Installs Host Engine as a LaunchDaemon running before login.
# ====================================================================

if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Please run with sudo: sudo ./install-daemon-macos.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_PATH="${SCRIPT_DIR}/../target/release/parsec-host-service"
PLIST_PATH="/Library/LaunchDaemons/com.parseccore.host.plist"

if [ ! -f "$BIN_PATH" ]; then
  BIN_PATH="/usr/local/bin/parsec-host-service"
fi

echo "[*] Creating LaunchDaemon plist at ${PLIST_PATH}..."
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.parseccore.host</string>
    <key>ProgramArguments</key>
    <array>
        <string>${BIN_PATH}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/parsec-host.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/parsec-host-error.log</string>
</dict>
</plist>
EOF

chmod 644 "$PLIST_PATH"
chown root:wheel "$PLIST_PATH"

echo "[*] Loading and starting LaunchDaemon..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load -w "$PLIST_PATH"

echo "===================================================================="
echo "[SUCCESS] Bi Desk Host LaunchDaemon installed successfully!"
echo "It is running in the background and will boot before user login."
echo "===================================================================="
