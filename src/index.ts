export interface Env {
  LOOPS_API_KEY: string;
  ATTIO_API_KEY?: string;
  LOOPS_EVENT_NAME: string;
  DEFAULT_TEST_EMAIL: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function readBody(req: Request): Promise<any> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await req.json();
  return {};
}

async function loopsUpsertContact(env: Env, args: {
  email: string;
  firstName?: string;
  lastName?: string;
  subscribed?: boolean;
  mailingLists?: Record<string, boolean>;
  userGroup?: string;
  source?: string;
}): Promise<any> {
  // Loops public API uses API key auth; endpoint names may differ by plan.
  // This Worker focuses on orchestration; use the official Loops docs for the exact endpoint.
  // NOTE: In this environment we used Composio tools, but in production you will call Loops HTTPS API directly.
  const res = await fetch("https://app.loops.so/api/v1/contacts/update", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.LOOPS_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok) throw new Error(`Loops update contact failed: ${res.status} ${text}`);
  return data;
}

async function loopsSendEvent(env: Env, args: {
  email: string;
  eventName: string;
  idempotencyKey?: string;
  eventProperties?: Record<string, any>;
}): Promise<any> {
  const res = await fetch("https://app.loops.so/api/v1/events/send", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.LOOPS_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok) throw new Error(`Loops send event failed: ${res.status} ${text}`);
  return data;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/health") {
      return json({ ok: true });
    }

    if (req.method === "POST" && url.pathname === "/send/test") {
      const body = await readBody(req);
      const email = body.email || env.DEFAULT_TEST_EMAIL;

      // 1) upsert contact (optional, but helpful)
      await loopsUpsertContact(env, {
        email,
        firstName: "Даниил",
        subscribed: true,
        // Put your real list IDs here (example uses your Loops list "Лид")
        mailingLists: {
          "cmlhr4n2a0ap80iy25dtv4erc": true,
        },
        userGroup: "lead_ui_audit_v1",
        source: "labpics-marketing-worker",
      });

      // 2) send event (your Loops UI Loop must listen to this eventName)
      const now = new Date().toISOString();
      const eventName = body.eventName || env.LOOPS_EVENT_NAME;
      const idempotencyKey = `test:${email}:${now}`;

      const result = await loopsSendEvent(env, {
        email,
        eventName,
        idempotencyKey,
        eventProperties: {
          variant: "A",
          sender_name: "Даниил из Лабпикс",
          subject: "3 идеи по UI?",
          body_opening: "Привет! Я Даниил из Лабпикс.",
          body_offer:
            "Увидел(а) ваш продукт — есть 3 быстрых идеи по UI (иерархия/поток/копирайт в интерфейсе).",
          body_question: "Ок, если пришлю одним письмом?",
          goal: "reply_rate",
          service: "design",
        },
      });

      return json({ ok: true, email, eventName, idempotencyKey, result });
    }

    if (req.method === "POST" && url.pathname === "/jobs/attio/prospects") {
      // Stub: implement later.
      // Plan:
      // - query Attio people/companies
      // - apply filters (ICP, has email, not contacted recently)
      // - upsert into Loops + trigger events
      return json({ ok: true, message: "not implemented" }, 501);
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
