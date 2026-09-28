---
name: dokploy
description: >-
  Manage Dokploy self-hosted PaaS infrastructure, applications, databases, compose stacks, and deployments remotely via Dokploy CLI and Dokploy MCP. Use when deploying apps to Dokploy, managing projects/environments, provisioning databases (Postgres, MySQL, Mongo, Redis), configuring domains/SSL, or inspecting deployment logs.
---

# Dokploy Management Guide

A comprehensive guide to managing Dokploy servers, applications, databases, compose stacks, and deployments remotely using the **Dokploy CLI** (`@dokploy/cli`) and **Dokploy MCP Server** (`@dokploy/mcp`).

---

## 🔑 Authentication & Configuration

Dokploy CLI communicates with your Dokploy server via its REST API using an API token generated in your Dokploy web dashboard (**Settings → Profile → API/CLI Section**).

### Method 1: Environment Variables (Recommended)
Set the following variables in your shell, `.env` file, or container environment:
```bash
export DOKPLOY_URL="https://panel.dokploy.example.com"
export DOKPLOY_API_KEY="your-dokploy-api-token"
```
The CLI automatically detects and uses these environment variables without manual login.

### Method 2: CLI Auth Command
Authenticate interactively or in scripts:
```bash
dokploy auth -u "https://panel.dokploy.example.com" -t "your-dokploy-api-token"
```
Credentials are saved to `~/.dokploy/config.json`.

### Verify Authentication
Confirm active credentials and connectivity:
```bash
dokploy verify
```

---

## 🛠️ Global Options & Command Conventions

The Dokploy CLI commands are auto-generated from the Dokploy OpenAPI specification:
```bash
dokploy <group> <action> [options]
```

- `--json`: Output raw JSON response. **Always use `--json` in scripts and agent tools** for reliable piping into `jq`.
- `--help`, `-h`: List all actions in a group or flags for a command:
  ```bash
  dokploy --help
  dokploy application --help
  dokploy project --help
  ```

---

## 📦 Key Workflows & Commands

### 1. Projects Management (`dokploy project`)
Projects group applications, databases, and environments together.

- **List all projects**:
  ```bash
  dokploy project all --json
  ```
- **Inspect a single project**:
  ```bash
  dokploy project one --projectId <project-id> --json
  ```
- **Create a new project**:
  ```bash
  dokploy project create --name "My Project" --description "Production workloads"
  ```
- **Delete a project**:
  ```bash
  dokploy project delete --projectId <project-id>
  ```

---

### 2. Applications Management (`dokploy application`)
Manage application lifecycles, deployments, and settings.

- **List applications**:
  ```bash
  dokploy application all --json
  ```
- **Inspect application details**:
  ```bash
  dokploy application one --applicationId <application-id> --json
  ```
- **Deploy application**:
  ```bash
  dokploy application deploy --applicationId <application-id>
  ```
- **Redeploy application** (rebuild without cache):
  ```bash
  dokploy application redeploy --applicationId <application-id>
  ```
- **Start / Stop / Restart application**:
  ```bash
  dokploy application start --applicationId <application-id>
  dokploy application stop --applicationId <application-id>
  dokploy application restart --applicationId <application-id>
  ```
- **View live application logs**:
  ```bash
  dokploy application logs --applicationId <application-id>
  ```
- **Delete application**:
  ```bash
  dokploy application delete --applicationId <application-id>
  ```

---

### 3. Docker Compose Stacks (`dokploy compose`)
Deploy and manage multi-container Docker Compose workloads.

- **List all compose applications**:
  ```bash
  dokploy compose all --json
  ```
- **Deploy compose stack**:
  ```bash
  dokploy compose deploy --composeId <compose-id>
  ```
- **Delete compose stack**:
  ```bash
  dokploy compose delete --composeId <compose-id>
  ```

---

### 4. Database Management
Dokploy provides dedicated groups for managed databases:
- PostgreSQL: `dokploy postgres`
- MySQL: `dokploy mysql`
- MariaDB: `dokploy mariadb`
- MongoDB: `dokploy mongo`
- Redis: `dokploy redis`

**Examples**:
- **List databases**:
  ```bash
  dokploy postgres all --json
  dokploy redis all --json
  ```
- **Deploy / Start database**:
  ```bash
  dokploy postgres deploy --postgresId <id>
  dokploy mysql start --mysqlId <id>
  ```
- **Stop database**:
  ```bash
  dokploy postgres stop --postgresId <id>
  ```

---

### 5. Domains & SSL Certificates (`dokploy domain` & `dokploy certificate`)
- **Add custom domain**:
  ```bash
  dokploy domain create --applicationId <application-id> --host "app.example.com" --path "/" --port 3000
  ```
- **List domains**:
  ```bash
  dokploy domain all --json
  ```
- **Generate SSL certificate (Let's Encrypt)**:
  ```bash
  dokploy certificate generate --domainId <domain-id>
  ```

---

### 6. Deployment History & Diagnostics (`dokploy deployment`)
- **Inspect deployment history**:
  ```bash
  dokploy deployment all --applicationId <application-id> --json
  ```
- **Check specific deployment log**:
  ```bash
  dokploy deployment one --deploymentId <deployment-id> --json
  ```

---

## 🤖 AI Agent & MCP Integration

### Model Context Protocol (`@dokploy/mcp`)
The Dokploy MCP server exposes over 500 API endpoints directly to AI agents:
- Automatically configured in `~/.gemini/config/mcp_config.json`.
- When `DOKPLOY_URL` and `DOKPLOY_API_KEY` are provided in the environment, the AI agent can seamlessly inspect server status, trigger deployments, inspect build logs, and manage databases without manual terminal interaction.
- The AI agent will prioritize MCP tools when available and fall back to CLI commands with `--json` for scripted tasks.
