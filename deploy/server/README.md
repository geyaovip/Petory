# Petory Server Deployment

Petory uses a dedicated Compose project on the shared cloud server. It does not reuse CryptoPilot containers, ports, volumes, or environment files.

## Server layout

```text
/home/ubuntu/apps/petory/
  current/                 # Git checkout
    deploy/server/.env     # Production secrets, never committed
  backups/                 # Database backups
```

## Ports

| Service | Binding |
|---|---|
| Petory API | `127.0.0.1:8787` |
| Petory PostgreSQL | Compose network only |

The public API should be exposed through Cloudflare Tunnel as `api.petory.chat`.

The shared tunnel configuration is documented in
`cloudflared-config.example.yml`. Keep the CryptoPilot route first, add Petory
as a separate hostname, and retain the final `http_status:404` catch-all.

```bash
sudo cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.backup-$(date +%Y%m%d-%H%M%S)
sudo install -o root -g root -m 600 \
  cloudflared-config.example.yml /etc/cloudflared/config.yml
sudo systemctl restart cloudflared
```

The container runs the TypeScript entrypoint with `tsx` without watch mode. This keeps the
production process deterministic while the legacy server type errors are repaired separately.

## First deployment

```bash
git clone git@github.com:geyaovip/petory.git /home/ubuntu/apps/petory/current
cd /home/ubuntu/apps/petory/current/deploy/server
cp env.example .env
# Fill production secrets in .env.
# Magic Link login requires RESEND_API_KEY and a verified MAIL_FROM domain.
# Remote image generation (logged-in users) requires ARK_API_KEY from Volcengine Ark / Seedream.
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8787/health
```

Production health check: `https://api.petory.chat/health`.

## Update

```bash
cd /home/ubuntu/apps/petory/current
git pull --ff-only
docker compose -f deploy/server/compose.yaml up -d --build
docker compose -f deploy/server/compose.yaml exec -T api npx prisma db push
curl http://127.0.0.1:8787/health
```

Verify image API is configured (`imageApi: true`):

```bash
curl -s https://api.petory.chat/health
```

### Deploy from local (recommended)

On your Mac (SSH access to VPS, `server/.env` filled):

```bash
npm run deploy:server
```

This merges ARK / mail / chat keys into `deploy/server/.env`, uploads it, `git pull`, rebuilds API, runs `prisma db push`, and checks `/health` (`imageApi: true`).

Options:

```bash
npm run deploy:server -- --env-only    # sync secrets only
npm run deploy:server -- --skip-env    # code rebuild without touching .env
```

Override host: `PETORY_DEPLOY_HOST=ubuntu@YOUR_HOST npm run deploy:server`

Mirror installers to `https://api.petory.chat/downloads/`:

```bash
npm run deploy:downloads               # from local release/
npm run deploy:downloads -- --from-github
```

Never commit `deploy/server/.env`.

## Backup

```bash
mkdir -p /home/ubuntu/apps/petory/backups
docker compose -f deploy/server/compose.yaml exec -T postgres \
  pg_dump -U petory petory | gzip > /home/ubuntu/apps/petory/backups/petory-$(date +%F-%H%M%S).sql.gz
```
