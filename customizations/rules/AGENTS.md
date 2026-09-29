# Vercel & Next.js Guidelines for AI Agents

When developing, testing, configuring, or deploying projects targeting the Vercel platform:

## 1. Non-Interactive CLI Automation
- Always use non-interactive flags when running `vercel` CLI commands in scripts or automated tasks:
  - `vercel --yes` (or `-y`) to skip confirmation prompts.
  - For production deployments, run `vercel --prod --yes`.
  - For preview deployments, run `vercel --yes`.
- The environment provides `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` if configured. Vercel CLI reads these automatically, but you can also pass `--token "$VERCEL_TOKEN"` explicitly when running in restricted environments.
- To link an existing project without interactive prompts:
  `vercel link --yes --project <project-name>`

## 2. Vercel MCP Tools Integration
- When the Vercel MCP server (`vercel`) is available, prioritize its dedicated tools:
  - `search_vercel_documentation`: Retrieve official documentation, best practices, and API references.
  - `list_projects` / `get_project`: Retrieve project configuration, framework preset, and linked domains.
  - `list_deployments` / `get_deployment`: Inspect deployment status, commit metadata, and target environment.
  - `get_deployment_events`: Fetch build and runtime logs to diagnose errors.
  - `query_web_analytics`: Check visitor metrics, page views, and performance data.

## 3. Environment Variables & Secret Safety
- Use `vercel env` to synchronize environment variables:
  - Pull local dev environment: `vercel env pull .env.local --yes`
  - Add variable: `echo "value" | vercel env add KEY production`
  - List variables: `vercel env ls`
- **Security**: Never commit `.vercel/`, `.env*.local`, or private API tokens to Git. Ensure `.gitignore` includes:
  ```gitignore
  .vercel
  .env*.local
  ```

## 4. Next.js & React Best Practices
- **App Router by default**: Prefer Next.js App Router (`app/` directory) over Pages Router (`pages/`) for all new projects.
- **Server Components first**: Keep components as React Server Components (RSC) by default. Only add `'use client'` when state (`useState`), effects (`useEffect`), or browser APIs are strictly needed.
- **Data Fetching**: Fetch data directly inside Server Components using async/await. Avoid fetching in `useEffect` on the client.
- **Cache Components**: Utilize Next.js 15/16 caching paradigms:
  - Mark cacheable components or functions with `'use cache'`.
  - Use `cacheLife()` and `cacheTag()` for granular cache lifetimes and on-demand revalidation.
- **Server Actions**: Mark mutating server functions with `'use server'`. Validate input parameters using schema libraries (e.g. Zod).

## 5. Deployment Diagnostics & Troubleshooting
- Before modifying code to fix deployment failures, gather diagnostic evidence:
  1. Check deployment status via `vercel inspect <url>` or MCP `get_deployment`.
  2. Inspect build/runtime logs via `vercel logs <url>` or MCP `get_deployment_events`.
  3. Identify if the failure is a build error (e.g., TypeScript error, missing dependency) or a runtime error (e.g., missing environment variable, function timeout).

---

# Expo & EAS Mobile Development Guidelines for AI Agents

When developing, testing, building, or publishing React Native mobile applications targeting Expo and EAS:

## 1. Non-Interactive Cloud Builds
- Always use non-interactive flags for EAS CLI commands in automated agent tasks:
  - `eas build --platform <all|ios|android> --profile <preview|production> --non-interactive`
  - `eas submit --platform <ios|android> --non-interactive`
  - `eas update --branch <branch> --message "<msg>" --non-interactive`
- The environment provides `EXPO_TOKEN` if configured, enabling passwordless authentication with Expo Cloud.

## 2. Remote Development & Tunneling
- When launching the local development server inside the Docker container, always enable tunneling so physical devices can scan the QR code and connect over the internet:
  `npx expo start --tunnel`
- If cache issues occur, append `-c`: `npx expo start --tunnel -c`.

## 3. Expo Router Conventions
- Prefer Expo Router (`app/` directory) for file-based navigation (Stack, Tabs, Modals).
- Use `useRouter()` and `<Link>` primitives.
- Wrap the app with `SafeAreaProvider` from `react-native-safe-area-context` in `app/_layout.tsx`.

