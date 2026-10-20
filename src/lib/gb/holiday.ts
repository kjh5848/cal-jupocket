/**
 * 영국 법정 유급휴가(statutory holiday entitlement) — 일수·시간만 계산한다(휴가 급여 금액은 계산하지 않음).
 * 영국판 /en-gb/holiday-entitlement/ 가 쓴다. 숫자는 rates/gb/holiday-entitlement-2026.json.
 *
 * 원문(2026-10-21 확인):
 * - GOV.UK Holiday entitlement(updated_at 2026-10-16) — 5.6주, 주 5일 28일, 주 3일 3 × 5.6 = 16.8일, 28일 상한,
 *   첫해 1/12 예시(28 ÷ 12 = 2.33 → 2.5, 3개월 7일), irregular hours 30시간 × 12.07% = 3.621 → 4시간.
 * - Working Time Regulations 1998(E+W+S) reg 13·13A(4주 + 1.6주, 28일 상한) · 14((A × B) − C) · 15A(첫해 1/12, 반나절 끝수) ·
 *   15B(12.07%, 30분 끝수, 2024-04-01 이후 leave year).
 * - Working Time Regulations (Northern Ireland) 2016 reg 15·16·17·19 — 4주 + 1.6주·28일·(A × B) − C·1/12 반나절 끝수는 같은 값.
 *   NI 에는 15B(12.07%) 같은 조항이 없어 irregularHours 는 GB 한정.
 *
 * 부동소수 끝수 오류(28/12*3 = 7.000…01 → 반나절 올림이면 7.5)를 피하려고 정수로 센다:
 * 일수는 1/100일(centi-day), 시간은 분.
 */
import rates from "../../rates/gb/holiday-entitlement-2026.json";

export const WEEKS = rates.statutoryWeeks.total; // 5.6
export const CAP_DAYS = rates.statutoryWeeks.capDays; // 28
export const IRREGULAR_RATE = rates.irregularHoursGB.rate; // 0.1207

const WEEKS_TENTHS = Math.round(WEEKS * 10); // 56
const CAP_CENTI = CAP_DAYS * 100; // 2800
const RATE_BP = Math.round(IRREGULAR_RATE * 10000); // 1207

/** 주 근무일(소수 첫째 자리까지, 0~7) → 1/10일 단위 정수 */
function tenths(daysPerWeek: number): number {
  if (!Number.isFinite(daysPerWeek) || daysPerWeek <= 0) return 0;
  return Math.round(Math.min(daysPerWeek, 7) * 10);
}

/** 1년 법정 휴가(1/100일) — min(주 근무일 × 5.6, 28) */
export function annualCenti(daysPerWeek: number): number {
  return Math.min(tenths(daysPerWeek) * WEEKS_TENTHS, CAP_CENTI);
}

export interface Annual {
  /** 1년 법정 휴가(일) */
  days: number;
  /** 28일 상한에 걸렸는지 */
  capped: boolean;
  /** 상한 전 값(일) = 주 근무일 × 5.6 */
  uncapped: number;
}

/** regular hours 근로자 1년 법정 휴가(일) */
export function annualDays(daysPerWeek: number): Annual {
  const raw = tenths(daysPerWeek) * WEEKS_TENTHS;
  return { days: Math.min(raw, CAP_CENTI) / 100, capped: raw > CAP_CENTI, uncapped: raw / 100 };
}

/**
 * 주 근무시간 × 5.6 (시간) — 주 5일 이하라 28일 상한에 걸리지 않을 때만 의미가 있다.
 * 상한에 걸리면(주 5일 초과) 하루 길이가 원문에 정해져 있지 않아 null.
 */
export function annualHours(daysPerWeek: number, hoursPerWeek: number): number | null {
  if (annualDays(daysPerWeek).capped) return null;
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek <= 0) return 0;
  const minutes = Math.round(hoursPerWeek * 60);
  return (minutes * WEEKS_TENTHS) / 10 / 60;
}

