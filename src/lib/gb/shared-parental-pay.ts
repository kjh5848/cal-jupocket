/**
 * 영국 Statutory Shared Parental Pay(ShPP, birth 부모) — 주 지급액·하루치·남은 지급 주 수만 계산한다.
 * 영국판 /en-gb/shared-parental-pay/ 가 쓴다. 숫자는 rates/gb/shared-parental-pay-2026.json.
 *
 * 원문(2026-10-21 확인):
 * - Statutory Shared Parental Pay (General) Regulations 2014 reg 40 — 주 지급액 = min(£194.32, NWE × 90%),
 *   90% 주액이나 하루치(주액의 1/7)로 계산한 지급액에 1p 미만 끝수가 있으면 1p 올림. £194.32 는 SI 2026/148 art 10(2)(2026-04-06).
 * - 같은 규정 reg 10 — ShPP 주 수 = 39 − SMP/MA 주 수 − 상대가 신청한 ShPP 주 수, 일부 주는 한 주(10(12)).
 * - 같은 규정 reg 32(4)(5) — NWE: 월급이면 relevant period 소득 ÷ 개월 수(가장 가까운 정수) × 12 ÷ 52, 그 밖은 ÷ 날 수 × 7.
 * - NI 2015 규정 reg 10·32·40 — 같은 값.
 * - GOV.UK Shared Parental Leave and Pay — 예시 NWE £300 → £194.32, SMP 22주 → ShPP 17주, 합산 pay 최대 37주.
 *
 * 하루치: 40(2)(b) 의 '1/7 of the weekly rate' 를 반올림 전 90% 값의 1/7 로 읽고 올림(페이지에 밝힘).
 * 부동소수 끝수를 피하려고 NWE 는 분수(num/den 펜스)로, 지급액은 정수 펜스로 센다.
 */
import rates from "../../rates/gb/shared-parental-pay-2026.json";

export const CAP_PENCE = rates.weeklyRate.flatCapPence; // 19432
export const PERCENT = rates.weeklyRate.percentOfNwe; // 90
export const PAY_WEEKS = rates.weeks.payMax; // 39
export const MIN_SMP_WEEKS = 2; // GOV.UK — 출산 뒤 의무 휴가 2주(공장 4주), 합산 pay 최대 37주

/** NWE(펜스) = num / den — 반올림하지 않는다(reg 32 에 NWE 끝수 규정 없음). */
export interface Nwe {
  num: number;
  den: number;
}

const ceilDiv = (a: number, b: number) => Math.floor((a + b - 1) / b);

/** 주 평균 소득(펜스) 그대로 */
export function nweWeekly(pence: number): Nwe {
  return { num: Math.max(0, Math.floor(pence)), den: 1 };
}

/** 월급: relevant period 소득 ÷ 개월 수(가장 가까운 정수) × 12 ÷ 52 = 소득 × 3 ÷ (13 × 개월) — reg 32(4) */
export function nweMonthly(earningsPence: number, months: number): Nwe | null {
  const m = Math.round(months);
  if (!Number.isFinite(m) || m < 1 || !(earningsPence >= 0)) return null;
  return { num: Math.floor(earningsPence) * 3, den: 13 * m };
}

/** 그 밖: relevant period 소득 ÷ 날 수 × 7 — reg 32(5) */
export function nweDays(earningsPence: number, days: number): Nwe | null {
  const d = Math.floor(days);
  if (!Number.isFinite(d) || d < 1 || !(earningsPence >= 0)) return null;
  return { num: Math.floor(earningsPence) * 7, den: d };
}

/** NWE 를 펜스(소수)로 — 화면 표시용 */
export const nwePence = (n: Nwe) => n.num / n.den;

export interface WeeklyRate {
  /** 주 지급액(펜스) = min(£194.32, 90% 올림) */
  weekly: number;
  /** £194.32 상한이 적용됐는지(90% 가 상한 이상) */
  capped: boolean;
  /** 90% 주액(펜스, 1p 올림) — 상한 전 */
  ninety: number;
  /** 하루치(펜스) = 1/7, 1p 올림 */
  daily: number;
}

export function weeklyRate(n: Nwe): WeeklyRate {
  const tenNinety = 9 * n.num; // 90% × 10 × den
  const ninety = ceilDiv(tenNinety, 10 * n.den);
  const capped = tenNinety >= 10 * n.den * CAP_PENCE;
  if (capped) return { weekly: CAP_PENCE, capped, ninety, daily: ceilDiv(CAP_PENCE, 7) };
  return { weekly: ninety, capped, ninety, daily: ceilDiv(tenNinety, 70 * n.den) };
}

export interface WeeksLeft {
  /** 남은 ShPP 주 수 */
  weeks: number;
  /** 계산에 쓴 SMP/MA 주 수(올림, 최소 2) */
  smp: number;
  /** 계산에 쓴 상대 신청 주 수(올림) */
  partner: number;
  /** SMP/MA 주 수를 2 로 올렸는지 */
  raisedToMin: boolean;
}

/** reg 10(1): 39 − SMP/MA 주 수 − 상대가 신청한 ShPP 주 수(일부 주는 한 주, 10(12)) */
export function weeksLeft(smpWeeks: number, partnerWeeks: number): WeeksLeft {
  const up = (x: number) => (Number.isFinite(x) && x > 0 ? Math.ceil(x - 1e-9) : 0);
  const s0 = up(smpWeeks);
  const smp = Math.min(PAY_WEEKS, Math.max(MIN_SMP_WEEKS, s0));
  const partner = up(partnerWeeks);
  return { weeks: Math.max(0, PAY_WEEKS - smp - partner), smp, partner, raisedToMin: s0 < MIN_SMP_WEEKS };
}
