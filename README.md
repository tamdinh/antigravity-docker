# Headless Antigravity Docker Agent with Remote Control, Sidecars & IDE

Run Google Antigravity in **headless Remote Control mode** on your server.
Connect to your agent from any browser via your reverse proxy or local network
with built-in password protection, an integrated **Sidecar Manager** for
scheduled agent prompts and autonomous workers, a **VS Code Web IDE** for
inspecting project files, and a **Host Web Terminal** for running commands on
the host machine.

---

## 🚀 Docker Compose

Add this service to your `docker-compose.yml`:

```yaml
services:
  antigravity:
    image: ghcr.io/tamdinh/antigravity-docker:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: antigravity
    restart: unless-stopped
    ports:
      - "4400:4400"
    environment:
      - PUID=1000
      - PGID=1000
      - RC_NAME=<remote-control-name>
      - AGY_PORT=4400
      - AUTH_PASSWORD=<password-for-login>
      - ENABLE_IDE=true
      - ENABLE_TERMINAL=true
      - TERMINAL_MODE=auto
      - HOST_SSH_USER=
      - HOST_SSH_HOST=host.docker.internal
      - HOST_SSH_PORT=22
      - HOST_SSH_DIR=
      - GIT_USER_NAME=${GIT_USER_NAME:-}
      - GIT_USER_EMAIL=${GIT_USER_EMAIL:-}
      - SSH_PRIVATE_KEY=${SSH_PRIVATE_KEY:-}
      - GH_TOKEN=${GH_TOKEN:-}
      - VERCEL_TOKEN=${VERCEL_TOKEN:-}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - antigravity-workspace:/workspace
      - antigravity-gemini:/home/developer/.gemini
      - antigravity-ssh:/home/developer/.ssh

volumes:
  antigravity-workspace:
  antigravity-gemini:
  antigravity-ssh:
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PUID` | `1000` | User ID for the internal developer user. Set to your host user's UID to prevent file permission mismatches. |
| `PGID` | `1000` | Group ID for the internal developer user. Set to your host group's GID to prevent file permission mismatches. |
| `RC_NAME` | `server-agent` | Identifier name for this server instance. |
| `AGY_PORT` | `4400` | Port exposed by the built-in web gateway. |
| `AGY_HUB_PORT` | `4402` | Internal upstream port passed to `agy --hub-port`. |
| `AUTH_PASSWORD` | *(empty)* | Optional password to protect web access. When set, prompts for login and remembers session for 30 days. |
| `BLOCK_TELEMETRY` | `true` | When `true` (default), blocks Google usage telemetry, analytics, crash reporting, and diagnostic tracking domains via in-container DNS sinkholing (`0.0.0.0`) and disables OpenTelemetry exporters, while keeping Gemini model APIs and authentication working seamlessly. |
| `ENABLE_IDE` | `true` | Set to `false` to disable the VS Code Web IDE service and hide its UI button. |
| `ENABLE_TERMINAL` | `true` | Set to `false` to disable the Web Terminal service and hide its UI button. |
| `TERMINAL_MODE` | `auto` | Terminal operational mode. Options: `auto`, `container` (or `local`), `host`. <br>• `auto`: When `HOST_SSH_USER` is empty, displays an interactive 3-second selection menu defaulting to the container shell; when set, connects to the host via SSH. <br>• `container`: Bypasses SSH completely and directly launches an internal Bash shell in `/workspace` with pre-installed developer tools (`agy`, `git`, `gh`, `vercel`, `node`, `python3`, `uv`, `poetry`, etc.). <br>• `host`: Strictly initiates an interactive SSH connection to the host machine. |
| `HOST_SSH_USER` | *(empty)* | Host username used by the Web Terminal when connecting to the host machine via SSH. When left empty and `TERMINAL_MODE=auto`, defaults to the container shell. |
| `HOST_SSH_HOST` | `host.docker.internal` | Hostname/IP used by Web Terminal to reach the host machine. |
| `HOST_SSH_PORT` | `22` | SSH port on the host machine. |
| `HOST_SSH_DIR` | *(host user home)* | *(Optional)* Absolute directory on the host machine to automatically `cd` into when opening the Web Terminal. |
| `SSH_PRIVATE_KEY` | *(empty)* | *(Optional)* Raw or base64-encoded private key string automatically imported into `/home/developer/.ssh/id_ed25519` at runtime. |
| `GIT_USER_NAME` | *(empty)* | Optional Git user.name configured globally for developer commits. |
| `GIT_USER_EMAIL` | *(empty)* | Optional Git user.email configured globally for developer commits. |
| `GH_TOKEN` / `GITHUB_TOKEN` | *(empty)* | Optional GitHub Personal Access Token for GitHub CLI (`gh`). Automatically authenticates `gh` commands without manual login. |
| `VERCEL_TOKEN` | *(empty)* | Optional Vercel API Token for Vercel CLI deployments. |
| `VERCEL_ORG_ID` | *(empty)* | *(Optional)* Vercel Team/Organization ID for team-scoped deployments. |
| `VERCEL_PROJECT_ID` | *(empty)* | *(Optional)* Vercel Project ID to link deployments to a specific project. |
| `TRUST_PROXY` | `false` | When `true`, trusts `X-Forwarded-For` from reverse proxies for rate limiting. |
| `ALLOWED_ORIGINS` | *(empty)* | Optional comma-separated list of allowed CORS origins. |

