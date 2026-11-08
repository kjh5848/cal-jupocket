/**
 * POST /api/chat — 대출 계산기 "AI에게 물어보기"(2026-11-08~).
 *
 *   1. 해석기(src/lib/loan-parse)가 금액·금리·기간·방식을 읽는다. 다 나오면 모델을 부르지 않는다
 *   2. 빠진 값이 있고 계산 질문으로 보이면 Workers AI 가 같은 칸(JSON)만 뽑는다 → validQuery 로 검사 → 빈칸만 채운다
 *   3. 답은 src/lib/loan-answer 의 틀 + loan.ts 계산. 모델이 쓴 문장·금액은 독자에게 가지 않는다
 *   4. 계산 못 한 질문(범위 밖·값 부족)은 글감으로 chat_questions 에 남긴다 — IP·기기 정보는 저장하지 않는다
 *
 * 남용 막기: 질문 300자, 같은 IP 하루 40회(IP 는 날짜를 섞은 해시로만 센다, 다음 날 지운다), 모델 호출 하루 3,000회.
 */
import { parseLoanQuery, validQuery, missing, type LoanQuery } from "../../../src/lib/loan-parse";
import { answer, ANSWER_NOTE } from "../../../src/lib/loan-answer";

export interface ChatEnv {
  DB: D1Database;
  AI: Ai;
  CHAT_MODEL?: string;
}

// 2026-11-08 비교(scripts/chat-eval.mjs, 계산 질문 80개를 모델 혼자): mistral-small 74 · llama-3.3-70b 68(가장 빠름, 방식을 지어 넣음) · gpt-oss-20b 66
export const DEFAULT_MODEL = "@cf/mistralai/mistral-small-3.1-24b-instruct";
const MAX_LEN = 300;
const PER_IP_DAY = 40;
const MODEL_PER_DAY = 3000;

const SYSTEM = `You extract loan parameters from a Korean question. Reply with ONLY a JSON object, no prose:
{"principal": number|null, "ratePct": number|null, "months": number|null, "method": "level"|"principal"|"bullet"|null, "graceMonths": number|null}
- principal: loan amount in KRW (원). 억=100000000, 만=10000. "3억 5천" = 350000000.
- ratePct: annual interest rate in percent (4.5 for 4.5%).
- months: total loan term in months INCLUDING grace period (30년 = 360).
- method: 원리금균등=level, 원금균등=principal, 만기일시/이자만=bullet. null if not stated or if the user compares methods.
- graceMonths: 거치기간 in months.
Use null for anything not stated in the question. Never guess or assume typical values.`;

/** 모델 출력에서 JSON 한 덩어리를 꺼낸다 */
export function pickJson(text: string): unknown {
  const t = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s < 0 || e <= s) return null;
  try {
    return JSON.parse(t.slice(s, e + 1));
  } catch {
    return null;
  }
}

export async function extractWithModel(env: ChatEnv, q: string, model = env.CHAT_MODEL || DEFAULT_MODEL): Promise<LoanQuery> {
  const out = (await env.AI.run(model as Parameters<Ai["run"]>[0], {
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: q },
    ],
    max_tokens: 200,
    temperature: 0,
  } as never)) as { response?: unknown; choices?: { message?: { content?: string } }[] };
  const raw = typeof out?.response === "string" ? out.response : typeof out?.response === "object" ? JSON.stringify(out.response) : (out?.choices?.[0]?.message?.content ?? "");
  const j = pickJson(raw);
  // 모델이 null 로 둔 칸은 validQuery 가 버린다
  return validQuery(j);
}

export async function hashIp(ip: string, day: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}|${ip}|jupocket-chat`));
  return [...new Uint8Array(h)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 오늘 이 키로 몇 번 왔나(+1). 하루 지난 줄은 지운다 */
export async function bump(env: ChatEnv, key: string, day: string): Promise<number> {
  const r = await env.DB.prepare("INSERT INTO chat_rate (key, day, n) VALUES (?1, ?2, 1) ON CONFLICT(key, day) DO UPDATE SET n = n + 1 RETURNING n")
    .bind(key, day)
    .first<{ n: number }>();
  return r?.n ?? 1;
}

export interface ChatResult {
  ok: boolean;
  kind?: "calc" | "ask" | "out";
  text?: string;
  lines?: { label: string; value: string }[];
  note?: string;
  query?: LoanQuery;
  source?: "parser" | "model";
  error?: string;
}

export async function chat(q: string, env: ChatEnv, opts: { ip: string; day: string; page?: string; waitUntil?: (p: Promise<unknown>) => void }): Promise<{ status: number; body: ChatResult }> {
  const question = q.trim().slice(0, MAX_LEN);
  if (!question) return { status: 400, body: { ok: false, error: "empty" } };

  const ipKey = await hashIp(opts.ip, opts.day);
  if ((await bump(env, `ip:${ipKey}`, opts.day)) > PER_IP_DAY) return { status: 429, body: { ok: false, error: "rate" } };

  let query = parseLoanQuery(question);
  let source: ChatResult["source"] = "parser";
  let a = answer(question, query);

  if (a.kind === "ask" && missing(query).length < 3 /* 숫자가 하나라도 있는 계산 질문 */) {
    if ((await bump(env, "model", opts.day)) <= MODEL_PER_DAY) {
      try {
        const m = await extractWithModel(env, question);
        const merged: LoanQuery = { ...m, ...Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined)) };
        const filled = validQuery(merged);
        if (missing(filled).length < missing(query).length) {
          query = filled;
          source = "model";
          a = answer(question, query);
        }
      } catch {
        /* 모델이 실패해도 해석기 결과로 답한다 */
      }
    }
  }

  if (a.kind !== "calc") {
    const save = env.DB.prepare("INSERT INTO chat_questions (asked_on, page, question, kind, query_json) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(opts.day, (opts.page ?? "").slice(0, 100), question, a.kind, JSON.stringify(query))
      .run()
      .catch(() => {});
    if (opts.waitUntil) opts.waitUntil(save);
    else await save;
  }

  return {
    status: 200,
    body: a.kind === "calc" ? { ok: true, kind: "calc", text: a.text, lines: a.lines, note: ANSWER_NOTE, query, source } : { ok: true, kind: a.kind, text: a.text, query: a.kind === "ask" ? query : undefined, source },
  };
}
