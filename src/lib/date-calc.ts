/**
 * 날짜 계산기(/tools/date-diff/) — 두 날짜 사이 기간 · 날짜 더하기/빼기 · 업무일.
 *
 * 날짜는 'YYYY-MM-DD' 문자열을 UTC 기준 일련번호(1970-01-01 = 0)로 바꿔 정수로 센다.
 * new Date('…') 의 지역 시간 해석·서머타임을 타지 않게 하려는 것이다. '오늘'은 인자로 받는다.
 *
 * 정한 규칙(테스트로 고정):
 * - 기간은 기본이 '종료일 − 시작일'(간격). '종료일 포함'이면 하루를 더하고, 개월·일 분해도 종료일 다음 날까지로 센다.
 * - 종료일이 시작일보다 앞이면 두 날짜를 바꿔 센다(swapped 로 알린다).
 * - 개월 더하기는 그 달에 없는 날이면 말일로 맞춘다(1/31 + 1개월 = 2/28, 2/29 + 1년 = 2/28).
 * - 업무일 = 토·일과 관공서 공휴일(rates/kr-holidays-2026.json)을 뺀 날. 공휴일 목록 범위 밖이면 null.
 */
import rates from "../rates/kr-holidays-2026.json";

const DAY_MS = 86_400_000;
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 'YYYY-MM-DD' → 일련번호. 형식이 틀리거나 없는 날짜(2월 30일 등)면 null. */
export function toDay(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
}

/** 일련번호 → 'YYYY-MM-DD' */
export function fromDay(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** 요일 번호(0 = 일요일) */
export function weekday(n: number): number {
  return (((n + 4) % 7) + 7) % 7; // 1970-01-01 은 목요일
}

function ymd(n: number): [number, number, number] {
  const d = new Date(n * DAY_MS);
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 개월 더하기 — 그 달에 없는 날이면 말일로. 음수면 앞으로. */
export function addMonths(n: number, months: number): number {
  const [y, m, d] = ymd(n);
  const idx = y * 12 + (m - 1) + months;
  const ny = Math.floor(idx / 12);
  const nm = idx - ny * 12 + 1;
  return Date.UTC(ny, nm - 1, Math.min(d, daysInMonth(ny, nm))) / DAY_MS;
}

const HOLIDAYS = new Map(rates.holidays.map((h) => [toDay(h.date)!, h.name]));
const H_FROM = toDay(rates.range.from)!;
const H_TO = toDay(rates.range.to)!;

/** 공휴일 이름(관공서 공휴일 목록 기준). 아니면 undefined. */
export function holidayName(n: number): string | undefined {
  return HOLIDAYS.get(n);
}

/** 공휴일 목록이 덮는 날인가 */
export function holidayCovered(n: number): boolean {
  return n >= H_FROM && n <= H_TO;
}

export const holidayRange = rates.range;

function isWeekend(n: number): boolean {
  const w = weekday(n);
  return w === 0 || w === 6;
}

/** 업무일인가 — 토·일·공휴일이 아닌 날 */
export function isBusinessDay(n: number): boolean {
  return !isWeekend(n) && !HOLIDAYS.has(n);
}

export interface Span {
  /** 시작일·종료일(바꿔 셌으면 바꾼 뒤) */
  from: number;
  to: number;
  swapped: boolean;
  /** 총 일수 — 종료일 포함이면 +1 */
  days: number;
  /** 년·개월·일 분해 */
  years: number;
  months: number;
  restDays: number;
  /** 주 + 남는 일 */
  weeks: number;
  weekRest: number;
  /** 시간 환산 — 총 일수 × 24 (한국은 서머타임이 없어 하루 = 24시간) */
  hours: number;
  /** 토·일을 뺀 날 수(시작일부터 센 날들 중) */
  weekdays: number;
  /** 토·일·공휴일을 뺀 날 수. 공휴일 목록 범위를 벗어나면 null */
  businessDays: number | null;
  /** 기간 안 평일에 걸린 공휴일 */
  holidaysOnWeekdays: { date: string; name: string }[];
}

/**
 * 두 날짜 사이 기간. 날짜 세기 구간은 [from, to) — 종료일 포함이면 [from, to].
 * 평일·업무일도 같은 구간에서 센다.
 */
export function span(a: number, b: number, inclusive: boolean): Span {
  const swapped = b < a;
  const from = swapped ? b : a;
  const to = swapped ? a : b;
  const end = inclusive ? to + 1 : to; // 세는 구간의 끝(포함 안 함)
  const days = end - from;

  let total = 0;
  while (addMonths(from, total + 1) <= end) total++;
  const restDays = end - addMonths(from, total);

  let weekdays = 0;
  let business = 0;
  const hs: { date: string; name: string }[] = [];
  for (let n = from; n < end; n++) {
    if (isWeekend(n)) continue;
    weekdays++;
    const h = HOLIDAYS.get(n);
    if (h) hs.push({ date: fromDay(n), name: h });
    else business++;
  }
  const covered = days === 0 || (holidayCovered(from) && holidayCovered(end - 1));

  return {
    from,
    to,
    swapped,
    days,
    years: Math.floor(total / 12),
    months: total % 12,
    restDays,
    weeks: Math.floor(days / 7),
    weekRest: days % 7,
    hours: days * 24,
    weekdays,
    businessDays: covered ? business : null,
    holidaysOnWeekdays: hs,
  };
}

export type Unit = "day" | "week" | "month" | "year";

/** 기준일에서 amount(음수면 앞으로) 단위만큼 옮긴 날 */
export function shift(base: number, amount: number, unit: Unit): number {
  if (unit === "day") return base + amount;
  if (unit === "week") return base + amount * 7;
  if (unit === "month") return addMonths(base, amount);
  return addMonths(base, amount * 12);
}

/**
 * 업무일로 amount 일 뒤(음수면 앞). 기준일 자체는 세지 않는다 — '다음 업무일부터 1일'.
 * 공휴일 목록 범위를 벗어나면 null.
 */
export function shiftBusiness(base: number, amount: number): number | null {
  const step = amount < 0 ? -1 : 1;
  let left = Math.abs(amount);
  let n = base;
  while (left > 0) {
    n += step;
    if (!holidayCovered(n)) return null;
    if (isBusinessDay(n)) left--;
  }
  return n;
}

/** 오늘과의 차이 → 'D-12' · 'D-Day' · 'D+3' */
export function dday(target: number, today: number): string {
  const d = target - today;
  if (d === 0) return "D-Day";
  return d > 0 ? `D-${d}` : `D+${-d}`;
}

/** '2026-10-19 (월)' */
export function label(n: number): string {
  return `${fromDay(n)} (${WEEKDAYS[weekday(n)]})`;
}

/** '1년 2개월 3일' — 0인 칸은 뺀다. 전부 0이면 '0일' */
export function spanText(s: Pick<Span, "years" | "months" | "restDays">): string {
  const parts: string[] = [];
  if (s.years) parts.push(`${s.years}년`);
  if (s.months) parts.push(`${s.months}개월`);
  if (s.restDays || parts.length === 0) parts.push(`${s.restDays}일`);
  return parts.join(" ");
}