### Volumes

| Volume | Container Path | Description |
| :--- | :--- | :--- |
| `<location-of-projects>` | `/workspace` | Host directory where your Git repositories and codebases live. |
| `<location-of-config>` | `/home/developer/.gemini` | Host directory where Antigravity OAuth tokens, project configs, and sidecar definitions persist. |
| `<location-of-ssh>` | `/home/developer/.ssh` | *(Recommended)* Host directory persisting container-dedicated SSH keys and configs. |
| `<location-of-gitconfig>` | `/home/developer/.gitconfig` | *(Optional)* Host file persisting container Git configuration. |

---

## 🔑 Setup & Authentication

### Step 1: One-Time Google Authentication
Run the interactive setup inside the container:

**Via Docker Compose:**
```bash
docker compose run --rm antigravity setup
```

**Via Standalone Docker:**
```bash
docker run -it --rm \
  -v "<location-of-config>:/home/developer/.gemini" \
  ghcr.io/tamdinh/antigravity-docker:latest setup
```

1. Open the Google sign-in URL shown in the terminal.
2. Sign in to your Google Account to authorize Antigravity.
3. Your OAuth token is automatically saved into your persistent config
   directory on the host.

### Step 2: Start the Agent
```bash
docker compose up -d
```

### Step 3: Configure Dedicated SSH Keys & Git Identity (Recommended)
To keep your container isolated from host credentials, generate dedicated SSH
keys and Git identity inside the container:

**1. Generate dedicated SSH keypair:**
```bash
docker compose exec antigravity ssh-keygen -t ed25519 -C "antigravity-container" -f /home/developer/.ssh/id_ed25519 -N ""
```

**2. Configure Git identity:**
```bash
docker compose exec antigravity git config --global user.name "Your Name"
docker compose exec antigravity git config --global user.email "your.email@example.com"
```

**3. Authorize public key:**
Display the generated public key:
```bash
docker compose exec antigravity cat /home/developer/.ssh/id_ed25519.pub
```
- **For GitHub / GitLab**: Add this public key under **Settings → SSH and GPG
  keys** (or as a repository **Deploy Key** with write access).
- **For Host Web Terminal**: If `ENABLE_TERMINAL=true` is enabled to run
  commands on the host machine, append the public key to your host's
  `~/.ssh/authorized_keys` (on Unraid, save to
  `/boot/config/ssh/root/authorized_keys` to persist across reboots).

---

## 🌐 Accessing the Agent & Workspace Services

Navigate to `http://<your-server-ip>:4400` in your browser (or through your
reverse proxy). If configured, enter your `AUTH_PASSWORD` on the login screen to
unlock your session for 30 days.

Once logged in, all services are accessible directly or via the **Draggable Floating Tools Dock** (which can be dragged to any position on the screen to avoid obstructing the chat UI):

| Service | Path | Description | Authentication |
| :--- | :--- | :--- | :--- |
| **Google Antigravity UI** | `/` | Main chat and conversation interface. Equipped with a **Draggable Floating Tools Dock** for launching workspace tools with auto-remembered screen placement. | Protected 🔒 |
| **Sidecar Manager** | `/sidecars` | Web UI for defining, scheduling, and monitoring background sidecars and recurring agent prompts. | Protected 🔒 |
| **VS Code Web IDE** | `/ide/` | Full-featured VS Code in the browser for viewing and editing raw project files in `/workspace`. | Protected 🔒 |
| **Web Terminal** | `/terminal/` | Web terminal running interactive container Bash sessions (`/workspace`) or SSH sessions to the host machine (configurable via `TERMINAL_MODE`). | Protected 🔒 |
| **Health & Service Status** | `/status` | Real-time health check endpoint for monitoring service uptime. | **Public / Unauthenticated** 🟢 |

