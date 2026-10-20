/**
 * 미국 연방 최저임금(FLSA) — 급여 → 시급 환산과 $7.25 비교. 미국판 /en-us/minimum-wage/ 가 쓴다.
 * 한국어판 최저임금(월 209시간·주휴수당)과 제도가 달라 짝(hreflang)이 아니다.
 *
 * 원문(2026-10-21 확인) — rates/us/minimum-wage-2026.json:
 * - 29 U.S.C. 206(a)(1)(C) · DOL: 연방 최저임금 $7.25 (2009-07-24부터). 218(a): 주·시 최저임금이 더 높으면 그것도 지킴.
 * - 206(g): 20세 미만 새 근로자, 그 사업주 밑 처음 90일(연속 달력일) $4.25 이상.
 * - 207(a)(1) · Fact Sheet #23 · 29 CFR 778.104·778.107: 주 40시간 넘는 시간은 regular rate 의 1.5배 이상, 주 평균 금지,
 *   regular rate 는 법정 최저임금보다 낮을 수 없음.
 * - 29 CFR 778.113: 주급 ÷ 그 주급이 보상하는 시간 = regular rate. 월급은 × 12 ÷ 52, 반월급은 × 24 ÷ 52 로 주급 환산.
 * - 203(m)(2) · Fact Sheet #15 · 531.59: tipped 현금 시급 $2.13 이상, tip credit 최대 $5.12, 팁이 모자라면 사업주가 채움.
 *
 * 주급 환산 배수: 주 1, 격주(두 workweek) ÷ 2, 반월 24/52, 월 12/52, 연 1/52(= 월 × 12 와 같은 셈).
 */
import rates from "../../rates/us/minimum-wage-2026.json";

export const FEDERAL_MIN = rates.federalMinimumWage.hourly;
export const FEDERAL_EFFECTIVE = rates.federalMinimumWage.effective;
export const YOUTH_MIN = rates.youth.hourly;
export const YOUTH_UNDER_AGE = rates.youth.underAge;
export const YOUTH_DAYS = rates.youth.firstConsecutiveCalendarDays;
export const TIPPED_CASH_MIN = rates.tipped.cashWageMin;
export const MAX_TIP_CREDIT = rates.tipped.maxTipCredit;
export const TIPS_PER_MONTH = rates.tipped.tipsPerMonthThreshold;
export const OT_HOURS = rates.overtime.weeklyHours;
export const OT_MULT = rates.overtime.multiplier;
export const SOURCES = rates.sources;

export type Period = "hourly" | "weekly" | "biweekly" | "semimonthly" | "monthly" | "yearly";

/** 그 기간 급여 × mult ÷ div = 주급 */
export const WEEKLY_FACTOR: Record<Exclude<Period, "hourly">, { mult: number; div: number }> = {
  weekly: { mult: 1, div: 1 },
  biweekly: { mult: 1, div: 2 },
  semimonthly: { mult: rates.salaryToHourly.semimonthlyToWeekly.multiply, div: rates.salaryToHourly.semimonthlyToWeekly.divide },
  monthly: { mult: rates.salaryToHourly.monthlyToWeekly.multiply, div: rates.salaryToHourly.monthlyToWeekly.divide },
  yearly: { mult: 1, div: 52 },
};

const cents = (x: number) => Math.round(x * 100) / 100;

/** 그 기간 급여를 주급으로 (반올림 없음) */
export function weeklyEquivalent(amount: number, period: Exclude<Period, "hourly">): number {
  const f = WEEKLY_FACTOR[period];
  return (Math.max(0, amount || 0) * f.mult) / f.div;
}

/** 시급 m 으로 한 주 h 시간 일할 때 법정 최소 주급 — 40시간까지 m, 넘는 시간 1.5m (반올림 없음) */
export function weeklyFloor(hours: number, minimum = FEDERAL_MIN): number {
  const h = Math.max(0, hours || 0);
  return minimum * Math.min(h, OT_HOURS) + OT_MULT * minimum * Math.max(0, h - OT_HOURS);
}

