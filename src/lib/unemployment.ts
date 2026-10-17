/**
 * 실업급여(구직급여) — 고용보험법 제45조(기초일액·최저기초일액·상한), 제46조(60%·80%), 제50조·별표 1(소정급여일수),
 * 시행령 제68조(기초일액 상한 11만3,500원), 시행규칙 제91조의2(이직 전 1일 소정근로시간). rates: unemployment-2026.json, labor-2026.json
 *
 * 기초일액은 평균임금(이직 전 3개월 임금 총액 ÷ 그 기간 총일수)만 받는다 — 통상임금이 더 큰 경우(제45조 제2항)는 넣지 않았다.
 */
import r from "../rates/unemployment-2026.json";
import L from "../rates/labor-2026.json";

const A = r.amount;
const D = r.days;
/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

/** 이직 전 1일 소정근로시간 — 주 단위: (주 소정근로시간 + 유급휴일) ÷ 48 × 8. 유급휴일(주휴)은 주 15시간 이상일 때 주 시간 ÷ 5 */
export function dailyHoursBeforeLeaving(weeklyHours: number): number {
  const h = Math.min(Math.max(0, weeklyHours), 40);
  const holiday = h >= 15 ? h / 5 : 0;
  return Math.round(((h + holiday) / 48) * 8 * 100) / 100;
}

/** 이직일 기준 3개월 전 날부터 이직일 전날까지의 일수. 3개월 전 달에 같은 날이 없으면 그 달 말일(민법 제160조 제3항) */
export function daysInLastThreeMonths(leaveDate: Date): number {
  const y = leaveDate.getFullYear();
  const m = leaveDate.getMonth() - 3;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const start = new Date(y, m, Math.min(leaveDate.getDate(), lastDay));
  return Math.round((leaveDate.getTime() - start.getTime()) / 86_400_000);
}

/** 피보험기간(년) → 별표 1 의 구간 번호 */
export function insuredBracket(years: number): number {
  return years < 1 ? 0 : years < 3 ? 1 : years < 5 ? 2 : years < 10 ? 3 : 4;
}

/** 소정급여일수(별표 1) — 50세 이상·장애인은 over50 */
export function benefitDays(insuredYears: number, over50: boolean): number {
  return (over50 ? D.over50 : D.under50)[insuredBracket(insuredYears)];
}

export interface BenefitInput {
  /** 이직 전 3개월 임금 총액 */
  wage3m: number;
  /** 그 3개월의 총일수 */
  days3m?: number;
  /** 이직 전 1주 소정근로시간 */
  weeklyHours?: number;
  insuredYears: number;
  over50?: boolean;
  /** 이직일이 속한 해의 최저임금 */
  year?: 2026 | 2027;
}

export function unemploymentBenefit(o: BenefitInput) {
  const days3m = o.days3m ?? 92;
  const average = fl(Math.max(0, o.wage3m) / days3m);
  const minWage = L.minWage[String(o.year ?? 2026) as "2026" | "2027"].hourly;
  const hours = dailyHoursBeforeLeaving(o.weeklyHours ?? 40);
  const minBase = fl(hours * minWage);
  const capped = Math.min(average, A.baseCap);
  const byRate = fl(capped * A.rate);
  const minDaily = fl(minBase * A.minRate);
  const daily = average < minBase ? minDaily : Math.max(byRate, minDaily);
  const days = benefitDays(o.insuredYears, !!o.over50);
  return {
    average,
    baseDaily: average < minBase ? minBase : capped,
    hours,
    minBase,
    minDaily,
    maxDaily: fl(A.baseCap * A.rate),
    daily,
    /** 어느 쪽이 적용됐나 */
    which: daily === minDaily ? ("하한" as const) : capped < average ? ("상한" as const) : ("60%" as const),
    days,
    total: daily * days,
  };
}
