/**
 * 근속 기간 계산기(/tools/service-period/) — 입사일 · 마지막 근무일 → 몇 년 몇 개월 며칠 · 재직일수.
 *
 * 원문(rates/service-period-2026.json):
 * - 민법 제155조 — 다른 정함이 없으면 기간 계산은 민법 기간 규정을 따른다.
 * - 민법 제157조 단서 — 오전 0시부터 시작하는 기간은 첫날을 센다(입사일 산입).
 * - 민법 제160조 ②③ — n년·n개월은 해당일 전날로 차고, 해당일이 없는 달은 그 달 말일로 찬다.
 * - 고용노동부 퇴직금 계산 — 퇴직일 = 마지막 근무일 다음 날, 재직일수는 입사일 ~ 마지막 근무일(양 끝 포함).
 *
 * 정한 규칙(테스트로 고정):
 * - 년·월·일 나누기는 만 나이 계산기(lib/age.ts)와 같은 셈이다 — 입사일을 출생일, 퇴직일을 기준일로 놓으면 같다.
 *   그래서 1/31 입사 → 2월 말일까지 일하면 1개월, 2/29 입사 → 평년 2/28 까지 일하면 1년(퇴직일 3/1).
 *   날짜 계산기(/tools/date-diff/)는 없는 날을 말일로 당기는 셈이라 1/31 시작 기간에서 값이 다를 수 있다.
 * - '1년 이상'은 lib/severance-pay.ts 의 oneYearServed 와 같은 판정(퇴직일이 1년 뒤 같은 날 이후).
 * - 근속연수 소수 = 재직일수 ÷ 365(고용노동부 퇴직금 셈의 비율), 소수 둘째 자리 버림.
 * - 날짜는 UTC 일련번호로 센다(서머타임·시간대 무관).
 */
import { toDay, spanText } from "./date-calc";
import { age, dayOfAge } from "./age";

export interface ServicePeriod {
  start: number;
  /** 마지막 근무일 */
  last: number;
  /** 퇴직일 = 마지막 근무일 + 1 */
  retire: number;
  years: number;
  months: number;
  days: number;
  /** 다 찬 개월 수 전체 */
  totalMonths: number;
  /** 재직일수 — 양 끝 포함 */
  serviceDays: number;
  /** 주 + 남는 일 */
  weeks: number;
  weekRest: number;
  /** 재직일수 ÷ 365, 소수 둘째 자리 버림 */
  yearsDecimal: number;
  /** 계속근로 1년 이상 */
  oneYear: boolean;
  /** 다음에 만 (years+1)년이 차는 마지막 근무일 · 그날까지 남은 날(마지막 근무일 기준) */
  nextYears: number;
  nextLastDay: number;
  daysToNext: number;
}

/** 일련번호 둘 → 근속 기간. 마지막 근무일이 입사일보다 앞이면 null */
export function servicePeriod(start: number, last: number): ServicePeriod | null {
  if (last < start) return null;
  const retire = last + 1;
  const a = age(start, retire)!;
  const serviceDays = retire - start;
  const nextYears = a.years + 1;
  const nextLastDay = dayOfAge(start, nextYears) - 1;
  return {
    start,
    last,
    retire,
    years: a.years,
    months: a.months,
    days: a.days,
    totalMonths: a.totalMonths,
    serviceDays,
    weeks: Math.floor(serviceDays / 7),
    weekRest: serviceDays % 7,
    yearsDecimal: Math.floor((serviceDays / 365) * 100 + 1e-9) / 100,
    oneYear: a.years >= 1,
    nextYears,
    nextLastDay,
    daysToNext: nextLastDay - last,
  };
}

/** 'YYYY-MM-DD' 둘 → 근속 기간. 종료일이 퇴직일(마지막 근무일 다음 날)이면 retireMode = true */
export function servicePeriodOf(start: string, end: string, retireMode = false): ServicePeriod | null {
  const s = toDay(start);
  const e = toDay(end);
  if (s === null || e === null) return null;
  return servicePeriod(s, retireMode ? e - 1 : e);
}

/** 2년 0개월 5일 → '2년 5일'(date-calc 의 spanText 와 같은 표기) */
export function periodText(p: Pick<ServicePeriod, "years" | "months" | "days">): string {
  return spanText({ years: p.years, months: p.months, restDays: p.days });
}
