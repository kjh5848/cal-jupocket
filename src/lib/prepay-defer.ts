/**
 * 적금 선납이연 — 정기적금 월저축금을 몇 회차씩 묶어 일찍(선납)·늦게(이연) 넣었을 때 만기가 어떻게 되나.
 *
 * 적립식예금약관 제4조 (rates: installment-savings-2026.json prepayDefer)
 *   ① 매월 약정한 날짜에 넣었을 때 만기지급금 = 원금 + 저축금마다 입금일부터 만기일 전날까지의 이자(계약금액)
 *   ③ 늦게 넣으면 순지연일수 = 총지연일수 − 총선납일수. 은행은 입금지연이율로 셈한 금액을 계약금액에서 빼거나,
 *      순지연일수 ÷ 계약월수 = 월평균 지연일수만큼 만기일을 늦출 수 있다.
 *   ④ 총선납일수가 총지연일수보다 많으면 계약금액만 준다 — 일찍 넣었다고 이자가 늘지 않는다.
 *   제7조 ③ 자유적립식에는 ③④ 가 적용되지 않는다.
 *
 * 그래서 이자는 매달 약정일에 낸 것과 같다(installmentSavings). 이 파일은 날짜만 셈한다.
 *   선납일수 = 약정일 − 실제 입금일(양수), 지연일수 = 실제 입금일 − 약정일(양수)
 *   순지연일수 = Σ(실제 입금일 − 약정일)
 * 약정일·만기일: 가입일과 같은 날짜, 그 날짜가 없는 달은 말일(민법 제160조 ③ 의 월 계산을 따름 — 약관에 따로 없다).
 * 월평균 지연일수의 소수 처리는 약관에 없다 — 소수 그대로 두고 버림·올림 두 날짜를 함께 낸다.
 * 입금지연이율(은행 게시 이율)로 빼는 금액은 숫자가 없어 셈하지 않는다.
 */
import { installmentSavings, type SavingsMethod, type SavingsResult } from "./installment-savings";

const DAY = 86_400_000;

/** "YYYY-MM-DD" → 1970-01-01 부터의 일수(UTC 정수). 형식이 틀리면 NaN */
export function dayNo(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return NaN;
  const y = +m[1], mo = +m[2], d = +m[3];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return NaN;
  return t / DAY;
}

export function isoOf(day: number): string {
  return new Date(day * DAY).toISOString().slice(0, 10);
}

/** 가입일에서 k개월 뒤 같은 날짜, 없으면 그 달 말일 */
export function addMonths(startDay: number, k: number): number {
  const s = new Date(startDay * DAY);
  const y = s.getUTCFullYear(), m = s.getUTCMonth() + k, d = s.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d, last)) / DAY;
}

/** "6-1-5" → [6, 1, 5]. 숫자가 아니거나 0 이하가 섞이면 null */
export function parseGroups(text: string): number[] | null {
  const parts = text.split(/[-–—,\s]+/).filter(Boolean);
  if (!parts.length) return null;
  const g = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : NaN));
  return g.every((n) => Number.isInteger(n) && n > 0) ? g : null;
}

export interface PrepayDeferInput {
  /** 가입일(1회차 약정일) "YYYY-MM-DD" */
  start: string;
  /** 계약 개월 수 = 회차 수 */
  months: number;
  monthly: number;
  ratePct: number;
  method: SavingsMethod;
  /** 묶음 — [6, 1, 5] 는 1회차 날 6회분, 7회차 날 1회분, 마지막 묶음 날 5회분. 합이 months 여야 한다 */
  groups: number[];
  /** 마지막 묶음을 넣는 날 "YYYY-MM-DD". 비우면 만기가 안 늦어지는 가장 늦은 날(만기 전날까지) */
  lastDate?: string;
}

export interface PrepayDeferRow {
  round: number;
  due: string;
  paid: string;
  early: number;
  late: number;
}

