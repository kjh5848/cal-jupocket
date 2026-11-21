/**
 * POST /api/hug-chat — HUG 전세 상담(대화형, 2026-11-08~).
 *
 * 몸통: { messages: [{role, content}…], page, level? }. level(new|some|ready)은 첫 화면의 "얼마나 아세요" 선택. 대화는 서버에 남지 않고 매번 클라이언트가 최근 대화를 보낸다.
 * 모델은 src/lib/hug-kb 자료만 보고 답하고, src/lib/hug-chat-core 가 답의 숫자·인용·계산값을 검사한다.
 * 글로 적은 질문은 chat_questions 에 남긴다(IP 없음, 180일). kind 로 답했는지 가린다.
 */
import { SYSTEM, LEVEL_HINT, levelOf, cleanHistory, readModel, numbersGrounded, checkAnswer, sourcesFor, relevantKb, FALLBACK, NOTE, type Msg } from "../../../src/lib/hug-chat-core";
import Anthropic from "@anthropic-ai/sdk";
import { pickJson, bump, hashIp, DEFAULT_MODEL, type ChatEnv } from "./chat";

/** ANTHROPIC_API_KEY(워커 비밀값)가 있으면 Claude Haiku 로 답하고, 실패·거절이면 Workers AI(무료 한도)로 넘어간다(2026-11-19) */
type HugEnv = ChatEnv & { ANTHROPIC_API_KEY?: string; HUG_MODEL?: string };
const CLAUDE_MODEL = "claude-haiku-5-5";

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

async function runWorkersAi(env: ChatEnv, system: string, history: Msg[], nudge?: string, meter?: unknown[]): Promise<unknown> {
  const out = (await env.AI.run((env.CHAT_MODEL || DEFAULT_MODEL) as Parameters<Ai["run"]>[0], {
    messages: [{ role: "system", content: system }, ...history, ...(nudge ? [{ role: "system", content: nudge }] : [])],
    max_tokens: 700,
    temperature: 0.1,
  } as never)) as { response?: unknown; choices?: { message?: { content?: string } }[]; usage?: unknown };
  // 디버그(평가 키) 때만 토큰 사용량을 돌려준다 — 하루 무료 한도(뉴런)를 재는 데 쓴다
  if (meter) meter.push({ model: "workers-ai", usage: out?.usage ?? null });
  if (out?.response && typeof out.response === "object") return out.response;
  const raw = typeof out?.response === "string" ? out.response : (out?.choices?.[0]?.message?.content ?? "");
  return pickJson(raw) ?? { unparsed: raw.slice(0, 1500) };
}

/**
 * Claude Haiku — 고정 자료(SYSTEM)를 첫 system 블록에 두고 캐시 표시를 붙인다. 질문마다 바뀌는 수준·가까운 자료 줄은
 * 그 뒤 블록에, 형식 재알림은 대화 끝 system 메시지로 둬서 캐시가 깨지지 않게 한다(캐시는 앞부분이 같아야 맞는다).
 * 짧은 JSON 답이라 생각(thinking)은 끄고 effort 는 low. Haiku 5.5 는 temperature 를 바꾸면 400 이라 보내지 않는다.
 */
async function runClaude(key: string, model: string, fixed: string, varying: string, history: Msg[], nudge?: string, meter?: unknown[]): Promise<unknown> {
  const client = new Anthropic({ apiKey: key, maxRetries: 1, timeout: 25_000 });
  const system: Anthropic.TextBlockParam[] = [{ type: "text", text: fixed, cache_control: { type: "ephemeral" } }];
  if (varying) system.push({ type: "text", text: varying });
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    ...(nudge ? [{ role: "system", content: nudge }] : []),
  ] as Anthropic.MessageParam[];
  const res = await client.messages.create({
    model,
    max_tokens: 700,
    system,
    messages,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
  } as Anthropic.MessageCreateParamsNonStreaming);
  if (meter) meter.push({ model, stop: res.stop_reason, usage: res.usage });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  const raw = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return pickJson(raw) ?? { unparsed: raw.slice(0, 1500) };
}

async function runModel(env: HugEnv, p: { system: string; fixed: string; varying: string }, history: Msg[], nudge?: string, meter?: unknown[]): Promise<unknown> {
  if (env.ANTHROPIC_API_KEY) {
    try {
      return await runClaude(env.ANTHROPIC_API_KEY, env.HUG_MODEL || CLAUDE_MODEL, p.fixed, p.varying, history, nudge, meter);
    } catch (e) {
      // 키 만료·한도 초과·장애·거절 — 무료 모델로 넘어간다
      if (meter) meter.push({ claudeError: String(e).slice(0, 200) });
    }
  }
  return runWorkersAi(env, p.system, history, nudge, meter);
}

/** 모델에게 실제로 보내는 system·대화 — 리허설(Haiku 녹화)도 이 함수로 같은 것을 만든다 */
export function promptFor(history: Msg[], rawLevel: unknown): { system: string; fixed: string; varying: string; shown: Msg[]; nudge: string } {
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
  const varying = `${level ? LEVEL_HINT[level] : ""}${focus}`.trim();
  return { system, fixed: SYSTEM, varying, shown, nudge: FORMAT_REMINDER };
}

export async function hugChat(body: Record<string, unknown> | null, env: HugEnv, opts: { ip: string; day: string; waitUntil?: (p: Promise<unknown>) => void; debug?: boolean }): Promise<{ status: number; body: HugReply & { debug?: unknown[] } }> {
  const history = cleanHistory(body?.messages);
  if (!history) return { status: 400, body: { ok: false, error: "messages" } };
  const page = typeof body?.page === "string" ? body.page.slice(0, 100) : "";
  const question = history[history.length - 1].content;
  const prompt = promptFor(history, body?.level);
  const { shown } = prompt;

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
      const raw = await runModel(env, prompt, shown, nudge, opts.debug ? raws : undefined);
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
  // 글로 적은 질문은 답했든 못 했든 남긴다(2026-11-21) — 무엇을 묻는지 보고 답변 모음·글감을 고친다. IP·기기 정보는 없다
  const kind = !reply ? "hug-fallback" : reply.lines ? "hug-check" : answered ? "hug-ok" : "hug-nocite";
  // 글자가 깨져 온 질문(UTF-8 이 아닌 채로 보낸 것 — 브라우저가 아니라 터미널 시험)은 남기지 않는다. 읽을 수 없어 쓸모가 없다
  const save = question.includes("�")
    ? Promise.resolve()
    : env.DB.prepare("INSERT INTO chat_questions (asked_on, page, question, kind, query_json) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(opts.day, page, question, kind, "{}")
        .run()
        .catch(() => {});
  if (opts.waitUntil) opts.waitUntil(save);
  else await save;
  const out = reply ?? { ok: true, text: FALLBACK };
  return { status: 200, body: opts.debug ? { ...out, debug: raws } : out };
}
