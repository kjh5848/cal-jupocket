/**
 * 커플 기념일 계산기(/tools/anniversary/) — 시작일 하나로 며칠째 · 100일 · 1000일 · 주년 · 개월.
 *
 * 날짜는 lib/date-calc.ts 의 일련번호(1970-01-01 = 0)로 센다. '오늘'은 인자로 받는다.
 *
 * 정한 규칙(테스트로 고정):
 * - 기본은 시작일을 1일째로 센다(한국 커플·아기 100일 관습 — 법령 근거 없음). 그래서 N일 = 시작일 + (N − 1)일.
 *   '시작일을 0일로'를 고르면 N일 = 시작일 + N일(날짜 계산기의 간격 셈).
 * - 주년·개월은 일수가 아니라 달력 날짜다. 매번 시작일에서 k개월을 더한다(직전 기념일에 이어 더하지 않는다).
 *   그 달에 없는 날이면 말일로 맞춘다 — 1/31 시작의 1개월은 2/28(29), 2/29 시작의 1주년은 2/28.
 *   그래서 1주년과 365일은 다른 날이다(1일째 셈이면 1주년이 하루 늦다, 윤년을 끼면 이틀).
 * - 함께한 기간(년·개월·일)은 시작일부터 오늘까지의 간격이다 — 시작일 당일은 1일째지만 기간은 0일.
 * - 오늘이 시작일보다 앞이면 며칠째는 null(아직 시작 전). 기념일 날짜는 그대로 낸다.
 */
import { addMonths, span } from "./date-calc";

export type Kind = "day" | "month" | "year";

export interface Milestone {
  kind: Kind;
  /** 100(일) · 3(개월) · 1(주년) */
  n: number;
  /** '100일' · '3개월' · '1주년' */
  name: string;
  /** 그날의 일련번호 */
  day: number;
}

/** 일수 기념일 — 표에 늘 보여 주는 것 */
export const DAY_MARKS = [22, 50, 100, 200, 300, 365, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 5000, 10000];
/** 주년 — 표에 늘 보여 주는 것 */
export const YEAR_MARKS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];

/** 시작일에서 N일 기념일 날짜. firstIsOne 이면 시작일이 1일째 */
export function nthDay(start: number, n: number, firstIsOne = true): number {
  return start + n - (firstIsOne ? 1 : 0);
}

/** 이 날짜는 며칠(째)인가. 시작일보다 앞이면 null */
export function dayCount(start: number, date: number, firstIsOne = true): number | null {
  if (date < start) return null;
  return date - start + (firstIsOne ? 1 : 0);
}

export function dayMark(start: number, n: number, firstIsOne = true): Milestone {
  return { kind: "day", n, name: `${n.toLocaleString("ko-KR")}일`, day: nthDay(start, n, firstIsOne) };
}

export function monthMark(start: number, n: number): Milestone {
  return { kind: "month", n, name: `${n}개월`, day: addMonths(start, n) };
}

export function yearMark(start: number, n: number): Milestone {
  return { kind: "year", n, name: `${n}주년`, day: addMonths(start, n * 12) };
}

/**
 * from 이후(포함)에 오는 기념일을 날짜순으로 count 개. 같은 날에 겹치면 주년 → 일수 → 개월 순.
 * 일수는 100일 단위 + DAY_MARKS, 개월은 12의 배수가 아닌 것(12의 배수는 주년으로 낸다).
 */
export function upcoming(start: number, from: number, firstIsOne = true, count = 5): Milestone[] {
  const out: Milestone[] = [];
  const lo = Math.max(from, start);
  const hi = lo + 366 * 3; // 3년 안에 기념일은 넉넉히 count 개 넘는다
  const days = new Set(DAY_MARKS);
  for (let n = 100; nthDay(start, n, firstIsOne) <= hi; n += 100) days.add(n);
  for (const n of days) {
    const m = dayMark(start, n, firstIsOne);
    if (m.day >= lo && m.day <= hi) out.push(m);
  }
  for (let k = 1; addMonths(start, k) <= hi; k++) {
    const m = k % 12 === 0 ? yearMark(start, k / 12) : monthMark(start, k);
    if (m.day >= lo) out.push(m);
  }
  const order: Record<Kind, number> = { year: 0, day: 1, month: 2 };
  out.sort((a, b) => a.day - b.day || order[a.kind] - order[b.kind]);
  return out.slice(0, count);
}

export interface Anniversary {
  /** 오늘이 며칠째(시작 전이면 null) */
  count: number | null;
  /** 시작일까지 남은 날(시작 전일 때만, 아니면 0) */
  untilStart: number;
  /** 함께한 기간 — 시작일부터 오늘까지 간격 */
  years: number;
  months: number;
  restDays: number;
  weeks: number;
  /** 100일 · 1000일 · 1주년 날짜 */
  d100: number;
  d1000: number;
  y1: number;
  /** 오늘 이후(오늘 포함) 가장 가까운 기념일 */
  next: Milestone | null;
}

export function anniversary(start: number, today: number, firstIsOne = true): Anniversary {
  const before = today < start;
  const s = span(start, before ? start : today, false);
  return {
    count: dayCount(start, today, firstIsOne),
    untilStart: before ? start - today : 0,
    years: s.years,
    months: s.months,
    restDays: s.restDays,
    weeks: s.weeks,
    d100: nthDay(start, 100, firstIsOne),
    d1000: nthDay(start, 1000, firstIsOne),
    y1: addMonths(start, 12),
    next: upcoming(start, today, firstIsOne, 1)[0] ?? null,
  };
}