export interface PrepayDeferResult {
  ok: true;
  rows: PrepayDeferRow[];
  totalEarly: number;
  totalLate: number;
  /** 순지연일수 = 총지연 − 총선납 (음수면 선납이 더 많다 — 제4조 ④ 계약금액만) */
  net: number;
  /** 월평균 지연일수 = 순지연 ÷ 계약월수 (순지연이 0 이하면 0) */
  avgDelay: number;
  maturity: string;
  /** 만기를 늦출 때 — 월평균 지연일수 버림·올림 (같으면 같은 날) */
  delayedFloor: string;
  delayedCeil: string;
  lastDate: string;
  /** 마지막 묶음을 이 날까지 넣으면 순지연이 0 이하(만기 전날을 넘지 않게) */
  latestLastDate: string;
  /** 사용자가 고른 마지막 묶음 날이 만기일 이후 — 약관 제6조 ③(만기까지 다 넣지 않으면 중도해지이율) */
  afterMaturity: boolean;
  /** 마지막 묶음 날이 그 앞 묶음보다 이르다 */
  beforePrevious: boolean;
  savings: SavingsResult;
}

export type PrepayDeferError = { ok: false; reason: "date" | "groups" | "sum" };

export function prepayDefer(input: PrepayDeferInput): PrepayDeferResult | PrepayDeferError {
  const months = Math.max(1, Math.floor(input.months));
  const start = dayNo(input.start);
  if (Number.isNaN(start)) return { ok: false, reason: "date" };
  const groups = input.groups;
  if (!groups.length || groups.some((g) => !Number.isInteger(g) || g <= 0)) return { ok: false, reason: "groups" };
  if (groups.reduce((a, b) => a + b, 0) !== months) return { ok: false, reason: "sum" };

  const due = Array.from({ length: months }, (_, k) => addMonths(start, k));
  const maturity = addMonths(start, months);
  // 묶음마다 첫 회차 번호(0부터)
  const firsts: number[] = [];
  groups.reduce((at, g) => (firsts.push(at), at + g), 0);
  const lastFirst = firsts[firsts.length - 1];
  const lastSize = groups[groups.length - 1];

  const paid = due.slice();
  for (let gi = 0; gi < groups.length - 1; gi++) {
    for (let k = firsts[gi]; k < firsts[gi] + groups[gi]; k++) paid[k] = due[firsts[gi]];
  }
  // 앞 묶음들의 Σ(실제 − 약정)
  let before = 0;
  for (let k = 0; k < lastFirst; k++) before += paid[k] - due[k];
  let lastDue = 0;
  for (let k = lastFirst; k < months; k++) lastDue += due[k];
  // 마지막 묶음 날 d: before + lastSize × d − lastDue ≤ 0 인 가장 큰 d, 만기 전날을 넘지 않게
  const latest = Math.min(Math.floor((lastDue - before) / lastSize), maturity - 1);

  const chosen = input.lastDate ? dayNo(input.lastDate) : NaN;
  if (input.lastDate && Number.isNaN(chosen)) return { ok: false, reason: "date" };
  const last = Number.isNaN(chosen) ? latest : chosen;
  for (let k = lastFirst; k < months; k++) paid[k] = last;

  const rows: PrepayDeferRow[] = [];
  let totalEarly = 0;
  let totalLate = 0;
  for (let k = 0; k < months; k++) {
    const diff = paid[k] - due[k];
    const early = diff < 0 ? -diff : 0;
    const late = diff > 0 ? diff : 0;
    totalEarly += early;
    totalLate += late;
    rows.push({ round: k + 1, due: isoOf(due[k]), paid: isoOf(paid[k]), early, late });
  }
  const net = totalLate - totalEarly;
  const avgDelay = net > 0 ? net / months : 0;
  const prevDay = lastFirst > 0 ? paid[lastFirst - 1] : -Infinity;

  return {
    ok: true,
    rows,
    totalEarly,
    totalLate,
    net,
    avgDelay,
    maturity: isoOf(maturity),
    delayedFloor: isoOf(maturity + Math.floor(avgDelay)),
    delayedCeil: isoOf(maturity + Math.ceil(avgDelay)),
    lastDate: isoOf(last),
    latestLastDate: isoOf(latest),
    afterMaturity: last >= maturity,
    beforePrevious: last < prevDay,
    savings: installmentSavings({ monthly: input.monthly, ratePct: input.ratePct, months, method: input.method, tax: "normal" }),
  };
}

/** 계산기 선택지 — 네이버 자동완성 '6-1-5 적금'·'선납이연 6-6방법'·'적금 선납이연 1-11하는법'(keywords/ac-prepay-defer-2026-10-24.csv) */
export const PATTERNS = ["6-1-5", "6-6", "1-11"] as const;

/** "2027-01-10" → "2027년 1월 10일" */
export function koDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
