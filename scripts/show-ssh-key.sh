#!/usr/bin/env bash
# Antigravity Git SSH Key Manager & Diagnostics Utility
# Usage:
#   show-ssh-key              (Display public key and test GitHub connection)
#   show-ssh-key --test       (Test connection to GitHub / GitLab)
#   show-ssh-key --import KEY (Import a private SSH key)
#   show-ssh-key --gen        (Generate a new ed25519 keypair)

set -e

SSH_DIR="${SSH_DIR:-$HOME/.ssh}"
if [ "$(whoami)" = "root" ] && [ -d "/home/developer/.ssh" ]; then
    SSH_DIR="/home/developer/.ssh"
fi

mkdir -p "$SSH_DIR"

import_key() {
    local key_input="$1"
    if [ -z "$key_input" ]; then
        echo "Error: No key provided to import." >&2
        echo "Usage: show-ssh-key --import \"<private_key_content>\"" >&2
        exit 1
    fi

    local target_file="$SSH_DIR/id_ed25519"
    if [ -f "$key_input" ]; then
        cp "$key_input" "$target_file"
    else
        if echo "$key_input" | grep -qv "BEGIN " && echo "$key_input" | base64 -d 2>/dev/null | grep -q "BEGIN "; then
            echo "$key_input" | base64 -d > "$target_file"
        else
            printf "%s\n" "$key_input" > "$target_file"
        fi
    fi

    chmod 600 "$target_file"
    chown developer:developer "$target_file" 2>/dev/null || true
    ssh-keygen -y -f "$target_file" > "${target_file}.pub" 2>/dev/null || true
    chmod 644 "${target_file}.pub" 2>/dev/null || true
    chown developer:developer "${target_file}.pub" 2>/dev/null || true

    echo "✅ SSH Private Key successfully imported to $target_file"
}

generate_key() {
    local target_file="$SSH_DIR/id_ed25519"
    if [ -f "$target_file" ]; then
        echo "A key already exists at $target_file"
        read -r -p "Overwrite? [y/N]: " ans
        if [[ ! "$ans" =~ ^[yY] ]]; then
            echo "Cancelled."
            return
        fi
    fi
    ssh-keygen -t ed25519 -C "antigravity-container" -f "$target_file" -N ""
    chmod 600 "$target_file"
    chmod 644 "${target_file}.pub"
    chown developer:developer "$target_file" "${target_file}.pub" 2>/dev/null || true
    echo "✅ New ed25519 SSH key generated at $target_file"
}

test_connection() {
    echo "🔍 Testing SSH connection to GitHub (git@github.com)..."
    local output
    output=$(ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=6 -T git@github.com 2>&1 || true)
    
    if echo "$output" | grep -q "successfully authenticated"; then
        echo -e "\033[1;32m✅ GitHub SSH Authentication: SUCCESS!\033[0m"
        echo "   $output"
    elif echo "$output" | grep -q "Permission denied"; then
        echo -e "\033[1;31m❌ GitHub SSH Authentication: FAILED (Permission denied - publickey)\033[0m"
        echo "   GitHub did not recognize the public key from this container."
        echo "   👉 Copy the public key shown below and add it to: https://github.com/settings/keys"
    else
        echo -e "\033[1;33m⚠️ GitHub SSH Connection Notice:\033[0m"
        echo "   $output"
    fi
}

case "${1:-}" in
    --import|-i)
        shift
        import_key "$*"
        echo ""
        ;;
    --gen|-g)
        generate_key
        echo ""
        ;;
    --test|-t)
        test_connection
        exit 0
        ;;
esac

# Find available public keys
PUB_KEYS=("$SSH_DIR"/*.pub)
if [ ! -e "${PUB_KEYS[0]}" ]; then
    echo "⚠️  No SSH keys found in $SSH_DIR. Generating a new ed25519 key..."
    generate_key
    PUB_KEYS=("$SSH_DIR"/*.pub)
fi

echo "==================================================================="
echo " 🔑 Antigravity Git SSH Keys (Location: $SSH_DIR)"
echo "==================================================================="
for pub in "${PUB_KEYS[@]}"; do
    if [ -f "$pub" ]; then
        echo "File: $pub"
        echo "-------------------------------------------------------------------"
        cat "$pub"
        echo "-------------------------------------------------------------------"
    fi
done

echo ""
echo "👉 To clone private repositories with Git and Antigravity Agent:"
echo "   1. Copy the public key string above (starting with 'ssh-ed25519 ...')"
echo "   2. Open GitHub: https://github.com/settings/keys"
echo "   3. Click 'New SSH Key', paste the key, and click 'Add SSH Key'"
echo "   (Or add to your repository under Settings -> Deploy Keys -> Add deploy key)"
echo "==================================================================="
echo ""

test_connection
