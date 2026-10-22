/**
 * 부채 상환 계획 독일어판(/de/tools/debt-payoff/) 표기·읽기 — 계산은 lib/debt-payoff.ts payoffPlan() 그대로.
 *
 * 한국어판은 원 단위 정수로 계산한다(이자 원 미만 버림). 유로는 센트가 있어 독일어판은 **센트 정수**로 넘긴다 —
 * 잔액·최소 상환액·추가 상환액을 센트로 바꿔 payoffPlan 에 넣고, 나온 금액은 센트를 유로로 적는다.
 * 그래서 월 이자는 센트 미만 버림(공유 lib 의 '단위 미만 버림'이 센트에 걸린다).
 *
 *   1 234,56 Euro · November 2027 · 2 Jahre und 3 Monate · 14. Monat
 *
 * 금액 꼴은 lib/de/money.ts 와 같은 법령 원문 꼴(§ 32a EStG "12 348 Euro"·"914,51", 천 단위 공백·소수 쉼표·'Euro'),
 * 달 이름은 lib/de/date-format.ts 의 MONTHS_DE(BGB "vom 2. Januar 2002").
 */
import { MONTHS_DE, intDe } from "./date-format";
import { parseNumberDe } from "../percent";

/** 입력칸 유로 → 센트 정수. '1 500,50' · '1.500,5' · '1500' → 150050 · 150050 · 150000. 못 읽으면 0, 음수는 0 */
export function centsDe(raw: string): number {
  const x = parseNumberDe(raw);
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.round(x * 100);
}

/** 센트 정수 → '1 234,56 Euro' (센트가 0이어도 ',00' 을 붙인다 — 같은 표 안에서 자릿수를 맞춘다) */
export function euroCentDe(cents: number): string {
  const c = Math.round(cents);
  const abs = Math.abs(c);
  const s = `${intDe(Math.floor(abs / 100))},${String(abs % 100).padStart(2, "0")} Euro`;
  return c < 0 ? `-${s}` : s;
}

/** 몇 번째 달 → 'November 2027'. 1번째 달이 시작 연월 */
export function monthLabelDe(startYear: number, startMonth: number, month: number): string {
  const t = startYear * 12 + (startMonth - 1) + (month - 1);
  return `${MONTHS_DE[t % 12]} ${Math.floor(t / 12)}`;
}

/** 개월 → '2 Jahre und 3 Monate' · '1 Jahr' · '5 Monate' · '0 Monate' */
export function spellMonthsDe(months: number): string {
  const y = Math.floor(months / 12);
  const r = months % 12;
  const parts = [y ? `${y} ${y === 1 ? "Jahr" : "Jahre"}` : "", r ? `${r} ${r === 1 ? "Monat" : "Monate"}` : ""].filter(Boolean);
  return parts.join(" und ") || "0 Monate";
}
