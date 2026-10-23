#!/usr/bin/env bash
set -e

DEVELOPER_USER=developer
GEMINI_DIR="/home/${DEVELOPER_USER}/.gemini"
WORKSPACE_DIR=/workspace
CUSTOMIZATIONS_SRC=/usr/local/share/antigravity/customizations

export VERCEL_TOKEN="${VERCEL_TOKEN:-}"
export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"
export EXPO_TOKEN="${EXPO_TOKEN:-}"
export DOKPLOY_URL="${DOKPLOY_URL:-${DOKPLOY_HOST:-}}"
export DOKPLOY_API_KEY="${DOKPLOY_API_KEY:-${DOKPLOY_TOKEN:-}}"
export BROWSERLESS_TOKEN="${BROWSERLESS_TOKEN:-${BROWSERLESS_API_KEY:-}}"
export BROWSERLESS_API_URL="${BROWSERLESS_API_URL:-}"

mkdir -p "$GEMINI_DIR/config/projects" \
    "$GEMINI_DIR/config/skills" \
    "$GEMINI_DIR/config/rules" \
    "$GEMINI_DIR/dokploy" \
    "$WORKSPACE_DIR"

ln -sfn "$GEMINI_DIR" /root/.gemini 2>/dev/null || true
ln -sfn "$GEMINI_DIR/dokploy" "/home/${DEVELOPER_USER}/.dokploy" 2>/dev/null || true

if [ ! -f "$GEMINI_DIR/config/config.json" ]; then
    cat > "$GEMINI_DIR/config/config.json" <<EOF
{
  "userSettings": {
    "artifactReviewMode": "ARTIFACT_REVIEW_MODE_ALWAYS",
    "autoExecutionPolicy": "CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX",
    "remoteControlEnabled": true,
    "themeMode": "THEME_MODE_DARK",
    "useAiCredits": true
  }
}
EOF
fi

if [ ! -f "$GEMINI_DIR/config/custom_models.json" ]; then
    printf '{\n  "enabled": false,\n  "providers": []\n}\n' > "$GEMINI_DIR/config/custom_models.json"
fi

if [ -d "$CUSTOMIZATIONS_SRC/skills" ]; then
    for skill in "$CUSTOMIZATIONS_SRC/skills"/*; do
        [ -d "$skill" ] || continue
        name="$(basename "$skill")"
        [ -d "$GEMINI_DIR/config/skills/$name" ] || cp -R "$skill" "$GEMINI_DIR/config/skills/"
    done
fi

if [ -d "$CUSTOMIZATIONS_SRC/rules" ]; then
    for rule in "$CUSTOMIZATIONS_SRC/rules"/*; do
        [ -f "$rule" ] || continue
        name="$(basename "$rule")"
        [ -f "$GEMINI_DIR/config/rules/$name" ] || cp "$rule" "$GEMINI_DIR/config/rules/"
    done
fi

MCP_TARGET="$GEMINI_DIR/config/mcp_config.json"
if [ ! -f "$MCP_TARGET" ] && [ -f "$CUSTOMIZATIONS_SRC/mcp_config.json" ]; then
    cp "$CUSTOMIZATIONS_SRC/mcp_config.json" "$MCP_TARGET"
elif [ -f "$MCP_TARGET" ]; then
    node - "$MCP_TARGET" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
try {
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    config.mcpServers ??= {};
    const defaults = {
        vercel: { command: 'mcp-remote', args: ['https://mcp.vercel.com'] },
        expo: { command: 'npx', args: ['-y', 'expo-mcp-server'] },
        dokploy: { command: 'npx', args: ['-y', '@dokploy/mcp'] },
        browserless: { command: 'browserless-mcp', args: ['https://mcp.browserless.io/mcp'] },
        rea: { command: 'npx', args: ['-y', 'rea-agents'] },
    };
    let changed = false;
    for (const [name, server] of Object.entries(defaults)) {
        if (!config.mcpServers[name]) {
            config.mcpServers[name] = server;
            changed = true;
        }
    }
    if (changed) fs.writeFileSync(path, JSON.stringify(config, null, 2));
} catch (error) {
    console.error(`[Fork customizations] Could not merge MCP config: ${error.message}`);
}
NODE
fi

existing_projects="$(find "$GEMINI_DIR/config/projects" -maxdepth 1 -type f -name '*.json' \
    ! -name 'outside-of-project.json' ! -name '.json' -print -quit 2>/dev/null)"
if [ -z "$existing_projects" ]; then
    bun - "$GEMINI_DIR/config/projects" "$WORKSPACE_DIR" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const projectsDir = process.argv[2];
const workspaceDir = process.argv[3];
function registerProject(folderPath, name) {
    const id = crypto.randomUUID();
    const project = {
        id,
        name,
        projectResources: { resources: [{ gitFolder: { folderUri: `file://${folderPath}`, defaultBranch: 'main' } }] },
        settings: {},
        updatedAt: new Date().toISOString(),
        isWorkspaceOnly: false,
    };
    fs.writeFileSync(path.join(projectsDir, `${id}.json`), JSON.stringify(project, null, 2));
}
if (fs.existsSync(workspaceDir)) {
    const folders = fs.readdirSync(workspaceDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && !['node_modules', 'dist', 'build'].includes(entry.name));
    if (folders.length) folders.forEach(entry => registerProject(path.join(workspaceDir, entry.name), entry.name));
    else registerProject(workspaceDir, 'workspace');
}
NODE
fi

if [ ! -f "$GEMINI_DIR/config/projects/outside-of-project.json" ]; then
    cat > "$GEMINI_DIR/config/projects/outside-of-project.json" <<EOF
{
  "id": "outside-of-project",
  "name": "Outside of Project",
  "projectResources": { "resources": [] },
  "settings": {},
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "isWorkspaceOnly": false
}
EOF
fi
[ -f "$GEMINI_DIR/config/projects/.json" ] || cp "$GEMINI_DIR/config/projects/outside-of-project.json" "$GEMINI_DIR/config/projects/.json"

TOKEN_SOURCE="$GEMINI_DIR/antigravity-cli/antigravity-oauth-token"
TOKEN_TARGET="$GEMINI_DIR/jetski-standalone-oauth-token"
if [ -s "$TOKEN_SOURCE" ] && [ ! -e "$TOKEN_TARGET" ]; then
    ln -s "$TOKEN_SOURCE" "$TOKEN_TARGET"
fi

if [ -n "$DOKPLOY_URL" ] && [ -n "$DOKPLOY_API_KEY" ] && command -v dokploy >/dev/null 2>&1; then
    gosu "$DEVELOPER_USER" dokploy auth -u "$DOKPLOY_URL" -t "$DOKPLOY_API_KEY" >/dev/null 2>&1 || true
fi