## 4. Mobile Security & Credentials
- Never commit signing credentials, `.p8`, `.mobileprovision`, keystores, or `.expo/` directories to version control.
- Ensure `.gitignore` includes:
  ```gitignore
  .expo
  *.jks
  *.p8
  *.p12
  *.mobileprovision
  ```

---

# Dokploy Management Guidelines for AI Agents

When developing, testing, deploying, or managing applications, databases, and infrastructure on Dokploy:

## 1. Non-Interactive CLI Automation & Structured Output
- Always use machine-readable and non-interactive output when executing `dokploy` CLI commands in automated scripts or agent tasks:
  - Add `--json` to retrieve structured JSON for parsing with `jq` or programmatic inspection:
    `dokploy project all --json`
    `dokploy application all --json`
    `dokploy compose all --json`
- The environment provides `DOKPLOY_URL` and `DOKPLOY_API_KEY` (or `DOKPLOY_TOKEN`) if configured. The CLI reads these automatically.
- Alternatively authenticate explicitly:
  `dokploy auth -u "$DOKPLOY_URL" -t "$DOKPLOY_API_KEY"`
- Validate authentication status before performing sensitive operations:
  `dokploy verify`

## 2. Dokploy MCP Tools Integration
- When the Dokploy MCP server (`dokploy`) is available, prioritize its dedicated tools to query and manage infrastructure directly:
  - Application lifecycle: create, deploy, redeploy, start, stop, restart, delete.
  - Project management: create, query, list projects and environments.
  - Database management: create, start, stop, backup PostgreSQL, MySQL, MariaDB, MongoDB, Redis instances.
  - Deployment inspection: fetch deployment queues, status, and application logs.

## 3. Environment Variables & Secret Safety
- Manage application environment variables through Dokploy CLI or isolated `.env` configurations.
- **Security**: Never commit API keys, tokens, or `~/.dokploy/` credentials to Git. Ensure `.gitignore` includes:
  ```gitignore
  .dokploy
  ```

## 4. Deployment Diagnostics & Troubleshooting
- Before modifying code or re-triggering builds to fix deployment failures:
  1. Retrieve application details: `dokploy application one --applicationId <id> --json`
  2. Inspect deployment logs: `dokploy deployment all --applicationId <id> --json`
  3. Inspect runtime container logs: `dokploy application logs --applicationId <id>`
  4. Verify service status and Docker container health via Dokploy API/MCP tools.

---

# Browserless Guidelines for AI Agents

When performing web scraping, browser automation, web page auditing, or headless browser execution:

## 1. Browserless MCP Integration & Hosted Server
- The hosted Browserless MCP server is available at `https://mcp.browserless.io/mcp` via the `browserless` MCP server.
- Tool selection hierarchy:
  - **Fast content extraction**: Use `browserless_smartscraper` for single-turn web scraping (auto-cascading through HTTP, proxies, headless browser, and CAPTCHA solving).
  - **Interactive automation**: Use `browserless_agent` for complex workflows requiring clicks, input typing, navigation, or DOM inspection.
  - **Audits & SEO**: Use `browserless_performance` to run Lighthouse audits.
  - **Site Mapping**: Use `browserless_map` for URL and sitemap discovery.
  - **Document & Visual Exports**: Use `browserless_export` for PDF, PNG/JPEG screenshots, or complete page HTML/ZIP archives.
  - **Custom Scripts**: Use `browserless_function` when arbitrary Puppeteer code execution is needed.

## 2. Session Lifecycle & Unit Efficiency
- When using `browserless_agent`:
  - Set `keepSessionAlive: true` on the first call to maintain browser state across multiple turns.
  - Forward the returned `sessionId` in subsequent calls.
  - Always issue a final call with `action: "close"` once the interaction is complete to prevent unit leaks.

## 3. Environment Variables & Credentials
- Provide credentials via `BROWSERLESS_TOKEN` (or `BROWSERLESS_API_KEY`).
- For European regional endpoints, configure `BROWSERLESS_API_URL` (`https://production-lon.browserless.io` or `https://production-ams.browserless.io`).
- **Security**: Never log or commit Browserless API tokens into Git.


