---
name: vercel-cli
description: >-
  Manage Vercel projects, environment variables, domains, and deployments from the command line. Use when managing Vercel settings, linking repositories, pulling/adding environment variables, running local dev server, or inspecting deployments.
---

# Vercel CLI Management

A complete guide to managing Vercel infrastructure, projects, settings, and environment variables using the `vercel` CLI.

## Global Options
- `--yes`, `-y`: Skip all interactive confirmation prompts.
- `--token <TOKEN>`: Pass Vercel API token explicitly.
- `--scope <TEAM_OR_USER>`: Execute command under specific team or user scope.
- `--debug`: Enable verbose logging for troubleshooting.

---

## Key Workflows

### 1. Project Linking & Unlinking
- **Link directory**: `vercel link --yes --project <project-name>`
- **Check link status**: Look for `.vercel/project.json` containing `orgId` and `projectId`.
- **Switch project/scope**: `vercel link --yes --repo` or re-run `vercel link` with a different target.

### 2. Environment Variables Management (`vercel env`)
- **List all environment variables**:
  ```bash
  vercel env ls
  ```
- **Pull variables to local file** (e.g. `.env.local` for local development):
  ```bash
  vercel env pull .env.local --yes
  ```
- **Pull specific target environment**:
  ```bash
  vercel env pull .env.production --environment=production --yes
  vercel env pull .env.preview --environment=preview --yes
  ```
- **Add a new variable**:
  ```bash
  echo -n "secret-value" | vercel env add DATABASE_URL production preview development --yes
  ```
- **Remove a variable**:
  ```bash
  vercel env rm DATABASE_URL production --yes
  ```

### 3. Local Development (`vercel dev`)
Emulates the Vercel production routing, middleware, and functions environment locally:
```bash
# Run local dev server
vercel dev --port 3000 --yes
```

### 4. Custom Domains (`vercel domains`)
- **List domains**:
  ```bash
  vercel domains ls
  ```
- **Add custom domain**:
  ```bash
  vercel domains add myapp.example.com <project-name>
  ```
- **Inspect domain DNS and SSL certificate status**:
  ```bash
  vercel domains inspect myapp.example.com
  ```

### 5. Marketplace Integrations (`vercel install`)
Discover and provision third-party resources directly to the project:
```bash
# Provision Postgres database (Neon)
vercel install neon

# Provision Redis cache (Upstash)
vercel install upstash

# Provision Authentication (Clerk)
vercel install clerk
```
Auto-populates the required environment variables into the Vercel project settings.

### 6. Deployment Inspection & Alias Management
- Inspect deployment metadata: `vercel inspect <url-or-id>`
- Assign alias / custom URL to deployment: `vercel alias set <deployment-url> <custom-alias>`
- List historical aliases: `vercel alias ls`
