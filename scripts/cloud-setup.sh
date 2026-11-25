#!/usr/bin/env bash
# Antigravity Remote Cloud Environment Setup Script
# Replicates the full antigravity-docker tooling, skills, rules, and MCP servers
# inside Google Antigravity Cloud without requiring root/sudo privileges.

set -euo pipefail

echo "==> [1/6] Configuring user PATH, env file, and npm prefix (~/.local)..."
mkdir -p "$HOME/.local/bin" "$HOME/.gemini/config/skills" "$HOME/.gemini/config/rules"
export PATH="$HOME/.local/bin:$PATH"

# Auto-load uploaded env file if present in Antigravity Remote Cloud (/home/antigravity/upload)
CLOUD_ENV_FILE=""
for candidate in "/home/antigravity/upload/cloud.env" "/home/antigravity/upload/.env"; do
  if [ -f "$candidate" ]; then
    CLOUD_ENV_FILE="$candidate"
    break
  fi
done

if [ -n "$CLOUD_ENV_FILE" ]; then
  echo "    Loading environment variables from $CLOUD_ENV_FILE..."
  set -a
  # shellcheck disable=SC1090
  source "$CLOUD_ENV_FILE"
  set +a
fi

for rc in "$HOME/.bashrc" "$HOME/.profile"; do
  touch "$rc"
  if ! grep -q '\.local/bin' "$rc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc"
  fi
  if [ -n "$CLOUD_ENV_FILE" ] && ! grep -q "$CLOUD_ENV_FILE" "$rc"; then
    echo "[ -f \"$CLOUD_ENV_FILE\" ] && set -a && source \"$CLOUD_ENV_FILE\" && set +a" >> "$rc"
  fi
done

npm config set prefix "$HOME/.local"

echo "==> [2/6] Installing Node/JS & AI CLI tools..."
npm install -g \
  bun \
  pnpm \
  yarn \
  vercel \
  eas-cli \
  @dokploy/cli \
  @dokploy/mcp \
  rea-agents \
  @anthropic-ai/claude-code \
  mcp-remote \
  skills \
  add-mcp

echo "==> [3/6] Installing Python tooling (uv, poetry, pipenv, virtualenv)..."
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="$HOME/.local/bin" INSTALLER_NO_MODIFY_PATH=1 sh
fi
uv tool install poetry || true
uv tool install pipenv || true
uv tool install virtualenv || true

echo "==> [4/6] Installing browserless-mcp wrapper..."
cat <<'EOF' > "$HOME/.local/bin/browserless-mcp"
#!/usr/bin/env bash
set -e
DEFAULT_URL="https://mcp.browserless.io/mcp"
TOKEN="${BROWSERLESS_TOKEN:-${BROWSERLESS_API_KEY:-}}"
API_URL="${BROWSERLESS_API_URL:-}"
TARGET_URL=""
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    http://*|https://*) TARGET_URL="$1"; shift ;;
    *) ARGS+=("$1"); shift ;;
  esac
done
[ -z "$TARGET_URL" ] && TARGET_URL="$DEFAULT_URL"
EXTRA_HEADERS=()
[ -n "$TOKEN" ] && EXTRA_HEADERS+=(--header "Authorization: Bearer ${TOKEN}")
[ -n "$API_URL" ] && EXTRA_HEADERS+=(--header "x-browserless-api-url: ${API_URL}")
exec mcp-remote "$TARGET_URL" "${EXTRA_HEADERS[@]}" "${ARGS[@]}"
EOF
chmod +x "$HOME/.local/bin/browserless-mcp"

echo "==> [5/6] Syncing Skills, Rules & MCP config from antigravity-docker..."
CUSTOM_SRC=""
TMP_REPO=""
if [ -d "./customizations" ]; then
  CUSTOM_SRC="./customizations"
else
  TMP_REPO="$(mktemp -d)"
  trap 'rm -rf "$TMP_REPO"' EXIT
  REPO_URL="https://github.com/tamdinh/antigravity-docker.git"
  if [ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]; then
    REPO_URL="https://x-access-token:${GH_TOKEN:-${GITHUB_TOKEN}}@github.com/tamdinh/antigravity-docker.git"
  fi
  git clone --depth=1 --filter=blob:none --sparse "$REPO_URL" "$TMP_REPO" >/dev/null 2>&1
  git -C "$TMP_REPO" sparse-checkout set customizations >/dev/null 2>&1
  CUSTOM_SRC="$TMP_REPO/customizations"
fi

if [ -d "$CUSTOM_SRC/skills" ]; then
  for s in "$CUSTOM_SRC/skills"/*; do
    if [ -d "$s" ]; then
      sname="$(basename "$s")"
      [ ! -d "$HOME/.gemini/config/skills/$sname" ] && cp -r "$s" "$HOME/.gemini/config/skills/"
    fi
  done
fi

if [ -d "$CUSTOM_SRC/rules" ]; then
  for r in "$CUSTOM_SRC/rules"/*; do
    if [ -f "$r" ]; then
      rname="$(basename "$r")"
      [ ! -f "$HOME/.gemini/config/rules/$rname" ] && cp "$r" "$HOME/.gemini/config/rules/"
    fi
  done
fi

# Merge MCP servers (vercel, expo, dokploy, browserless, rea) without overwriting existing ones
if [ -f "$CUSTOM_SRC/mcp_config.json" ]; then
  node -e '
const fs = require("fs");
const srcPath = process.argv[1];
const dstPath = process.argv[2];
const src = JSON.parse(fs.readFileSync(srcPath, "utf8"));
let dst = { mcpServers: {} };
if (fs.existsSync(dstPath)) {
  try { dst = JSON.parse(fs.readFileSync(dstPath, "utf8")); } catch {}
}
dst.mcpServers = { ...(src.mcpServers || {}), ...(dst.mcpServers || {}) };
fs.writeFileSync(dstPath, JSON.stringify(dst, null, 2));
' "$CUSTOM_SRC/mcp_config.json" "$HOME/.gemini/config/mcp_config.json"
fi

echo "==> [6/6] Configuring Git & CLI auth (if env vars are provided)..."
[ -n "${GIT_USER_NAME:-}" ] && git config --global user.name "$GIT_USER_NAME"
[ -n "${GIT_USER_EMAIL:-}" ] && git config --global user.email "$GIT_USER_EMAIL"

if [ -n "${DOKPLOY_URL:-}" ] && [ -n "${DOKPLOY_API_KEY:-}" ]; then
  dokploy auth -u "$DOKPLOY_URL" -t "$DOKPLOY_API_KEY" >/dev/null 2>&1 || true
fi

if [ -n "${VERCEL_TOKEN:-}" ]; then
  mkdir -p "$HOME/.vercel"
  printf '{"token":"%s"}\n' "$VERCEL_TOKEN" > "$HOME/.vercel/auth.json"
fi

echo "==> Setup complete!"
