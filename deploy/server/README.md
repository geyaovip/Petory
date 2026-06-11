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

The container runs the TypeScript entrypoint with `tsx` without watch mode. This keeps the
production process deterministic while the legacy server type errors are repaired separately.

## First deployment

```bash
git clone git@github.com:geyaovip/petory.git /home/ubuntu/apps/petory/current
cd /home/ubuntu/apps/petory/current/deploy/server
cp env.example .env
# Fill production secrets in .env.
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8787/health
```

## Update

```bash
cd /home/ubuntu/apps/petory/current
git pull --ff-only
docker compose -f deploy/server/compose.yaml up -d --build
```

## Backup

```bash
mkdir -p /home/ubuntu/apps/petory/backups
docker compose -f deploy/server/compose.yaml exec -T postgres \
  pg_dump -U petory petory | gzip > /home/ubuntu/apps/petory/backups/petory-$(date +%F-%H%M%S).sql.gz
```
