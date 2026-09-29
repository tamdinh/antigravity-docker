---
name: browserless
description: >-
  Automate browser workflows, web scraping, screenshots/PDF exports, Lighthouse performance audits, sitemap extraction, and headless execution via Browserless hosted MCP server. Use when the user requests web scraping, browser automation, web page auditing, capturing screenshots/PDFs, or crawling sites.
---

# Browserless MCP & Hosted Server Guide

A comprehensive guide for AI agents interacting with the hosted Browserless MCP server (`https://mcp.browserless.io/mcp`) to perform web scraping, browser automation, performance audits, file exports, and custom Puppeteer execution with zero infrastructure overhead.

---

## 🔑 Authentication & Configuration

The Browserless hosted MCP server is located at `https://mcp.browserless.io/mcp` and supports three authentication mechanisms:

1. **API Token (`BROWSERLESS_TOKEN` or `BROWSERLESS_API_KEY`)**:
   - Provide your API token via container environment variables or `.env`.
   - The CLI bridge wrapper `browserless-mcp` automatically passes `--header "Authorization: Bearer <token>"`.
   - Alternatively, URL query parameter authentication is supported: `https://mcp.browserless.io/mcp?token=YOUR_API_TOKEN`.

2. **OAuth Sign-in**:
   - Supported natively by the hosted server. If no token is provided, `mcp-remote` opens the OAuth browser sign-in flow on `https://mcp.browserless.io/oauth/authorize`.

3. **Regional Endpoints (`BROWSERLESS_API_URL`)**:
   - By default, requests route to US West (`https://production-sfo.browserless.io`).
   - Route to European regions by setting `BROWSERLESS_API_URL`:
     - Europe (London): `https://production-lon.browserless.io`
     - Europe (Amsterdam): `https://production-ams.browserless.io`

---

## 🛠️ Tool Catalog & Selection Strategy

Browserless exposes 14 tools organized into three categories:

### 1. Stateful Browser Agent (`browserless_agent`)
Used for interactive, multi-step browser workflows (form submission, multi-page user journeys, dynamic single-page applications).

- **Session Management**:
  - In MCP server v1.33.0+, sessions are one-shot by default.
  - For multi-step workflows, pass `keepSessionAlive: true` on the first invocation.
  - Save the returned `sessionId` and pass it to subsequent calls.
  - Always close the session when finished to conserve account units.
- **Available Actions**:
  - `navigate`: Open a target URL.
  - `snapshot`: Inspect the current DOM state, text, and interactive elements.
  - `click`: Click an element via selector or coordinate.
  - `type`: Input text into form fields.
  - `press`: Send keyboard keys (e.g. `Enter`, `Tab`).
  - `evaluate`: Run custom client-side JavaScript in the page context.
  - `close`: Terminate the browser session.

### 2. Stateless REST API Tools (Single-turn execution)
Best for fast, one-off operations where a persistent browser session is not required:

- **`browserless_smartscraper`**:
  - *Best for*: General content scraping from arbitrary URLs.
  - Cascades through strategies: standard HTTP → proxy network → headless browser → CAPTCHA bypass.
  - Extracts clean Markdown, text, or structured HTML.
- **`browserless_function`**:
  - *Best for*: Custom Puppeteer scripts.
  - Run arbitrary Puppeteer code directly on the Browserless cloud and return results.
- **`browserless_export`**:
  - *Best for*: Generating PDFs, PNG/JPEG screenshots, full page HTML, or offline ZIP packages.
- **`browserless_search`**:
  - *Best for*: Web, news, and image search with optional automatic scraping of top results.
- **`browserless_map`**:
  - *Best for*: Discovering all indexed URLs on a domain using `sitemap.xml` and recursive link extraction.
- **`browserless_performance`**:
  - *Best for*: Running comprehensive Google Lighthouse audits (Performance, Accessibility, Best Practices, SEO, PWA).
- **`browserless_crawl`**:
  - *Best for*: Crawling multiple pages from a seed URL up to a specified depth and scraping discovered content.
- **`browserless_skill`**:
  - *Best for*: Loading on-demand guidance or discovering site-specific extraction recipes.

### 3. Account & Observability Tools (Read-only)
- **`browserless_account`**: View plan tier, unit balance, billing cycle dates, and API key names.
- **`browserless_usage`**: Inspect billed units and request volume across keys and time windows.
- **`browserless_logs`**: Retrieve remote execution logs to diagnose failed scraping or script errors.
- **`browserless_sessions`**: Inspect running browser instances, session replays, and debug links.
- **`browserless_profiles`**: Query saved authentication profiles (stored cookies/session state).

---

## 💡 Best Practices for AI Agents

1. **Pick the Right Tool**:
   - Use `browserless_smartscraper` for reading documentation, articles, or static pages. It is significantly faster and more unit-efficient than spinning up a stateful browser agent.
   - Use `browserless_agent` only when clicking, logging in, or interacting with multi-step workflows is required.
2. **Always Close Sessions**:
   - When using `browserless_agent` with `keepSessionAlive: true`, always issue a final action with `action: "close"` or ensure the session terminates cleanly so running browsers do not waste units.
3. **Handle CAPTCHAs & Proxies Automatically**:
   - `browserless_smartscraper` automatically handles proxy rotation and CAPTCHAs when encountering anti-bot protections.
4. **Protect API Credentials**:
   - Never log or commit `BROWSERLESS_TOKEN` to source repositories.
