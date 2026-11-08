/**
 * POST /api/hug-chat — HUG 전세 상담(대화형, 2026-11-08~).
 *
 * 몸통: { messages: [{role, content}…], page }. 대화는 서버에 남지 않고 매번 클라이언트가 최근 대화를 보낸다.
 * 모델은 src/lib/hug-kb 자료만 보고 답하고, src/lib/hug-chat-core 가 답의 숫자·인용·계산값을 검사한다.
 * 답하지 못한 질문만 글감으로 chat_questions 에 남긴다(IP 없음).
 */
import { SYSTEM, cleanHistory, readModel, numbersGrounded, checkAnswer, sourcesFor, FALLBACK, NOTE, type Msg } from "../../../src/lib/hug-chat-core";
import { pickJson, bump, hashIp, DEFAULT_MODEL, type ChatEnv } from "./chat";

const PER_IP_DAY = 60;
const MODEL_PER_DAY = 3000;

export interface HugReply {
  ok: boolean;
  text?: string;
  lines?: { label: string; value: string }[];
  sources?: { name: string; url: string }[];
  note?: string;
  error?: string;
}

async function runModel(env: ChatEnv, history: Msg[], nudge?: string): Promise<unknown> {
  const out = (await env.AI.run((env.CHAT_MODEL || DEFAULT_MODEL) as Parameters<Ai["run"]>[0], {
    messages: [{ role: "system", content: SYSTEM }, ...history, ...(nudge ? [{ role: "system", content: nudge }] : [])],
    max_tokens: 700,
    temperature: 0.1,
  } as never)) as { response?: unknown; choices?: { message?: { content?: string } }[] };
  if (out?.response && typeof out.response === "object") return out.response;
  const raw = typeof out?.response === "string" ? out.response : (out?.choices?.[0]?.message?.content ?? "");
  return pickJson(raw);
}

export async function hugChat(body: Record<string, unknown> | null, env: ChatEnv, opts: { ip: string; day: string; waitUntil?: (p: Promise<unknown>) => void }): Promise<{ status: number; body: HugReply }> {
  const history = cleanHistory(body?.messages);
  if (!history) return { status: 400, body: { ok: false, error: "messages" } };
  const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "";
  const question = history[history.length - 1].content;

  const ipKey = await hashIp(opts.ip, opts.day);
  if ((await bump(env, `ip:${ipKey}`, opts.day)) > PER_IP_DAY) return { status: 429, body: { ok: false, error: "rate" } };
  if ((await bump(env, "model", opts.day)) > MODEL_PER_DAY) return { status: 429, body: { ok: false, error: "busy" } };

  let reply: HugReply | null = null;
  // 한 번 어긋나면(형식·근거 없는 숫자) 한 번만 다시 시킨다
  for (const nudge of [undefined, "직전 답이 규칙을 어겼다. 자료에 있는 숫자만 쓰고, JSON 하나로만 다시 답하라."]) {
    let m;
    try {
      m = readModel(await runModel(env, history, nudge), history);
    } catch {
      break;
    }
    if (!m) continue;
    if (m.check) {
      const c = checkAnswer(m.check);
      reply = { ok: true, text: c.text, lines: c.lines, sources: sourcesFor(["ltv", "deposit-cap", "house-price"]), note: NOTE };
      break;
    }
    if (!numbersGrounded(m.reply, history)) continue;
    reply = { ok: true, text: m.reply, sources: sourcesFor(m.cite), note: m.cite.length ? NOTE : undefined };
    break;
  }

  const answered = reply && (reply.lines || reply.sources?.length);
  if (!answered) {
    const save = env.DB.prepare("INSERT INTO chat_questions (asked_on, page, question, kind, query_json) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(opts.day, page, question, reply ? "hug-nocite" : "hug-fallback", "{}")
      .run()
      .catch(() => {});
    if (opts.waitUntil) opts.waitUntil(save);
    else await save;
  }
  return { status: 200, body: reply ?? { ok: true, text: FALLBACK } };
}
