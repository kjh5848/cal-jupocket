/**
 * api.jupocket.com — JU포켓 서버 쪽 기능(2026-11-07~).
 *
 *   POST /api/hug-chat      HUG 전세 상담(hug-chat.ts) — 확인한 자료로만 답하고, 가입 여부 숫자는 계산 코드에서만 나온다
 *   POST /api/chat/eval     모델 비교용(EVAL_KEY 헤더가 맞을 때만) — 모델이 뽑은 값과 걸린 시간
 *   POST /push/subscribe    구독 + 일정 저장(같은 구독이면 아직 안 보낸 알림을 새 일정으로 바꾼다)
 *   POST /push/unsubscribe  구독과 알림을 지운다
 *   GET  /health
 *   예약 작업(매일 00:00 UTC = 09:00 KST) 오늘 보낼 알림을 보낸다
 *
 * 저장하는 것: 브라우저 푸시 주소·키, 할 일 날짜. 이름·연락처·금액은 받지 않는다.
 */
import { sendPush, type Vapid } from "./webpush";
import { expandReminders, validEndpoint, todayKst, addDays } from "./reminders";
import { extractWithModel } from "./chat";
import { hugChat } from "./hug-chat";

export interface Env {
  DB: D1Database;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  AI: Ai;
  CHAT_MODEL?: string;
  EVAL_KEY?: string;
}

const ORIGINS = new Set(["https://jupocket.com", "https://www.jupocket.com", "http://localhost:4321"]);
const SUBJECT = "https://jupocket.com";

function cors(req: Request): Record<string, string> {
  const o = req.headers.get("Origin") ?? "";
  return ORIGINS.has(o)
    ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" }
    : {};
}

const json = (req: Request, data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(req) } });

async function subId(endpoint: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const vapidOf = (env: Env): Vapid => ({ publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE, subject: SUBJECT });

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("Content-Length") ?? 0) > 32_768) return null;
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function subscribe(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const b = await readBody(req);
  const sub = b?.subscription as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | undefined;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!validEndpoint(endpoint) || typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 50) {
    return json(req, { ok: false, error: "subscription" }, 400);
  }
  const rows = expandReminders(b?.items, todayKst());
  if (!rows) return json(req, { ok: false, error: "items" }, 400);
  const platform = typeof b?.platform === "string" ? b.platform.slice(0, 20) : null;

  const id = await subId(endpoint);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO subscriptions (id, endpoint, p256dh, auth, platform, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO UPDATE SET p256dh = ?3, auth = ?4, platform = ?5",
    ).bind(id, endpoint, p256dh, auth, platform, now),
    env.DB.prepare("DELETE FROM reminders WHERE sub_id = ?1 AND sent_at IS NULL").bind(id),
    ...rows.map((r) => env.DB.prepare("INSERT INTO reminders (sub_id, send_on, title, body, url, tag) VALUES (?1, ?2, ?3, ?4, ?5, ?6)").bind(id, r.sendOn, r.title, r.body, r.url, r.tag)),
  ]);

  // 설정이 됐다는 확인 알림 — 사용자가 알림이 실제로 오는지 바로 본다
  ctx.waitUntil(
    sendPush(
      { endpoint, p256dh, auth },
      { title: "JU포켓 알림이 설정됐습니다", body: rows.length ? `전세 일정 알림 ${rows.length}건을 날짜에 맞춰 보내 드립니다.` : "남은 일정이 없어 보낼 알림이 없습니다.", url: "/guide/hug-jeonse-checklist/?source=push", tag: "subscribed" },
      vapidOf(env),
      3600,
    ).catch(() => 0),
  );
  const next = rows.map((r) => r.sendOn).sort()[0] ?? null;
  return json(req, { ok: true, count: rows.length, next });
}

async function unsubscribe(req: Request, env: Env): Promise<Response> {
  const b = await readBody(req);
  if (!validEndpoint(b?.endpoint)) return json(req, { ok: false, error: "endpoint" }, 400);
  const id = await subId(b.endpoint as string);
  await env.DB.batch([env.DB.prepare("DELETE FROM reminders WHERE sub_id = ?1").bind(id), env.DB.prepare("DELETE FROM subscriptions WHERE id = ?1").bind(id)]);
  return json(req, { ok: true });
}

