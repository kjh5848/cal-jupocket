/**
 * HUG 전세 상담 리허설 — 실제 AI 를 부르지 않고 서버 파이프라인(hugChat)을 돌린다.
 *
 * fixtures/hug-cases.json     질문과 기대(계산표·자료 답·되묻기·범위 밖)
 * fixtures/hug-recorded.json  모델 답을 미리 받아 둔 것. 2026-11-08 은 Claude Code 서브에이전트(Haiku)로 받았다 —
 *                             실제 API 와 같은 모델이지만 감싸는 프롬프트가 달라 '근사치'다. 실 API 키가 생기면 다시 녹화한다.
 *
 * 녹화된 답을 가짜 AI 가 돌려주면 hugChat 이 숫자 검사·계산·다시 시키기를 그대로 거친다(비용 0).
 */
import { hugChat, type HugReply } from "../hug-chat";
import { SYSTEM, LEVEL_HINT, levelOf, type Msg } from "../../../../src/lib/hug-chat-core";
import cases from "./fixtures/hug-cases.json";

export type Case = (typeof cases.cases)[number] & { after?: string; next?: string };

export function historyOf(c: Case): Msg[] {
  const h: Msg[] = [];
  const level = levelOf(c.level);
  if (level) {
    const [u, a] = cases.greet[level];
    h.push({ role: "user", content: u }, { role: "assistant", content: a });
  }
  for (const t of c.turns) h.push({ role: "user", content: t });
  if (c.after && c.next) h.push({ role: "assistant", content: c.after }, { role: "user", content: c.next });
  return h;
}

/** 모델이 실제로 받는 system 문장(서버와 같은 규칙으로 만든다) */
export function systemOf(c: Case): string {
  const level = levelOf(c.level);
  return level ? `${SYSTEM}\n\n${LEVEL_HINT[level]}` : SYSTEM;
}

/** 녹화된 답(들)을 차례로 돌려주는 가짜 Workers AI 로 hugChat 을 돌린다 */
export async function replay(c: Case, recorded: unknown | unknown[]): Promise<{ status: number; body: HugReply; calls: number }> {
  const queue = Array.isArray(recorded) ? [...recorded] : [recorded];
  let calls = 0;
  const env = {
    DB: { prepare: () => ({ bind: () => ({ first: async () => ({ n: 1 }), run: async () => ({}) }) }) },
    AI: {
      run: async () => {
        calls++;
        const r = queue.length > 1 ? queue.shift() : queue[0];
        return { response: r };
      },
    },
  } as never;
  const res = await hugChat({ messages: historyOf(c), page: "rehearsal", level: c.level }, env, { ip: "0.0.0.0", day: "2026-11-08" });
  return { ...res, calls };
}

export const CASES = cases.cases as Case[];

/** 독자에게 나가는 글(문장 + 표) */
export function shown(b: HugReply): string {
  return [b.text ?? "", ...(b.lines ?? []).map((l) => `${l.label}: ${l.value}`)].join("\n");
}

export function kindOf(b: HugReply): "check" | "kb" | "ask" | "refuse" | "fallback" {
  if (b.lines?.length) return "check";
  if (b.text?.includes("HUG 전세보증과 버팀목 대출만")) return "refuse";
  if (b.sources?.length) return "kb";
  if (b.text?.startsWith("이 질문은 JU포켓이 확인한 HUG 자료로는")) return "fallback";
  return "ask";
}