export interface SalaryCheck {
  /** 주급 환산(센트 반올림) */
  weekly: number;
  /** 주급 ÷ 주 시간 — 급여가 그 시간 전부를 보상한다고 볼 때의 시급(센트 반올림) */
  hourly: number;
  /** 같은 시간을 최저임금(+초과근무 1.5배)으로 받을 때의 주급(센트 반올림) */
  floor: number;
  /** 40시간 넘는 시간 */
  overtimeHours: number;
  /** 주급 ≥ 최소 주급 */
  meets: boolean;
  /** 주급 − 최소 주급 (음수면 모자람, 센트 반올림) */
  margin: number;
}

/**
 * 급여(기간)와 주 근무 시간으로 최저임금 비교. period 가 "hourly" 면 amount 는 시급이고,
 * 40시간 넘는 시간은 그 시급의 1.5배로 주급을 만든다.
 */
export function checkPay(amount: number, period: Period, hours: number, minimum = FEDERAL_MIN): SalaryCheck {
  const h = Math.max(0, hours || 0);
  const a = Math.max(0, amount || 0);
  const weeklyRaw =
    period === "hourly" ? a * Math.min(h, OT_HOURS) + OT_MULT * a * Math.max(0, h - OT_HOURS) : weeklyEquivalent(a, period);
  const hourlyRaw = period === "hourly" ? a : h > 0 ? weeklyRaw / h : 0;
  const floorRaw = weeklyFloor(h, minimum);
  return {
    weekly: cents(weeklyRaw),
    hourly: cents(hourlyRaw),
    floor: cents(floorRaw),
    overtimeHours: Math.max(0, h - OT_HOURS),
    meets: h > 0 && weeklyRaw + 1e-9 >= floorRaw,
    margin: cents(weeklyRaw - floorRaw),
  };
}

/** 시급 → 주·격주·반월·월·연 급여 (주 h 시간, 40시간 넘으면 1.5배, 52주) — 센트 반올림 */
export function payFromHourly(rate: number, hours = OT_HOURS) {
  const weekly = Math.max(0, rate || 0) * Math.min(hours, OT_HOURS) + OT_MULT * Math.max(0, rate || 0) * Math.max(0, hours - OT_HOURS);
  return {
    weekly: cents(weekly),
    biweekly: cents(weekly * 2),
    semimonthly: cents((weekly * 52) / 24),
    monthly: cents((weekly * 52) / 12),
    yearly: cents(weekly * 52),
  };
}

export interface TipCheck {
  /** 사업주가 쓴 tip credit(시간당) = 최저임금 − 현금 시급, 0 ~ 5.12 */
  tipCredit: number;
  /** 현금 시급이 $2.13 이상인지 */
  cashOk: boolean;
  /** 한 주 받아야 할 최소 = 7.25 × 시간 */
  required: number;
  /** 현금 + 팁 */
  received: number;
  /** 사업주가 더 줘야 할 금액(한 주) */
  makeUp: number;
}

/** tipped employee 한 주(40시간 이하) — 현금 시급·그 주 팁 합계로 $7.25 를 채웠는지(531.59) */
export function checkTipped(cashWage: number, weeklyTips: number, hours: number): TipCheck {
  const h = Math.min(Math.max(0, hours || 0), OT_HOURS);
  const cash = Math.max(0, cashWage || 0);
  const tips = Math.max(0, weeklyTips || 0);
  const required = FEDERAL_MIN * h;
  const received = cash * h + tips;
  return {
    tipCredit: cents(Math.min(MAX_TIP_CREDIT, Math.max(0, FEDERAL_MIN - cash))),
    cashOk: cash + 1e-9 >= TIPPED_CASH_MIN,
    required: cents(required),
    received: cents(received),
    makeUp: cents(Math.max(0, required - received)),
  };
}
