/**
 * 통상임금 — 근로기준법 시행령 제6조 제2항(지급 단위별 시간급 환산, 제7호 합산)·제3항(1일 통상임금). rates: ordinary-wage-2026.json
 *
 * 월 산정 기준시간은 1주 소정근로시간 + 주휴시간(labor.ts weeklyHolidayHours) + 그 밖에 유급으로 처리되는 시간에 365 ÷ 7 ÷ 12 를 곱한다.
 * 주 40시간·다른 유급시간 0 이면 최저임금 고시와 같은 209시간(labor.ts hourlyFromMonthly 와 같은 규칙).
 * 항목별 시간급은 버리지 않고 더하고(제7호), 통상시급만 원 미만 버림. 1일 통상임금은 버리기 전 시간급 × 1일 소정근로시간을 버림.
 */
import r from "../rates/ordinary-wage-2026.json";
import labor from "../rates/labor-2026.json";
import { weeklyHolidayHours, WEEKS_PER_MONTH } from "./labor";

/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);
const pos = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0);

export type WagePeriod = "hour" | "day" | "week" | "month" | "2month" | "quarter" | "half" | "year";

export const PERIOD_LABEL: Record<WagePeriod, string> = {
  hour: "시간마다",
  day: "하루마다",
  week: "주마다",
  month: "매월",
  "2month": "2개월마다",
  quarter: "분기마다",
  half: "반기마다",
  year: "1년에 한 번",
};

export interface WageItem {
  label?: string;
  amount: number;
  period: WagePeriod;
  /** 통상임금에 넣을지 — 항목 판단은 사용자 몫(제1항 정의) */
  include: boolean;
}

export interface WageBasis {
  /** 1주 소정근로시간(40 이하) */
  weeklyHours: number;
  /** 1일 소정근로시간 */
  dailyHours: number;
  /** 주휴 말고 1주에 유급으로 처리되는 시간(예: 토요일 유급 4시간) */
  extraPaidWeekly?: number;
}

/** 1주·월 통상임금 산정 기준시간(제2항 제3호·제4호) */
export function basisHours(b: WageBasis) {
  const week = Math.min(pos(b.weeklyHours), labor.weeklyHoliday.maxWeeklyHours);
  const holiday = weeklyHolidayHours(week);
  const extra = pos(b.extraPaidWeekly ?? 0);
  const weekly = week + holiday + extra;
  const monthly = week === labor.weeklyHoliday.maxWeeklyHours && extra === 0 ? labor.minWage.monthlyHours : weekly * WEEKS_PER_MONTH;
  return { week, holiday, extra, weekly, monthly, daily: pos(b.dailyHours) };
}

/** 한 항목의 시간급(버리지 않은 값) */
export function itemHourly(item: Pick<WageItem, "amount" | "period">, h: ReturnType<typeof basisHours>): number {
  const a = pos(item.amount);
  const div = (n: number) => (n > 0 ? a / n : 0);
  switch (item.period) {
    case "hour":
      return a;
    case "day":
      return div(h.daily);
    case "week":
      return div(h.weekly);
    case "month":
      return div(h.monthly);
    default:
      return div(r.periodMonths[item.period] * h.monthly);
  }
}

export function ordinaryWage(items: WageItem[], basis: WageBasis) {
  const h = basisHours(basis);
  const rows = items.map((it) => {
    const hourly = itemHourly(it, h);
    return { ...it, hourly, monthly: fl(hourly * h.monthly) };
  });
  const used = rows.filter((x) => x.include && x.amount > 0);
  const hourlyExact = used.reduce((s, x) => s + x.hourly, 0);
  return {
    basis: h,
    rows,
    hourlyExact,
    /** 통상시급(원 미만 버림) */
    hourly: fl(hourlyExact),
    /** 1일 통상임금(제3항) */
    daily: fl(hourlyExact * h.daily),
    /** 넣은 항목을 월 금액으로 바꾼 합계(통상시급 × 월 기준시간) */
    monthly: fl(hourlyExact * h.monthly),
    /** 뺀 항목의 월 환산 합계 — 보여 주기용 */
    excludedMonthly: rows.filter((x) => !x.include).reduce((s, x) => s + x.monthly, 0),
  };
}
