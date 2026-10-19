/**
 * 생일 디데이(/tools/birthday-dday/) — 생일 월·일(태어난 해는 선택) · 기준일 → 다음 생일 · D-몇 · 남은 시간 · 이번 생일 나이.
 *
 * 날짜는 lib/date-calc.ts 의 일련번호(1970-01-01 = 0)로 센다. '오늘'은 인자로 받는다.
 * 나이 규칙은 만 나이 계산기(lib/age.ts, rates/age-2026.json — 민법 제158조·제160조)와 같다.
 *
 * 정한 규칙(테스트로 고정):
 * - 다음 생일은 기준일 당일 포함. 오늘이 생일이면 D-Day 이고 그날이 끝날 때까지 다음 해로 넘어가지 않는다.
 * - 2월 29일생의 평년 생일은 세 가지 중 고른다.
 *   mar1(기본) — 3월 1일. 민법 제160조 ③ 으로 평년엔 2월 28일에 기간이 끝나 3월 1일부터 한 살 더 먹는다(만 나이 계산기와 같은 날).
 *   feb28 — 2월 28일. 그 전날 축하하는 관습(법 근거 없음).
 *   feb29 — 실제 2월 29일만. 윤년에만 생일이 온다.
 * - 이번 생일 나이 = 다음 생일의 연도 − 태어난 해. 지금 만 나이·살아온 날은 lib/age.ts 를 그대로 쓴다 — 축하하는 날(feb28)과
 *   법상 한 살 더 먹는 날(3월 1일)이 다를 수 있어서, 만 나이는 규칙과 상관없이 법대로 낸다.
 * - 생일 진행률 = (기준일 − 지난 생일) ÷ (다음 생일 − 지난 생일). 생일 당일은 100%.
 *   지난 생일은 다음 생일 바로 앞의 생일(feb29 규칙이면 4년 전 윤년 — 사이에 윤년 하나가 없으면 8년).
 * - 살아온 날 = 기준일 − 태어난 날(태어난 날 당일 0일).
 */
import { toDay } from "./date-calc";
import { age } from "./age";

export type LeapRule = "mar1" | "feb28" | "feb29";

const DAY_MS = 86_400_000;

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 이 월·일이 생일로 쓸 수 있는 날인가 — 2월 29일은 된다(윤년 아무 해에나 있다) */
export function validMonthDay(m: number, d: number): boolean {
  if (!Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(2000, m); // 2000 은 윤년이라 2월 29일까지 있다
}

/** y년의 생일(일련번호). 2월 29일생의 평년은 규칙대로, feb29 규칙이면 null */
export function birthdayIn(y: number, m: number, d: number, rule: LeapRule = "mar1"): number | null {
  if (m === 2 && d === 29 && !isLeap(y)) {
    if (rule === "feb29") return null;
    return Date.UTC(y, rule === "feb28" ? 1 : 2, rule === "feb28" ? 28 : 1) / DAY_MS;
  }
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

function yearOf(n: number): number {
  return new Date(n * DAY_MS).getUTCFullYear();
}

/** 기준일 당일 포함 다음 생일 */
export function nextBirthday(m: number, d: number, base: number, rule: LeapRule = "mar1"): number {
  for (let y = yearOf(base); ; y++) {
    const b = birthdayIn(y, m, d, rule);
    if (b !== null && b >= base) return b;
  }
}

/** 이 생일 바로 앞의 생일 */
export function prevBirthday(m: number, d: number, next: number, rule: LeapRule = "mar1"): number {
  for (let y = yearOf(next) - 1; ; y--) {
    const b = birthdayIn(y, m, d, rule);
    if (b !== null) return b;
  }
}

/** 기준일부터 앞으로 오는 생일 count 개(다음 생일 포함) */
export function upcomingBirthdays(m: number, d: number, base: number, rule: LeapRule = "mar1", count = 10): number[] {
  const out: number[] = [];
  for (let y = yearOf(base); out.length < count; y++) {
    const b = birthdayIn(y, m, d, rule);
    if (b !== null && b >= base) out.push(b);
  }
  return out;
}

export interface BirthdayDday {
  /** 다음 생일(오늘이 생일이면 오늘) */
  next: number;
  /** 다음 생일까지 남은 날(오늘이면 0) */
  daysLeft: number;
  /** 지난 생일 · 진행률(0~100) */
  prev: number;
  progress: number;
  /** 태어난 해를 넣었을 때만 — 태어난 날 · 이번 생일에 만 몇 세 · 지금 만 나이(법) · 살아온 날(태어난 날 0일) */
  birth: number | null;
  turningAge: number | null;
  currentAge: number | null;
  livedDays: number | null;
}

/**
 * 생일 디데이. year 가 null 이면 나이·살아온 날은 null.
 * 태어난 해에 그 날짜가 없거나(평년 2월 29일) 기준일보다 뒤에 태어났으면 null 을 돌려준다 — 화면이 이유를 알린다.
 */
export function birthdayDday(m: number, d: number, year: number | null, base: number, rule: LeapRule = "mar1"): BirthdayDday | null {
  if (!validMonthDay(m, d)) return null;
  let birth: number | null = null;
  if (year !== null) {
    birth = toDay(`${String(year).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    if (birth === null || birth > base) return null;
  }
  const next = nextBirthday(m, d, base, rule);
  const prev = prevBirthday(m, d, next, rule);
  const turningAge = year === null ? null : yearOf(next) - year;
  const legal = birth === null ? null : age(birth, base);
  return {
    next,
    daysLeft: next - base,
    prev,
    progress: ((base - prev) / (next - prev)) * 100,
    birth,
    turningAge,
    currentAge: legal ? legal.years : null,
    livedDays: legal ? legal.livedDays : null,
  };
}
