#!/usr/bin/env bash
# Quick CLI tool to set or change Antigravity authentication password
set -e

NEW_PASS="$1"
if [ -z "$NEW_PASS" ]; then
    echo "Usage: set-password <new_password>"
    echo "Example: set-password MySuperSecretPassword123"
    exit 1
fi

PASS_FILE="${AUTH_PASSWORD_FILE:-/home/developer/.gemini/config/auth_password}"
mkdir -p "$(dirname "$PASS_FILE")"
echo -n "$NEW_PASS" > "$PASS_FILE"
chmod 600 "$PASS_FILE"
chown developer:developer "$PASS_FILE" 2>/dev/null || true

echo "==================================================================="
echo " 🔒 Antigravity Password Protection is now ACTIVE!"
echo " Saved to: $PASS_FILE"
echo " All web, IDE, terminal, and API sessions now require this password."
echo "==================================================================="