interface DueRow {
  id: number;
  sub_id: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** 오늘(그리고 놓친 어제)치 알림을 보낸다. 끝난 구독(404·410)은 지운다 */
export async function sendDue(env: Env, today = todayKst()): Promise<{ sent: number; gone: number; failed: number }> {
  const { results } = await env.DB.prepare(
    "SELECT r.id, r.sub_id, r.title, r.body, r.url, r.tag, s.endpoint, s.p256dh, s.auth FROM reminders r JOIN subscriptions s ON s.id = r.sub_id WHERE r.sent_at IS NULL AND r.send_on <= ?1 AND r.send_on >= ?2 ORDER BY r.send_on LIMIT 500",
  )
    .bind(today, addDays(today, -1))
    .all<DueRow>();
  let sent = 0, gone = 0, failed = 0;
  const goneSubs = new Set<string>();
  for (const r of results) {
    if (goneSubs.has(r.sub_id)) continue;
    let status = 0;
    try {
      status = await sendPush(r, { title: r.title, body: r.body, url: r.url, tag: r.tag }, vapidOf(env));
    } catch {
      status = 0;
    }
    if (status === 404 || status === 410) {
      goneSubs.add(r.sub_id);
      gone++;
    } else if (status >= 200 && status < 300) {
      await env.DB.prepare("UPDATE reminders SET sent_at = ?1 WHERE id = ?2").bind(new Date().toISOString(), r.id).run();
      sent++;
    } else {
      failed++;
    }
  }
  for (const id of goneSubs) {
    await env.DB.batch([env.DB.prepare("DELETE FROM reminders WHERE sub_id = ?1").bind(id), env.DB.prepare("DELETE FROM subscriptions WHERE id = ?1").bind(id)]);
  }
  // 오래된 기록 정리 — 보낸 지 30일 지난 알림, 놓친 지 오래된 알림
  await env.DB.prepare("DELETE FROM reminders WHERE send_on < ?1").bind(addDays(today, -30)).run();
  // 질문 횟수 세기는 그날만 쓴다
  await env.DB.prepare("DELETE FROM chat_rate WHERE day < ?1").bind(today).run();
  // 글감으로 모은 질문은 180일만 둔다(개인정보 처리방침과 같은 기간)
  await env.DB.prepare("DELETE FROM chat_questions WHERE asked_on < ?1").bind(addDays(today, -180)).run();
  return { sent, gone, failed };
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (pathname === "/health") return json(req, { ok: true });
    if (req.method === "POST" && pathname === "/push/subscribe") return subscribe(req, env, ctx);
    if (req.method === "POST" && pathname === "/push/unsubscribe") return unsubscribe(req, env);
    if (req.method === "POST" && pathname === "/api/hug-chat") {
      const r = await hugChat(await readBody(req), env, { ip: req.headers.get("CF-Connecting-IP") ?? "", day: todayKst(), waitUntil: (p) => ctx.waitUntil(p) });
      return json(req, r.body, r.status);
    }
    if (req.method === "POST" && pathname === "/api/chat/eval") {
      if (!env.EVAL_KEY || req.headers.get("X-Eval-Key") !== env.EVAL_KEY) return json(req, { ok: false }, 403);
      const b = await readBody(req);
      if (typeof b?.q !== "string" || typeof b?.model !== "string") return json(req, { ok: false }, 400);
      const t0 = Date.now();
      try {
        const query = await extractWithModel(env, b.q, b.model);
        return json(req, { ok: true, query, ms: Date.now() - t0 });
      } catch (e) {
        return json(req, { ok: false, error: String(e).slice(0, 200), ms: Date.now() - t0 });
      }
    }
    return json(req, { ok: false, error: "not found" }, 404);
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendDue(env).then((r) => console.log("push", JSON.stringify(r))));
  },
} satisfies ExportedHandler<Env>;
