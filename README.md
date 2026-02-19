# labpics-marketing-worker

Cloudflare Worker to run trigger-based leadgen/winback outreach for Labpics.

It is designed to:
- fetch candidate contacts from Attio (and later your own DB)
- apply cooldowns + idempotency
- upsert contacts into Loops Audience
- trigger Loops event-based Loops (workflows) for sending emails

## Why a Worker?
Cloudflare Workers are enough for this service because it is mostly:
- HTTP endpoints
- scheduled jobs
- small fan-out API calls
- simple persistence for idempotency/cooldowns (D1/KV)

## Quickstart

### 1) Install
```bash
npm i
```

### 2) Configure
Copy `wrangler.toml.example` to `wrangler.toml` and set your bindings.

### 3) Dev
```bash
npm run dev
```

### 4) Deploy
```bash
npm run deploy
```

## Endpoints

- `POST /send/test` — sends a test Loops event to a specified email (defaults to `ceo@lab.pics`).
- `POST /jobs/attio/prospects` — stub job: would pull prospects from Attio and trigger Loops events.

## Environment / Secrets
Set these via `wrangler secret put ...`:
- `LOOPS_API_KEY`
- `ATTIO_API_KEY`

## Notes
This repo intentionally avoids sending emails directly. Sending is done by Loops Loops (event-based) so replies, unsubscribes, and deliverability are handled there.
