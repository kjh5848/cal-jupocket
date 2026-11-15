/**
 * POST /api/hug-chat — HUG 전세 상담(대화형, 2026-11-08~).
 *
 * 몸통: { messages: [{role, content}…], page, level? }. level(new|some|ready)은 첫 화면의 "얼마나 아세요" 선택. 대화는 서버에 남지 않고 매번 클라이언트가 최근 대화를 보낸다.
 * 모델은 src/lib/hug-kb 자료만 보고 답하고, src/lib/hug-chat-core 가 답의 숫자·인용·계산값을 검사한다.
 * 답하지 못한 질문만 글감으로 chat_questions 에 남긴다(IP 없음).
 */
import { SYSTEM, LEVEL_HINT, levelOf, cleanHistory, readModel, numbersGrounded, checkAnswer, sourcesFor, relevantKb, FALLBACK, NOTE, type Msg } from "../../../src/lib/hug-chat-core";
import { pickJson, bump, hashIp, DEFAULT_MODEL, type ChatEnv } from "./chat";

const FORMAT_REMINDER = '[답 형식 — 다시 한 번] 산문으로 답하지 말고, 반드시 {"reply": "...", "cite": ["자료 id"], "check": null 또는 {...}} 모양의 JSON 하나로만 답한다. 앞뒤에 다른 글자를 쓰지 않는다. 숫자는 [자료]에 있는 것만 쓴다.';

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

async function runModel(env: ChatEnv, system: string, history: Msg[], nudge?: string): Promise<unknown> {
  const out = (await env.AI.run((env.CHAT_MODEL || DEFAULT_MODEL) as Parameters<Ai["run"]>[0], {
    messages: [{ role: "system", content: system }, ...history, ...(nudge ? [{ role: "system", content: nudge }] : [])],
    max_tokens: 700,
    temperature: 0.1,
  } as never)) as { response?: unknown; choices?: { message?: { content?: string } }[] };
  if (out?.response && typeof out.response === "object") return out.response;
  const raw = typeof out?.response === "string" ? out.response : (out?.choices?.[0]?.message?.content ?? "");
  return pickJson(raw) ?? { unparsed: raw.slice(0, 1500) };
}

/** 모델에게 실제로 보내는 system·대화 — 리허설(Haiku 녹화)도 이 함수로 같은 것을 만든다 */
export function promptFor(history: Msg[], rawLevel: unknown): { system: string; shown: Msg[]; nudge: string } {
  const question = history[history.length - 1].content;
  // 첫 화면에서 고른 "얼마나 아세요" — 답의 깊이만 바꾼다
  const level = levelOf(rawLevel);
  // 자료가 길어 작은 모델이 앞쪽 자료로만 답하기 쉬워서, 질문과 가까운 자료를 먼저 짚어 준다
  const near = relevantKb(question);
  const focus = near.length ? `\n\n이 질문과 가장 가까운 자료: ${near.map((id) => `[${id}]`).join(", ")}. 이 자료부터 읽고, 맞으면 그 내용으로 답하고 cite 에 넣어라.` : "";
  const system = `${level ? `${SYSTEM}\n\n${LEVEL_HINT[level]}` : SYSTEM}${focus}`;
  // 이전 답이 산문으로 기록에 들어가면 모델이 그 꼴을 따라 첫 답을 늘 산문으로 냈다(2026-11-15 디버그로 확인).
  // 모델에게 보낼 때만 이전 답을 JSON 모양으로 감싼다 — 검사(readModel·numbersGrounded)는 원래 history 로 한다
  const shown = history.map((m) => (m.role === "assistant" ? { role: m.role, content: JSON.stringify({ reply: m.content, cite: [], check: null }) } : m));
  return { system, shown, nudge: FORMAT_REMINDER };
}

export async function hugChat(body: Record<string, unknown> | null, env: ChatEnv, opts: { ip: string; day: string; waitUntil?: (p: Promise<unknown>) => void; debug?: boolean }): Promise<{ status: number; body: HugReply & { debug?: unknown[] } }> {
  const history = cleanHistory(body?.messages);
  if (!history) return { status: 400, body: { ok: false, error: "messages" } };
  const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "";
  const question = history[history.length - 1].content;
  const { system, shown } = promptFor(history, body?.level);

  const ipKey = await hashIp(opts.ip, opts.day);
  if ((await bump(env, `ip:${ipKey}`, opts.day)) > PER_IP_DAY) return { status: 429, body: { ok: false, error: "rate" } };
  if ((await bump(env, "model", opts.day)) > MODEL_PER_DAY) return { status: 429, body: { ok: false, error: "busy" } };

  let reply: HugReply | null = null;
  const raws: unknown[] = [];
  let aiDown = false;
  // 한 번 어긋나면(형식·근거 없는 숫자) 한 번만 다시 시킨다
  let nudge: string | undefined = FORMAT_REMINDER;
  for (let i = 0; i < 2; i++) {
    let m;
    try {
      const raw = await runModel(env, system, shown, nudge);
      if (opts.debug) raws.push(raw);
      m = readModel(raw, history);
    } catch (e) {
      if (opts.debug) raws.push(String(e).slice(0, 200));
      // Workers AI 하루 무료 사용량(4006)·장애 — 질문 탓이 아니므로 글감으로 남기지 않고 '쉬어요'로 답한다
      aiDown = true;
      break;
    }
    nudge = "직전 답이 규칙을 어겼다. 자료에 있는 숫자만 쓰고, JSON 하나로만 다시 답하라.";
    if (!m) continue;
    if (m.checkRejected) {
      nudge = "직전 check 값이 틀렸다. senior 는 근저당 등 집에 먼저 잡힌 빚(없다고 했으면 0), price 는 집값, deposit 은 보증금이다. 사용자가 말한 금액을 맞는 칸에 넣어 JSON 하나로 다시 답하라.";
      continue;
    }
    if (m.check) {
      const c = checkAnswer(m.check);
      reply = { ok: true, text: c.text, lines: c.lines, sources: sourcesFor(["ltv", "deposit-cap", "house-price", "premium"]), note: NOTE };
      break;
    }
    if (!numbersGrounded(m.reply, history)) continue;
    reply = { ok: true, text: m.reply, sources: sourcesFor(m.cite), note: m.cite.length ? NOTE : undefined };
    break;
  }

  if (!reply && aiDown) return { status: 429, body: { ok: false, error: "ai", ...(opts.debug ? { debug: raws } : {}) } };
  const answered = reply && (reply.lines || reply.sources?.length);
  if (!answered) {
    const save = env.DB.prepare("INSERT INTO chat_questions (asked_on, page, question, kind, query_json) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(opts.day, page, question, reply ? "hug-nocite" : "hug-fallback", "{}")
      .run()
      .catch(() => {});
    if (opts.waitUntil) opts.waitUntil(save);
    else await save;
  }
  const out = reply ?? { ok: true, text: FALLBACK };
  return { status: 200, body: opts.debug ? { ...out, debug: raws } : out };
}