---

## 🤖 Sidecar Manager

The built-in **Sidecar Manager** allows you to schedule recurring agent prompts
(e.g., hourly PR triage, daily summaries) and run background workers directly
alongside your Antigravity container.

Access it by clicking **Sidecar Manager** in the floating tools dock of the
Antigravity UI or navigating directly to `/sidecars`.

### Features:
- **Scheduled Agent Prompts**: Define prompts that run automatically on a
  standard 5-field cron schedule (e.g. `0 * * * *`, `0 9 * * 1-5`) using
  `agentapi new-conversation` targeted to specific projects.
- **Continuous Workers**: Run long-running daemons or background scripts with
  automatic process supervision and configurable restart policies (`always`,
  `on-failure`, `never`).
- **Interactive Management**: Toggle sidecars on or off in real-time, trigger
  manual runs immediately with one click, view live stdout/stderr logs, and edit
  configurations.
- **Plugin Sidecars & Binaries**: Automatically discovers sidecars packaged
  within plugins (`<plugin folder>/sidecars/<sidecar name>/sidecar.json`),
  namespacing them as `<plugin-name>/<sidecar-name>`. Adjacent executable
  binaries and companion scripts residing beside `sidecar.json` can be executed
  directly via relative paths or command name (automatically prepended to
  `PATH`).
- **Spec-Compliant Persistence**: Sidecar configurations are saved to
  `~/.gemini/config/sidecars/<id>/sidecar.json` and enabled states are stored in
  `~/.gemini/config/config.json`.
- **Comprehensive Logging**: Sidecar output is written to
  `~/.gemini/antigravity/sidecar_data/<id>/logs/` and runtime events appear
  directly in `docker compose logs` for debugging.

---

## 🛡️ Privacy & Telemetry Management

By default, `BLOCK_TELEMETRY=true` is enabled to prevent usage telemetry,
analytics, and diagnostic tracking from being sent back to Google while
keeping core agent capabilities, Gemini model APIs, and authentication fully
operational.

### How it Works:
- **In-Container DNS Sinkholing**: Telemetry hostnames are sinkholed to
  `0.0.0.0` directly inside the container (`/etc/hosts`), resulting in
  immediate socket rejection (`ECONNREFUSED`) with zero DNS lookup or request
  timeout latency.
- **Environment Opt-Outs**: Automatically exports `DO_NOT_TRACK=1`,
  `OTEL_SDK_DISABLED=true`, `OTEL_TRACES_EXPORTER=none`,
  `OTEL_METRICS_EXPORTER=none`, and `OTEL_LOGS_EXPORTER=none`.
- **Allowed Traffic**: Essential authentication endpoints
  (`accounts.google.com`, `oauth2.googleapis.com`) and Gemini AI inference APIs
  (`cloudaicompanion.googleapis.com`, `cloudcode-pa.googleapis.com`,
  `generativelanguage.googleapis.com`) continue to pass through unobstructed.
- **Blocked Endpoints**: Sinkholes `firebaselogging-pa.googleapis.com`,
  `feedback-pa.googleapis.com`, `cloudtrace.googleapis.com`,
  `clouderrorreporting.googleapis.com`, `logging.googleapis.com`,
  `monitoring.googleapis.com`, `telemetry.google.com`,
  `client-telemetry.google.com`, `google-analytics.com`, and
  `v1.telemetry.coder.com`.

To disable blocking and allow all telemetry, set `BLOCK_TELEMETRY=false` in your
`docker-compose.yml` or container environment.

---

## 🛠️ Building & Pushing the Container
 
The container image is automatically built and published to GitHub Container Registry on pushes to `main`:
```bash
docker pull ghcr.io/tamdinh/antigravity-docker:latest
```

If you want to build the Docker image locally from source:

```bash
docker build -t ghcr.io/tamdinh/antigravity-docker:latest .
```

> [!TIP]
> **Multi-Platform Build**: To build and push for multiple architectures (such
> as `linux/amd64` and `linux/arm64` for Apple Silicon or ARM servers) using
> Docker Buildx:
> ```bash
> docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/tamdinh/antigravity-docker:latest --push .
> ```
