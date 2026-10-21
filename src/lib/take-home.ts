/**
 * 월급·연봉 실수령액 — 근로소득 간이세액표(소득세법 시행령 별표 2) + 4대보험 근로자 부담 + 지방소득세.
 *
 *   과세 월급여   월급 − 비과세(식대 월 20만원 이하 등)              소득세법 제12조 제3호 러목
 *   소득세        별표 2 표(770천원~10,000천원) 또는 초과 산식       시행령 제189조·제194조
 *   지방소득세    소득세의 10%(특별징수)                            지방세법 제103조의13
 *   4대보험       four-insurance.ts payroll() — 과세 월급여 기준
 *   실수령액      월급 − 소득세 − 지방소득세 − 4대보험
 *
 * 간이세액표는 매달 떼는 어림값이고 1년치 실제 세금은 연말정산에서 정해진다.
 * 표의 행은 scripts/fetch_withholding_table.py 가 원문 문서뷰어 XML 에서 만든 것이다.
 */
import t from "../rates/withholding-table-2026.json";
import local from "../rates/local-extra-2026.json";
import { payroll } from "./four-insurance";

const fl = (v: number) => Math.floor(v + 1e-6);
const rows = t.rows as number[][];

/** 표에서 가족 수(1~11) 열의 세액. 월급여(원, 비과세 제외) 기준 */
function tableTax(pay: number, family: number): number {
  const col = 1 + Math.min(Math.max(1, family), 11);
  if (pay < rows[0][0] * 1000) return 0;
  if (pay < 10_000_000) {
    const k = Math.floor(pay / 1000);
    const row = rows.find((r) => k >= r[0] && k < r[1]);
    return row ? row[col] : 0;
  }
  const base = t.at10000[col - 2];
  if (pay === 10_000_000) return base;
  const b = t.over10000.find((x) => pay > x.over && (x.upTo === null || pay <= x.upTo))!;
  return fl(base + b.add + (pay - b.over) * b.factor * b.rate);
}

/**
 * 간이세액표 소득세(월). family 는 본인 포함 공제대상가족 수, kids 는 그중 8세 이상 20세 이하 자녀 수.
 * 가족 11명 초과는 비고 4, 자녀 공제는 비고 3(음수면 0).
 */
export function simplifiedTax(pay: number, family = 1, kids = 0): number {
  const p = Math.max(0, fl(pay));
  const f = Math.max(1, Math.floor(family));
  let tax = tableTax(p, f);
  if (f > 11) tax = tableTax(p, 11) - (tableTax(p, 10) - tableTax(p, 11)) * (f - 11);
  const n = Math.min(Math.max(0, Math.floor(kids)), f - 1);
  const K = t.kidsDeduction;
  const cut = n === 0 ? 0 : n === 1 ? K.one : K.two + K.perExtra * (n - 2);
  return Math.max(0, tax - cut);
}

export interface TakeHomeOptions {
  /** 월급 중 비과세(식대 등). 기본 0 */
  nonTaxable?: number;
  family?: number;
  kids?: number;
  year?: number;
  onDate?: string;
}

/** 월급(세전, 비과세 포함) → 공제 내역과 실수령액 */
export function takeHome(monthly: number, o: TakeHomeOptions = {}) {
  const gross = Math.max(0, fl(monthly));
  const nonTaxable = Math.min(gross, Math.max(0, fl(o.nonTaxable ?? 0)));
  const taxable = gross - nonTaxable;
  const ins = payroll(taxable, { year: o.year, onDate: o.onDate });
  const incomeTax = simplifiedTax(taxable, o.family ?? 1, o.kids ?? 0);
  const localTax = fl(incomeTax * local.localIncome.specialRatio);
  const deductions = ins.total + incomeTax + localTax;
  return {
    gross,
    taxable,
    pension: ins.pension,
    health: ins.health,
    care: ins.care,
    employment: ins.employment,
    incomeTax,
    localTax,
    deductions,
    net: gross - deductions,
  };
}

/** 연봉을 월급으로 나누는 수 — 퇴직금 별도면 12, 연봉에 퇴직금이 들어 있다고 보면 13(1/13 을 퇴직금 몫으로 떼어 둠) */
export function annualDivisor(severanceIncluded = false): 12 | 13 {
  return severanceIncluded ? 13 : 12;
}

/** 연봉 → 12(퇴직금 포함이면 13)로 나눈 월급의 실수령액(원 미만 버림) */
export function takeHomeFromAnnual(annual: number, o: TakeHomeOptions & { severanceIncluded?: boolean } = {}) {
  return takeHome(fl(Math.max(0, annual) / annualDivisor(o.severanceIncluded)), o);
}

export const MEAL_ALLOWANCE = t.mealAllowance.monthly;
