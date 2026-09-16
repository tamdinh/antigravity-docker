---
name: vercel-deploy
description: >-
  Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy to Vercel", "push this live", "create a preview deployment", or configure CI/CD deployments.
---

# Deploy to Vercel

Deploy web applications, static sites, and APIs to Vercel directly from the container using the Vercel CLI or Git integration.

## Prerequisites
- `vercel` CLI installed (`which vercel`).
- Authentication:
  - If `VERCEL_TOKEN` is exported in the environment, commands can authenticate seamlessly via `vercel --token "$VERCEL_TOKEN"`.
  - Alternatively, ensure `~/.vercel/auth.json` contains a valid authentication token.
- A project ready for deployment in the current directory or workspace.

---

## Deployment Workflows

### 1. Preview Deployment (Default)
Generates an isolated preview URL to verify changes before going to production.
```bash
# Non-interactive preview deployment
vercel --yes
```
- Outputs: Inspection URL and Unique Deployment Preview URL (e.g. `https://my-project-abc123-team.vercel.app`).
- Verify that the deployment build completed successfully by checking the returned URL.

### 2. Production Deployment
Deploys directly to the production domain(s) configured for the project.
```bash
# Non-interactive production deployment
vercel --prod --yes
```

### 3. Prebuilt Deployment (`--prebuilt`)
Useful for continuous integration pipelines or when building locally before uploading:
```bash
# Step 1: Pull project configuration and environment
vercel pull --yes --environment=production

# Step 2: Build the project locally with Vercel build output spec (.vercel/output)
vercel build --prod

# Step 3: Deploy the prebuilt output
vercel deploy --prebuilt --prod --yes
```

### 4. Linking to Existing Projects
Link the local directory to an existing Vercel project without interactive prompts:
```bash
vercel link --yes --project <project-name>
```
If working under a team scope:
```bash
vercel link --yes --scope <team-slug-or-id> --project <project-name>
```

---

## Verification & Follow-up
1. **Check Deployment Status**:
   ```bash
   vercel inspect <deployment-url>
   ```
2. **View Live Runtime / Build Logs**:
   ```bash
   vercel logs <deployment-url>
   ```
3. **Rollback (if needed)**:
   ```bash
   vercel rollback <deployment-url> --yes
   ```
4. **Promote Preview to Production**:
   ```bash
   vercel promote <deployment-url> --yes
   ```
