---
name: vercel-troubleshooting
description: >-
  Diagnose and fix Vercel build failures, 500 runtime errors, function timeouts, deployment issues, and environment variable problems. Use when a deployment fails, crashes, or exhibits errors on Vercel.
---

# Vercel Troubleshooting & Diagnostics Runbook

Step-by-step diagnostic workflows for resolving build failures, runtime errors, and deployment issues on Vercel.

---

## 1. Diagnosing Build Failures

### Symptom: `Build Failed` or Exit Code 1 during build step
**Diagnostic Steps:**
1. Check build logs:
   ```bash
   vercel inspect <deployment-url>
   # or
   vercel logs <deployment-url>
   ```
2. **Common Root Causes & Fixes:**
   - **TypeScript / ESLint Errors during build**: Next.js fails the build on type or lint errors by default.
     - Fix: Run `tsc --noEmit` and `npm run lint` locally inside `/workspace` before deploying.
   - **Missing Dependencies**: Package imported in code but not listed in `package.json` `dependencies`.
     - Fix: Verify imports and run `npm install <missing-pkg>`.
   - **Incorrect Output Directory**: Static generators or custom build tools emitting to `dist` or `build` when Vercel expects `public` or `.next`.
     - Fix: In `vercel.json`, set `"outputDirectory": "dist"`.
   - **Node.js Version Mismatch**:
     - Fix: Specify `"engines": { "node": ">=20.x" }` in `package.json`.

---

## 2. Diagnosing 500 Internal Server Errors & Crashes

### Symptom: 500 status code on route or API handler
**Diagnostic Steps:**
1. Tail real-time runtime error logs:
   ```bash
   vercel logs <deployment-url>
   ```
   Or use the MCP tool `get_deployment_events`.
2. **Common Root Causes & Fixes:**
   - **Missing Environment Variable**: Code attempts to access `process.env.SECRET_KEY` which is `undefined` on Vercel.
     - Check configured variables: `vercel env ls`
     - Add missing variable: `echo -n "val" | vercel env add SECRET_KEY production --yes`
     - Redeploy or promote.
   - **Database Connection Pooling Exhaustion**: Serverless functions spawning unbounded connections.
     - Fix: Use connection poolers (e.g. Neon Serverless driver, Prisma Accelerate, PgBouncer) or instantiate the DB client globally outside request handler.

---

## 3. Function Invocations & Timeouts

### Symptom: `FUNCTION_INVOCATION_TIMEOUT` (Status 504)
**Root Causes & Fixes:**
- Default max duration on Hobby plan is 10s (up to 300s on Pro/Enterprise).
- Fix: Configure route segment `maxDuration`:
  ```ts
  // app/api/long-task/route.ts
  export const maxDuration = 60; // in seconds (requires Pro plan for > 10s)
  ```
- Or switch to streaming (`streamText`, `ReadableStream`) so the response starts immediately before processing finishes.

---

## 4. Cold Starts & Fluid Compute
- Ensure lightweight serverless function bundles.
- Avoid importing bulky node libraries into Edge routes.
- Use regional functions colocated with your database (e.g. `export const preferredRegion = 'iad1';`).

---

## 5. Emergency Rollbacks
If a production deployment causes an outage:
1. Roll back immediately to the last known healthy deployment:
   ```bash
   vercel rollback <healthy-deployment-url-or-id> --yes
   ```
2. Verify rollback status in `vercel inspect`.
