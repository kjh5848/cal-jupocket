/**
 * 미리 확인한 답변 모음(2026-11-15~) — 자주 나올 질문은 실시간 AI 를 부르지 않고 여기서 답한다.
 *
 * 답은 Claude Haiku 로 초안을 쓰고(자료: hug-kb), 사람이 원문 자료와 대조해 넣었다.
 * 테스트(hug-answers.test.ts)가 모든 답의 숫자가 hug-kb 에 있는지, cite 가 실제 자료인지 본다 —
 * rates 가 바뀌어 숫자가 달라지면 테스트가 깨져서 낡은 답이 그대로 나가지 않는다.
 *
 * 매칭은 브라우저에서 한다(AI 사용량 0). 애매하면(점수가 낮거나 1·2등이 비슷하면) 고르지 않고 AI 로 넘긴다 —
 * 엉뚱한 답을 자신 있게 보여 주는 것이 '모르겠다'보다 나쁘다.
 */
import data from "../data/hug-answers.json";
import { amountsIn } from "./loan-parse";

export interface BankAnswer {
  id: string;
  q: string[];
  /** 그 답에만 있는 핵심어(띄어쓰기 무시) */
  k: string[];
  a: string;
  cite: string[];
}

export const ANSWERS: BankAnswer[] = data.answers;
export const ANSWERS_VERIFIED_ON: string = data.verifiedOn;

const norm = (s: string) => s.toLowerCase().replace(/[^가-힣a-z0-9]/g, "");
// 어느 질문에나 붙는 말 — 이것만 겹쳐서 맞는 답으로 보이지 않게 뺀다
const STOP = new Set(["어요", "해요", "돼요", "나요", "세요", "까요", "가요", "는데", "어떻", "떻게", "게해", "뭐예", "예요", "이에", "에요", "있어", "어야", "해야", "되나", "하나", "인가", "인지", "할때"]);

function grams(s: string): Set<string> {
  const t = norm(s);
  const out = new Set<string>();
  for (let i = 0; i + 2 <= t.length; i++) {
    const g = t.slice(i, i + 2);
    if (!STOP.has(g)) out.add(g);
  }
  return out;
}

/** 두 문장의 2글자 조각 겹침(Dice). 띄어쓰기·맞춤법이 조금 달라도 같은 질문이면 높게 나온다 */
export function similarity(a: string, b: string): number {
  const x = grams(a);
  const y = grams(b);
  if (!x.size || !y.size) return 0;
  let n = 0;
  for (const g of x) if (y.has(g)) n++;
  return (2 * n) / (x.size + y.size);
}

/** 이 정도는 넘어야 같은 질문으로 본다 / 1등이 2등보다 이만큼은 앞서야 고른다 */
export const MIN_SCORE = 0.5;
export const MIN_MARGIN = 0.1;
/** 핵심어로 고를 때도 문장 겹침이 이만큼은 있어야 한다 — "다가구인데 보증료 얼마"처럼 핵심어만 스친 질문을 막는다 */
export const KEY_MIN_SCORE = 0.25;

export function matchAnswer(question: string): { answer: BankAnswer; score: number } | null {
  const text = question.trim();
  if (text.length < 4) return null;
  // 금액이 들어간 질문은 계산 쪽(AI 의 check)으로 — 미리 쓴 답은 그 사람 숫자를 모른다
  if (amountsIn(text).length) return null;
  const ranked = ANSWERS.map((e) => ({ e, s: Math.max(...e.q.map((v) => similarity(text, v))) })).sort((a, b) => b.s - a.s);
  const [first, second] = ranked;
  if (!first) return null;
  if (first.s >= MIN_SCORE && (!second || first.s - second.s >= MIN_MARGIN)) return { answer: first.e, score: first.s };
  // 짧게 물으면("선순위가 뭔데요") 문장 겹침이 낮다 — 그 답에만 있는 핵심어가 있고, 문장 겹침 1등도 같은 답일 때만 고른다
  const t = norm(text);
  const hits = ANSWERS.filter((e) => e.k.some((k) => t.includes(norm(k))));
  if (hits.length === 1 && hits[0].id === first.e.id && first.s >= KEY_MIN_SCORE) return { answer: first.e, score: first.s };
  return null;
}
