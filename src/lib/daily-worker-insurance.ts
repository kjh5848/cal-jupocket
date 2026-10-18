/**
 * 일용직 4대보험 — 한 달 일당·근로일수로 가입 여부를 가리고 근로자·사업주 몫을 어림한다.
 * 가입 기준: 국민연금법 제8조·시행령 제2조 제1호 가목·나목, 국민건강보험법 제6조 제2항 제1호·시행령 제9조 제1호,
 * 고용보험법 시행령 제3조 제2항, 보험료징수법 제13조 제3항(65세 이후 새로 고용). rates: four-insurance-2026.json(daily)
 * 보험료는 four-insurance.ts payroll(), 소득세는 withholding-tax.ts 와 같은 산식(소득세법 제47조 ②·제134조 ③·제86조).
 *
 * 국민연금 '1개월 동안의 소득이 고시 금액 이상' 기준은 고시 금액을 원문으로 확인하지 못해 판정에 넣지 않는다 —
 * 일수·시간 기준에 안 걸리면 '조건부'로 돌려주고 대상일 때 보험료를 따로 알려 준다.
 */
import r from "../rates/four-insurance-2026.json";
import w from "../rates/withholding-tax-2026.json";
import { payroll } from "./four-insurance";

const D = r.daily;
const T = w.daily;
const fl = (v: number) => Math.floor(v + 1e-6);

export type Site = "general" | "construction";
export type Age = "under60" | "60plus" | "65new";
export type PensionStatus = "covered" | "conditional" | "excluded";

export interface DailyInput {
  /** 일당(세전, 비과세 뺀 금액) */
  dayWage: number;
  /** 이번 달 근로일수 */
  days: number;
  /** 하루 근로시간 */
  hours: number;
  /** 1개월 이상 계속 일하는가 */
  monthOrMore: boolean;
  site?: Site;
  age?: Age;
  /** 며칠 치를 한꺼번에 받는가 — 소액부징수 1천원을 지급 합계로 본다 */
  lump?: boolean;
  /** 고용안정·직업능력개발 보험료율 구간 */
  stabilityTier?: 0 | 1 | 2 | 3;
  onDate?: string;
}

/** 가입 판정만 */
export function dailyEligibility(i: Pick<DailyInput, "days" | "hours" | "monthOrMore" | "site" | "age">) {
  const days = Math.max(0, Math.floor(i.days || 0));
  const monthHours = days * Math.max(0, i.hours || 0);
  const site = i.site ?? "general";
  const age = i.age ?? "under60";
  const byDays = days >= D.pensionMinDays;
  const byHours = site === "general" && monthHours >= D.pensionMinHours;
  let pension: PensionStatus;
  if (!i.monthOrMore || age !== "under60") pension = "excluded";
  else pension = byDays || byHours ? "covered" : "conditional";
  // 건강보험: 1개월 미만 일용근로자 제외(법 제6조 ②1호), 1개월 소정근로시간 60시간 미만 단시간근로자 제외(시행령 제9조 1호)
  const health = i.monthOrMore && monthHours >= D.healthMinHours;
  return { pension, health, employment: true, unemploymentFree: age === "65new", monthHours, byDays, byHours };
}

/** 일용근로소득 원천징수 — 매일 받으면 하루치마다, 모아 받으면 지급 합계로 1천원 미만 소액부징수 */
export function dailyIncomeTax(dayWage: number, days: number, lump = false) {
  const n = Math.max(0, Math.floor(days || 0));
  const one = (wage: number, d: number) => {
    const base = Math.max(0, fl(wage) - T.deductionPerDay) * d;
    const computed = fl(base * T.rate);
    const raw = computed - fl(computed * T.creditRate);
    const tax = raw < T.minimum ? 0 : raw;
    return { raw, tax, local: fl(tax * 0.1) };
  };
  if (lump) {
    const x = one(dayWage, n);
    return { perDay: one(dayWage, 1), tax: x.tax, local: x.local, total: x.tax + x.local };
  }
  const d = one(dayWage, 1);
  return { perDay: d, tax: d.tax * n, local: d.local * n, total: (d.tax + d.local) * n };
}

/** 한 달 일용직 4대보험·세금 어림 */
export function dailyWorkerInsurance(i: DailyInput) {
  const days = Math.max(0, Math.floor(i.days || 0));
  const pay = fl(Math.max(0, i.dayWage || 0) * days);
  const e = dailyEligibility(i);
  const p = payroll(pay, { stabilityTier: i.stabilityTier, over65New: e.unemploymentFree, onDate: i.onDate });
  const pension = e.pension === "covered" ? p.pension : 0;
  const health = e.health ? p.health : 0;
  const care = e.health ? p.care : 0;
  const insurance = pension + health + care + p.employment;
  const tax = dailyIncomeTax(i.dayWage, days, i.lump);
  const deduction = insurance + tax.total;
  const employer = {
    pension,
    health,
    care,
    employment: p.employer.employment,
    total: pension + health + care + p.employer.employment,
  };
  return {
    pay,
    eligibility: e,
    pension,
    /** 고시 소득 기준으로 국민연금 대상이 될 때의 근로자 몫(조건부일 때만 의미) */
    pensionIfCovered: e.pension === "conditional" ? p.pension : 0,
    pensionBase: p.pensionBase,
    health,
    care,
    employment: p.employment,
    insurance,
    tax,
    deduction,
    takeHome: pay - deduction,
    employer,
  };
}
