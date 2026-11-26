---
name: craft-anything
description: >-
  Study how any website, app, game, or binary works and recreate it cleanly using Craft Anything (craft-anything-cli) via CLI and MCP. Use when the user asks to inspect, analyze, compare, or rebuild websites, desktop/mobile apps, games, or compiled binaries with evidence-backed tools.
---

# Craft Anything Guide

A guide for AI agents using **Craft Anything** ([storytold/craft-anything](https://github.com/storytold/craft-anything)) via **`craft-anything-cli`** and the **`craft-anything` MCP server**.

---

## 🧭 Core Modes: Clean Room vs. Deep

- **Clean room (default)**: Never reads internal source code, binaries, or page source. Inspects only observable surfaces (screenshots, visible text, layout, colors, fonts, spacing, UI interactions).
- **Deep (`--deep`)**: Enables internal inspection engines (native binaries, .NET, Java, Android, Apple, Electron/JS, websites, firmware, databases, game files, plus Ghidra if installed). Use only on software you own or have permission to inspect.

---

## 💻 CLI Commands & Recipes

```bash
# Check installation, coding agents, and engines
craft-anything-cli doctor

# List all available tools grouped by toolset
craft-anything-cli commands

# Run as an MCP server over stdin/stdout (configured in mcp_config.json)
craft-anything-cli mcp
craft-anything-cli mcp --deep --all-tools

# Study and rebuild a target from the CLI
craft-anything-cli rebuild https://example.com "Recreate this website"
craft-anything-cli rebuild - "A snake game in Rust" --rounds 1
craft-anything-cli rebuild https://example.com "Make the header blue" --continue-in "<project folder>"
```

---

## 🛠️ MCP Configuration

Pre-configured in `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "craft-anything": {
      "command": "craft-anything-cli",
      "args": ["mcp"]
    }
  }
}
```

- Large inspection outputs return a summary first; page through full evidence records using `core_evidence_browse`.
- Always report evidence confidence, coverage, and unknowns clearly.
