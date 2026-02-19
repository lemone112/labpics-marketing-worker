# labpics-marketing-worker

Cloudflare Worker to run trigger-based leadgen/winback outreach for Labpics.

It is designed to:
- fetch candidate contacts from Attio (and later your own DB)
- apply cooldowns + idempotency
- upsert contacts into Loops Audience
- trigger Loops event-based Loops (workflows) for sending emails

> This repo deploys to Cloudflare Workers via GitHub Actions + Wrangler.

## Quickstart (local)

```bash
npm i
cp wrangler.toml.example wrangler.toml # optional, but repo already includes wrangler.toml
npm run dev
```

## Deploy (GitHub Actions → Cloudflare Workers)

### 1) Add GitHub Actions secrets
Go to: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Required:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `LOOPS_API_KEY`

Optional (only if you implement Attio pulls):
- `ATTIO_API_KEY`

### 2) Push to main
Any push to `main` triggers deployment.

### 3) Endpoints
- `GET /health`
- `POST /send/test` (JSON: `{ "email": "ceo@lab.pics" }`)

## Notes
- Do NOT commit secrets to git.
- This repo intentionally does not send emails directly. Sending is done by Loops Loops (event-based) so replies, unsubscribes, and deliverability are handled there.
