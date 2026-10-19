/**
 * 올해 남은 날(/tools/year-left/) — 기준일(보통 오늘) → 올해 며칠 남았나 · 몇 번째 날 · 몇 % 지났나.
 *
 * 날짜는 lib/date-calc.ts 의 일련번호(1970-01-01 = 0)로 센다. '오늘'과 그날 0시부터 흐른 초는 인자로 받는다.
 * 윤년·연중 일수는 날짜 요일 계산기(lib/date-day.ts, rates/date-day-2026.json — USNO 윤년 규칙)를 그대로 쓰고,
 * 공휴일은 관공서 공휴일 목록(rates/kr-holidays-2026.json)을 쓴다. 새 숫자가 없어 rates 파일을 따로 두지 않는다.
 *
 * 정한 규칙(테스트로 고정):
 * - 남은 날 = 그해 총일수 − 몇 번째 날(오늘 제외 — dayInfo().daysLeft 와 같다). 오늘 포함 = 남은 날 + 1.
 *   12월 31일은 남은 날 0일 · 오늘 포함 1일.
 * - 남은 토·일·평일·공휴일은 내일부터 12월 31일까지 센다. 평일 = 남은 날 − 토 − 일.
 *   남은 업무일 = 평일 − 평일에 낀 공휴일. 공휴일 목록이 그해를 다 덮지 못하면 업무일·공휴일은 null.
 * - 진행률은 시간 기준 = (몇 번째 날 − 1) × 86,400 + 그날 흐른 초 ÷ (총일수 × 86,400). 1월 1일 0시 = 0%.
 * - 새해까지 = 다음 해 1월 1일 0시까지 남은 초(하루 = 86,400초 — 한국은 서머타임이 없다). 시간은 내림.
 * - 'N일 남은 날' = 12월 31일 − N일(그날 기준 남은 날이 N). 윤년이어도 연말에서 세므로 날짜가 같다.
 * - 이번 달·이번 분기 끝까지는 그 달(분기) 마지막 날 − 기준일(오늘 제외 — 남은 날과 같은 셈).
 */
import { weekday, holidayName, holidayCovered } from "./date-calc";
import { dayInfo } from "./date-day";

const DAY_SEC = 86_400;
export const MILESTONES = [100, 50, 30, 10] as const;

function dayOf(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export interface YearLeft {
  year: number;
  leap: boolean;
  daysInYear: number;
  /** 몇 번째 날(1월 1일 = 1) */
  dayOfYear: number;
  /** 남은 날 — 오늘 제외 */
  daysLeft: number;
  /** 남은 날 — 오늘 포함 */
  daysLeftIncl: number;
  /** 남은 날 ÷ 7 */
  weeks: number;
  weekRest: number;
  /** 내일부터 12월 31일까지 */
  saturdays: number;
  sundays: number;
  weekdays: number;
  /** 평일에 낀 공휴일을 뺀 날. 공휴일 목록 범위 밖이면 null */
  businessDays: number | null;
  /** 내일부터 12월 31일까지의 공휴일(토·일과 겹친 날 포함). 범위 밖이면 null */
  holidays: { day: number; name: string }[] | null;
  /** 0 ~ 100, 시간 기준 */
  progress: number;
  /** 다음 해 1월 1일 0시까지 남은 초 */
  secondsToNewYear: number;
  /** 이번 달 마지막 날 − 기준일 */
  monthLeft: number;
  /** 이번 분기 마지막 날 − 기준일 */
  quarterLeft: number;
  quarter: number;
  /** 12월 31일 − N일 */
  milestones: { left: number; day: number }[];
  /** 12월 31일 */
  lastDay: number;
}

/** 기준일 일련번호 · 그날 0시부터 흐른 초(0 ~ 86,399) → 올해 남은 날 */
export function yearLeft(base: number, nowSec = 0): YearLeft {
  const info = dayInfo(base);
  const { year, month, daysInYear, dayOfYear, daysLeft } = info;
  const lastDay = dayOf(year, 12, 31);
  const sec = Math.min(Math.max(Math.trunc(nowSec), 0), DAY_SEC - 1);

  let saturdays = 0;
  let sundays = 0;
  for (let n = base + 1; n <= lastDay; n++) {
    const w = weekday(n);
    if (w === 6) saturdays++;
    else if (w === 0) sundays++;
  }
  const weekdays = daysLeft - saturdays - sundays;

  const covered = holidayCovered(dayOf(year, 1, 1)) && holidayCovered(lastDay);
  let holidays: YearLeft["holidays"] = null;
  let businessDays: number | null = null;
  if (covered) {
    holidays = [];
    let offWeekday = 0;
    for (let n = base + 1; n <= lastDay; n++) {
      const name = holidayName(n);
      if (!name) continue;
      holidays.push({ day: n, name });
      const w = weekday(n);
      if (w !== 0 && w !== 6) offWeekday++;
    }
    businessDays = weekdays - offWeekday;
  }

  const monthEnd = dayOf(year, month + 1, 1) - 1; // Date.UTC 는 13월을 다음 해 1월로 넘긴다
  const qEndMonth = Math.ceil(month / 3) * 3;
  const quarterEnd = dayOf(year, qEndMonth + 1, 1) - 1;

  return {
    year,
    leap: info.leap,
    daysInYear,
    dayOfYear,
    daysLeft,
    daysLeftIncl: daysLeft + 1,
    weeks: Math.floor(daysLeft / 7),
    weekRest: daysLeft % 7,
    saturdays,
    sundays,
    weekdays,
    businessDays,
    holidays,
    progress: (((dayOfYear - 1) * DAY_SEC + sec) / (daysInYear * DAY_SEC)) * 100,
    secondsToNewYear: (daysLeft + 1) * DAY_SEC - sec,
    monthLeft: monthEnd - base,
    quarterLeft: quarterEnd - base,
    quarter: info.quarter,
    milestones: MILESTONES.map((left) => ({ left, day: lastDay - left })),
    lastDay,
  };
}

/** 그해 매월 1일 — 몇 번째 날 · 남은 날(그날 제외) */
export function monthFirsts(year: number): { day: number; dayOfYear: number; daysLeft: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const n = dayOf(year, i + 1, 1);
    const d = dayInfo(n);
    return { day: n, dayOfYear: d.dayOfYear, daysLeft: d.daysLeft };
  });
}

/** 진행률 표기 — 소수 첫째 자리 버림(99.99% 를 100.0% 로 올리지 않게) */
export function pctText(p: number): string {
  return `${(Math.floor(p * 10 + 1e-9) / 10).toFixed(1)}%`;
}
