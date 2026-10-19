/**
 * 날짜 요일 계산기(/tools/date-day/) — 날짜 하나 → 요일 · 공휴일 · 연중 몇째 날 · 주차 · 윤년.
 *
 * 날짜는 date-calc.ts 와 같은 UTC 일련번호(1970-01-01 = 0)로 센다. 정한 규칙(테스트로 고정):
 * - 연중 일수는 1월 1일을 1일째로 센다. 남은 일수 = 그해 총일수 − 연중 일수(12월 31일은 0).
 * - 윤년: 4로 나눠지면 윤년, 단 400으로 안 나눠지는 100의 배수 해는 평년(rates/date-day-2026.json — USNO).
 * - ISO 주차: 월요일 시작, 그해 첫 목요일이 든 주가 1주. 1월 초·12월 말은 ISO 연도가 달라질 수 있다.
 * - 달력 주차: 주 시작 요일(일/월)을 고르고 1월 1일이 든 주가 1주. 엑셀 WEEKNUM 과 같은 셈.
 * - 월 주차(달력 줄): 그 달 1일이 든 줄이 1주. 몇째 요일 = 그 달의 같은 요일 중 몇 번째(⌈일 ÷ 7⌉).
 * - 공휴일은 관공서 공휴일 목록(rates/kr-holidays-2026.json) 범위 안에서만 판정한다. 밖이면 null.
 * - Unix 시각은 UTC 0시 기준(지역 시간대·옛 표준시 이력을 타지 않게).
 */
import { weekday, fromDay, holidayName, holidayCovered } from "./date-calc";

export const WEEKDAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const WEEKDAY_HANJA = ["日", "月", "火", "水", "木", "金", "土"] as const;
const ORD = ["첫째", "둘째", "셋째", "넷째", "다섯째"] as const;

/** 주 시작 요일 — 0 = 일요일, 1 = 월요일 */
export type WeekStart = 0 | 1;

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function dayOf(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** 주 시작 요일 기준으로 그 주 안에서 몇 번째 날인가(0부터) */
function offset(n: number, start: WeekStart): number {
  return (weekday(n) - start + 7) % 7;
}

/** ISO 8601 주차 — { year, week } */
export function isoWeek(n: number): { year: number; week: number } {
  const iso = (weekday(n) + 6) % 7; // 월요일 = 0
  const thursday = n - iso + 3; // 그 주 목요일 — 이 날의 연도가 ISO 연도
  const year = Number(fromDay(thursday).slice(0, 4));
  return { year, week: Math.floor((thursday - dayOf(year, 1, 1)) / 7) + 1 };
}

export interface DayInfo {
  year: number;
  month: number;
  date: number;
  /** 0 = 일요일 */
  weekday: number;
  weekend: boolean;
  /** 공휴일 이름. 공휴일이 아니면 '', 목록 범위 밖이면 null */
  holiday: string | null;
  dayOfYear: number;
  daysInYear: number;
  daysLeft: number;
  leap: boolean;
  quarter: number;
  iso: { year: number; week: number };
  /** 'YYYY-Www-d' */
  isoText: string;
  /** 달력 주차(1월 1일이 든 주 = 1주) */
  calWeek: number;
  /** 월 주차(그 달 1일이 든 줄 = 1주) */
  monthWeek: number;
  /** 그 달의 같은 요일 중 몇 번째(1~5) */
  nth: number;
  nthText: string;
  /** UTC 0시 Unix 초 */
  unix: number;
}

export function dayInfo(n: number, start: WeekStart = 0): DayInfo {
  const s = fromDay(n);
  const [year, month, date] = [Number(s.slice(0, 4)), Number(s.slice(5, 7)), Number(s.slice(8, 10))];
  const w = weekday(n);
  const jan1 = dayOf(year, 1, 1);
  const first = dayOf(year, month, 1);
  const leap = isLeap(year);
  const daysInYear = leap ? 366 : 365;
  const dayOfYear = n - jan1 + 1;
  const iso = isoWeek(n);
  const nth = Math.ceil(date / 7);
  return {
    year,
    month,
    date,
    weekday: w,
    weekend: w === 0 || w === 6,
    holiday: holidayCovered(n) ? (holidayName(n) ?? "") : null,
    dayOfYear,
    daysInYear,
    daysLeft: daysInYear - dayOfYear,
    leap,
    quarter: Math.ceil(month / 3),
    iso,
    isoText: `${iso.year}-W${String(iso.week).padStart(2, "0")}-${((w + 6) % 7) + 1}`,
    calWeek: Math.ceil((dayOfYear + offset(jan1, start)) / 7),
    monthWeek: Math.ceil((date + offset(first, start)) / 7),
    nth,
    nthText: `${ORD[nth - 1]} ${["일", "월", "화", "수", "목", "금", "토"][w]}요일`,
    unix: n * 86_400,
  };
}
