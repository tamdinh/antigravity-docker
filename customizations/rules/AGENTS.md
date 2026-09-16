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
