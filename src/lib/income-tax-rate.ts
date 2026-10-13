/**
 * 소득세율 시리즈 계산 — 소득세법 제55조(기본세율), 제129조(원천징수세율), 제84조(기타소득 과세최저한), 시행령 제87조(필요경비).
 * 근로소득 연봉별 세금은 year-end-calc.ts yearEnd() 와 four-insurance.ts payroll() 을 이어 붙인 어림이다.
 */
import r from "../rates/income-tax-rate-2026.json";
import tr from "../rates/2026.json";
import { taxOn } from "./deduction";
import { yearEnd } from "./year-end-calc";
import { payroll } from "./four-insurance";

const fl = (v: number) => Math.floor(v + 1e-6);

/** 과세표준이 속한 구간의 세율(한계세율) */
export function marginalRate(base: number): number {
  return tr.incomeTaxBrackets.find((b) => b.upTo === null || base <= b.upTo)!.rate;
}

/** 산출세액과 평균세율 */
export function basicTax(base: number) {
  const tax = taxOn(base);
  return { tax, marginal: marginalRate(base), average: base > 0 ? tax / base : 0, local: fl(tax * 0.1) };
}

/** 기타소득 — 받은 금액 × (1 − 필요경비율) = 소득금액, 건별 5만원 이하면 0, 아니면 × 20% */
export function otherIncomeTax(amount: number, expenseRate = r.other.expense60Rate) {
  const income = fl(amount * (1 - expenseRate));
  const exempt = income <= r.other.minimum;
  const tax = exempt ? 0 : fl(income * r.other.rate);
  const local = fl(tax * 0.1);
  return { income, exempt, tax, local, total: tax + local, effective: amount ? (tax + local) / amount : 0 };
}

/** 과세최저한에 걸리는 최대 지급액 — 소득금액 5만원 ÷ (1 − 필요경비율) */
export function otherIncomeExemptMax(expenseRate = r.other.expense60Rate): number {
  return Math.round(r.other.minimum / (1 - expenseRate));
}

/** 사업소득 원천징수 3% + 지방소득세 */
export function businessWithholding(amount: number) {
  const tax = fl(amount * r.business.rate);
  const local = fl(tax * r.business.localRatio);
  return { tax, local, total: tax + local, net: amount - tax - local };
}

/** 연봉(총급여) → 1인 가구 근로소득세 어림. 4대보험은 월급 = 연봉 ÷ 12 로 payroll() */
export function earnedTaxByPay(pay: number) {
  const m = payroll(Math.floor(pay / 12));
  const y = yearEnd({ pay, persons: 1, pensionInsurance: m.pension * 12, socialInsurance: (m.health + m.care + m.employment) * 12, prepaid: 0 });
  const local = fl(y.decided * 0.1);
  return { ...y, local, total: y.decided + local, effective: pay ? (y.decided + local) / pay : 0, monthly: fl((y.decided + local) / 12) };
}
