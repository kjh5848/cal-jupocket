/**
 * 주휴수당·연차 — 근로기준법 제18조 제3항(15시간), 제55조·시행령 제30조(주휴), 제60조(연차), 시행령 별표 2(단시간근로자),
 * 시행령 제6조(통상임금), 최저임금 고시(2026 10,320원·2027 10,700원). rates: labor-2026.json
 *
 * 주휴시간은 통상근로자가 주 5일 일하는 사업장을 전제로 1주 소정근로시간 ÷ 5 로 낸다(별표 2: 4주 소정근로시간 ÷ 4주 통상근로자 소정근로일수).
 * 1주 소정근로시간은 40시간을 넘을 수 없어(제50조) 40에서 자른다.
 */
import r from "../rates/labor-2026.json";

const W = r.weeklyHoliday;
const A = r.annualLeave;
/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

export const minWage = (year: 2026 | 2027 = 2026) => r.minWage[String(year) as "2026" | "2027"].hourly;

/** 주휴시간(1일 소정근로시간). 15시간 미만이면 0 */
export function weeklyHolidayHours(weeklyHours: number): number {
  const h = Math.min(Math.max(0, weeklyHours), W.maxWeeklyHours);
  if (h < W.minWeeklyHours) return 0;
  return Math.round((h / W.normalDaysPerWeek) * 100) / 100;
}

/** 1년 평균 주의 수 ÷ 12 — 시행령 제6조 제2항 제4호의 월 환산 */
export const WEEKS_PER_MONTH = 365 / 7 / 12;

/** attended=false 면 그 주 소정근로일을 다 나오지 않은 것 — 유급휴일은 개근한 사람에게 준다(시행령 제30조 제1항) */
export function weeklyHolidayPay(hourly: number, weeklyHours: number, attended = true) {
  const hours = attended ? weeklyHolidayHours(weeklyHours) : 0;
  const weekly = fl(hourly * hours);
  const h = Math.min(Math.max(0, weeklyHours), W.maxWeeklyHours);
  const base = fl(hourly * h);
  return {
    hours,
    weekly,
    /** 월 평균 주휴수당(1년 평균 주 수 기준) */
    monthly: fl(weekly * WEEKS_PER_MONTH),
    /** 주휴수당을 시간당으로 나눠 더한 시급 */
    hourlyWithHoliday: h > 0 ? fl((hourly * (h + hours)) / h) : hourly,
    /** 1주 소정근로 임금(주휴 빼고) */
    base,
    /** 월 평균 소정근로 임금(1년 평균 주 수 기준) */
    monthlyBase: fl(base * WEEKS_PER_MONTH),
    /** 1주 임금(소정근로 + 주휴) */
    weekTotal: base + weekly,
  };
}

/** 주 40시간 월급 → 시간급(최저임금 고시의 월 환산 209시간 기준) */
export function hourlyFromMonthly40(monthly: number): number {
  return fl(monthly / r.minWage.monthlyHours);
}

/** 근속 n년(1년 단위로 다 채운 해)에 생기는 연차 일수 — 1년간 80% 이상 출근 전제 */
export function annualLeaveDays(completedYears: number): number {
  const n = Math.floor(completedYears);
  if (n < 1) return 0;
  return Math.min(A.full + Math.floor((n - 1) / A.addEvery), A.cap);
}

/** 1년 미만 — 개근한 달마다 1일, 최대 11일 */
export function firstYearLeaveDays(fullMonths: number): number {
  return Math.min(Math.max(0, Math.floor(fullMonths)), A.firstYearMax);
}

/** 입사일·기준일로 근속을 세고 지금까지 생긴 연차 내역(매월 개근·매년 80% 이상 출근 전제) */
export function leaveSchedule(start: Date, asOf: Date) {
  const months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth()) - (asOf.getDate() < start.getDate() ? 1 : 0);
  const years = Math.floor(months / 12);
  const firstYear = firstYearLeaveDays(Math.min(months, 12));
  const thisYear = annualLeaveDays(years);
  return { months: Math.max(0, months), years: Math.max(0, years), firstYear, thisYear };
}

/** 연차수당 = 1일 통상임금 × 쓰지 못한 일수 */
export function annualLeavePay(dailyWage: number, unusedDays: number): number {
  return fl(Math.max(0, dailyWage) * Math.max(0, unusedDays));
}

/** 단시간근로자 연차 시간(별표 2 제4호 나목) — 1시간 미만은 1시간 */
export function partTimeLeaveHours(fullDays: number, weeklyHours: number, normalWeeklyHours = W.maxWeeklyHours): number {
  return Math.ceil(fullDays * (weeklyHours / normalWeeklyHours) * 8 - 1e-9);
}

/** 최저임금 적용기준 월 시간(계산용, 반올림 없음) — 주 40시간은 고시의 209시간, 그 밖은 시행령 제5조 산식 (주 시간 + 주휴) × 365/7 ÷ 12 */
function minWageHoursExact(weeklyHours: number): number {
  const h = Math.min(Math.max(0, weeklyHours), W.maxWeeklyHours);
  if (h === W.maxWeeklyHours) return r.minWage.monthlyHours;
  return (h + weeklyHolidayHours(h)) * WEEKS_PER_MONTH;
}

/** 표시용 월 시간 — 소수 둘째 자리까지. 계산은 minWageHoursExact 로 한다(시행령 제5조에 반올림 규정이 없다) */
export function minWageMonthlyHours(weeklyHours = 40): number {
  return Math.round(minWageHoursExact(weeklyHours) * 100) / 100;
}

const minHourly = (year: 2026 | 2027, probation: boolean) => fl(minWage(year) * (probation ? r.minWageLaw.probation : 1));

/** 그해 최저임금을 맞추는 가장 적은 월급(1원 미만 올림). 주 40시간은 고시 월 환산액과 같다. 수습 3개월은 90% */
export function minimumMonthly(year: 2026 | 2027 = 2026, weeklyHours = 40, probation = false): number {
  return Math.ceil(minHourly(year, probation) * minWageHoursExact(weeklyHours) - 1e-6);
}

/** 월급(산입되는 임금)을 시간급으로 환산해 최저임금과 비교. 판정은 월급 ≥ minimumMonthly 와 같다 */
export function checkMinWage(monthlyPay: number, weeklyHours = 40, year: 2026 | 2027 = 2026, probation = false) {
  const exact = minWageHoursExact(weeklyHours);
  const hourly = exact > 0 ? fl(monthlyPay / exact) : 0;
  const min = minHourly(year, probation);
  const need = minimumMonthly(year, weeklyHours, probation);
  return { hours: minWageMonthlyHours(weeklyHours), hourly, min, ok: exact > 0 && monthlyPay >= need, shortfall: Math.max(0, need - monthlyPay) };
}
