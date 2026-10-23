#!/usr/bin/env bash
# browserless-mcp: Transport bridge connecting Antigravity/Gemini to the hosted Browserless MCP server
# Setup guide: https://docs.browserless.io/mcp/browserless-mcp-server/setup

set -e

DEFAULT_URL="https://mcp.browserless.io/mcp"
TOKEN="${BROWSERLESS_TOKEN:-${BROWSERLESS_API_KEY:-}}"
API_URL="${BROWSERLESS_API_URL:-}"

TARGET_URL=""
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        http://*|https://*)
            TARGET_URL="$1"
            shift
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

if [ -z "$TARGET_URL" ]; then
    TARGET_URL="$DEFAULT_URL"
fi

EXTRA_HEADERS=()
if [ -n "$TOKEN" ]; then
    EXTRA_HEADERS+=(--header "Authorization: Bearer ${TOKEN}")
fi

if [ -n "$API_URL" ]; then
    EXTRA_HEADERS+=(--header "x-browserless-api-url: ${API_URL}")
fi

exec mcp-remote "$TARGET_URL" "${EXTRA_HEADERS[@]}" "${ARGS[@]}"
