# Deploying BugPin on Railway

`railway.json` handles the build (Dockerfile), healthcheck (`/health`), restart policy,
and refuses to deploy unless a volume is mounted at `/data`. A few settings can't be
expressed in config-as-code and must be set once in the Railway dashboard:

1. **New Project → Deploy from GitHub repo** → select this fork.
2. **Add a Volume** to the service, mount path: `/data`
   (SQLite database, uploads and the session secret live here).
3. **Variables** → add `RAILWAY_RUN_UID=0`
   (the image runs as the non-root `bun` user; Railway volumes are root-owned).
4. **Settings → Networking → Generate Domain**, target port **7300**
   (the port is hardcoded in `src/server/config.ts`). Optionally add a custom domain.
5. Open the domain and log in with `admin@example.com` / `changeme123`.
   **Change the email and password immediately.**

Keep the service at 1 replica — SQLite on a single volume does not support more.

## Updating from upstream

```bash
git fetch upstream
git merge upstream/main
git push origin main   # Railway redeploys automatically
```