/**
 * 첫해 발생(reg 15A·NI reg 19): 시작된 달 수(이번 달 포함, 1~12) × 1년치 1/12,
 * 반나절이 아닌 끝수는 반나절 미만 → 반나절, 반나절 초과 → 하루(= 반나절 단위 올림).
 * GOV.UK 예시: 주 5일 1개월 2.5일, 3개월 7일.
 */
export function firstYearAccrued(daysPerWeek: number, months: number): number {
  const m = Math.max(0, Math.min(12, Math.floor(months)));
  const n = annualCenti(daysPerWeek) * m; // 1/100일 × 12 단위
  // 반나절 = 50 centi → n / 12 / 50 = n / 600 반나절, 올림
  const halves = Math.floor((n + 599) / 600); // 정수 올림
  return halves / 2;
}

/** 날짜 문자열 YYYY-MM-DD → UTC 일 번호 */
export function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return t / 86400000;
}

/** leave year 시작일 다음 해 같은 날(2/29 시작이면 3/1) — 그 사이 날 수가 leave year 길이 */
function nextAnniversary(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m || dayNumber(iso) === null) return null;
  return Date.UTC(+m[1] + 1, +m[2] - 1, +m[3]) / 86400000;
}

export interface Leaving {
  /** A — 1년 법정 휴가(일) */
  a: number;
  /** leave year 가 지난 날(퇴사일 전날까지) */
  elapsedDays: number;
  /** leave year 길이(일) */
  yearDays: number;
  /** B — elapsedDays / yearDays */
  b: number;
  /** (A × B) − C, 끝수 처리 안 함 */
  owed: number;
}

/**
 * 퇴사 때 못 쓴 법정 휴가(reg 14(3)(b)·NI reg 17(3)(b)) = (A × B) − C.
 * B 는 '퇴사일 전에 지난 leave year 비율' — 이 페이지는 leave year 첫날부터 퇴사일 전날까지의 날 수 ÷ 그 leave year 의 날 수로 센다
 * (페이지 설정). reg 14 에는 끝수 규칙이 없어 끝수 처리하지 않는다. 음수면 더 쓴 것.
 * 퇴사일이 leave year 밖이면 null.
 */
export function leaving(daysPerWeek: number, leaveYearStart: string, leavingDate: string, taken: number): Leaving | null {
  const s = dayNumber(leaveYearStart);
  const e = dayNumber(leavingDate);
  const next = nextAnniversary(leaveYearStart);
  if (s === null || e === null || next === null || e < s || e >= next) return null;
  const a = annualDays(daysPerWeek).days;
  const yearDays = next - s;
  const elapsedDays = e - s;
  const b = elapsedDays / yearDays;
  const c = Number.isFinite(taken) && taken > 0 ? taken : 0;
  return { a, elapsedDays, yearDays, b, owed: a * b - c };
}

export interface Irregular {
  /** 끝수 처리 전(시간) = 일한 시간 × 12.07% */
  raw: number;
  /** 30분 미만 버림·30분 이상 1시간(reg 15B(5)) */
  hours: number;
}

/** GB irregular hours·part-year 근로자, 2024-04-01 이후 leave year — 급여 기간에 일한 시간 × 12.07% */
export function irregularAccrued(hoursWorked: number): Irregular {
  if (!Number.isFinite(hoursWorked) || hoursWorked <= 0) return { raw: 0, hours: 0 };
  const minutes = Math.round(hoursWorked * 60);
  const n = minutes * RATE_BP; // 분 × 1/10000
  const perHour = 60 * 10000;
  const whole = Math.floor(n / perHour);
  const rest = n - whole * perHour; // 1시간 미만 끝수(분 × 1/10000)
  const hours = whole + (rest >= 30 * 10000 ? 1 : 0);
  return { raw: n / perHour, hours };
}

/** 표시: 소수 둘째 자리까지, 끝 0 지움 */
export function fmt(n: number, max = 2): string {
  return n.toLocaleString("en-GB", { maximumFractionDigits: max });
}
