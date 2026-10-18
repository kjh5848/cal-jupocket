/**
 * 야근수당(연장·야간·휴일 가산) — 근로기준법 제56조(연장 50%·야간 50%·휴일 8시간 이내 50%/초과 100%), 시행령 별표 1(상시 4명 이하 적용 제외),
 * 시행령 제6조 제2항(통상시급 산정). rates: overtime-2026.json
 *
 * 야간 시간은 소정근로·연장·휴일 시간 가운데 밤 10시~오전 6시에 걸친 부분이라 시간 임금을 다시 더하지 않고 가산(50%)만 붙인다.
 * 휴일근로는 제56조 제2항이 "제1항에도 불구하고"로 따로 정해 연장 가산을 겹치지 않고 하루 8시간까지 50%, 넘는 시간 100% 를 붙인다.
 * 통상시급은 원 미만 버림, 항목마다 시급 × 시간 × 비율을 원 미만 버림(시행령에 단수 규정이 없다 — labor.ts 와 같은 관례).
 */
import r from "../rates/overtime-2026.json";
import { hourlyFromMonthly } from "./labor";

const P = r.premium;
/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);
const hrs = (v: number) => Math.max(0, Number.isFinite(v) ? v : 0);

/** 휴일에 하루 h시간씩 days일 일했을 때 8시간 이내·초과 시간(하루 단위로 나눈다 — 제56조 제2항) */
export function splitHoliday(hoursPerDay: number, days = 1) {
  const h = hrs(hoursPerDay);
  const d = Math.max(0, Math.floor(hrs(days)));
  const within = Math.min(h, P.holidayLimitHours) * d;
  const over = Math.max(0, h - P.holidayLimitHours) * d;
  return { within: Math.round(within * 100) / 100, over: Math.round(over * 100) / 100 };
}

/** 월급(1주 소정근로시간 기준) 또는 시급 → 통상시급. 월급은 labor.ts hourlyFromMonthly(주 40시간이면 고시의 209시간) */
export function ordinaryHourly(input: { mode: "hourly" | "monthly"; wage: number; weeklyHours?: number }): number {
  const w = Math.max(0, input.wage || 0);
  if (input.mode === "hourly") return fl(w);
  return hourlyFromMonthly(w, input.weeklyHours ?? 40, true);
}

export interface OvertimeInput {
  hourly: number;
  /** 연장근로 시간(1일 8시간·1주 40시간을 넘긴 시간, 휴일근로 제외) */
  overtime: number;
  /** 야간근로 시간(밤 10시~오전 6시, 위 시간과 겹치는 부분 포함) */
  night: number;
  /** 휴일근로 8시간 이내 시간 */
  holidayWithin: number;
  /** 휴일근로 8시간 초과 시간 */
  holidayOver: number;
  /** 상시 4명 이하 사업장 — 제56조 적용 제외(별표 1) */
  small?: boolean;
}

export function overtimePay(input: OvertimeInput) {
  const hourly = fl(Math.max(0, input.hourly || 0));
  const ot = hrs(input.overtime);
  const night = hrs(input.night);
  const hw = hrs(input.holidayWithin);
  const ho = hrs(input.holidayOver);
  const small = !!input.small;
  const k = small ? 0 : 1;
  const premium = {
    overtime: fl(hourly * ot * P.overtime * k),
    night: fl(hourly * night * P.night * k),
    holidayWithin: fl(hourly * hw * P.holidayWithin8 * k),
    holidayOver: fl(hourly * ho * P.holidayOver8 * k),
  };
  const premiumTotal = premium.overtime + premium.night + premium.holidayWithin + premium.holidayOver;
  /** 연장·휴일에 일한 시간 자체의 임금(시급 × 시간). 야간은 다른 칸 시간과 겹쳐 더하지 않는다 */
  const basePay = fl(hourly * (ot + hw + ho));
  return {
    hourly,
    small,
    hours: { overtime: ot, night, holidayWithin: hw, holidayOver: ho },
    premium,
    premiumTotal,
    basePay,
    /** 연장·휴일 시간 임금 + 가산 전부 */
    total: basePay + premiumTotal,
    /** 연장 시간이 1주 12시간 한도를 넘는지(입력이 1주 기준일 때만 뜻이 있다 — 제53조 제1항) */
    overWeeklyLimit: ot > r.overtimeLimit.weeklyHours,
  };
}
