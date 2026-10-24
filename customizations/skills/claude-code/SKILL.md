---
name: claude-code
description: >-
  Automate coding tasks, codebase exploration, bug fixing, and git workflows using Anthropic's Claude Code CLI. Use when running Claude Code in the terminal, performing automated refactors, running non-interactive agent queries, or troubleshooting Claude Code sessions.
---

# Claude Code CLI Guide

A comprehensive guide to using and automating Anthropic's **Claude Code CLI** (`@anthropic-ai/claude-code`) inside the Antigravity container.

---

## 🔑 Authentication & Configuration

Claude Code can be authenticated using an API key or an interactive OAuth session.

### Method 1: Anthropic API Key (Headless / Non-Interactive)
Provide your Anthropic API key via environment variable:
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```
In Docker Compose or Dokploy, set `ANTHROPIC_API_KEY` in your `.env` or container environment variables. Claude Code detects it automatically without interactive prompts.

### Method 2: Interactive Browser Login
Inside the built-in **Host Web Terminal** (`/terminal/`) or **VS Code Web IDE Terminal** (`/ide/`):
```bash
claude
```
Follow the URL prompt to authorize via your browser. Credentials and configuration persist in `~/.claude` and `~/.claude.json` (persisted to the container's volume storage).

### Verify Installation & Health
Check the installation status and diagnostics:
```bash
claude --version
claude doctor
```

---

## 💻 CLI Commands & Usage Patterns

### 1. Interactive Coding Session
Launch an interactive agent session inside the terminal:
```bash
claude
```
Or start with an initial instruction:
```bash
claude "Review the latest commit and run tests"
```

### 2. Headless / Scripted Execution (`-p` / `--print`)
Execute single-turn commands from scripts or subagent tasks:
```bash
claude -p "Explain the project structure in 3 bullet points"
```

To pipe code or diffs into Claude Code:
```bash
git diff | claude -p "Review this diff for potential regressions"
```

To bypass permission prompts in trusted automated sandbox environments:
```bash
claude -p "Fix type errors in src/index.ts" --dangerously-skip-permissions
```

### 3. Background Agent Management
Claude Code supports managing background tasks:
```bash
# List running background sessions
claude agents

# Attach to a background session
claude attach <id>

# View logs of a session
claude logs <id>

# Stop a session
claude stop <id>
```

### 4. MCP Servers Integration
Claude Code integrates with Model Context Protocol (MCP) servers:
```bash
# List configured MCP servers
claude mcp list

# Add an MCP server
claude mcp add <name> <command> [args...]
```

---

## 🛡️ Best Practices & Workspace Safety

- **Persistent Credentials**: Configuration is linked to `~/.gemini/claude` so logins and history survive container restarts and redeployments.
- **Git Safety**: Never commit `.claude/` or `.claude.json` into repositories. Ensure your `.gitignore` includes:
  ```gitignore
  .claude
  .claude.json
  ```
- **Pairing with Antigravity**: Use Claude Code directly in the Host Web Terminal or VS Code Web IDE, or run it headlessly for specialized multi-agent workflows.
