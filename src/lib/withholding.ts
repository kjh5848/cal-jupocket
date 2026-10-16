import rates from "../rates/2026.json";
import { won } from "./money";
import { otherIncomeTax, otherIncomeExemptMax } from "./income-tax-rate";

const B = rates.withholding.business; // 0.033
const O = rates.withholding.other;    // 0.088
// 3.3% 중 소득세 몫(3%) — 지방소득세는 소득세의 10%라서 3.3% ÷ 1.1
const B_INCOME = B / (1 + rates.localTaxRate);

/** 원천징수액을 소득세·지방소득세로 나눈다. 합은 원천징수액과 같게 지방소득세를 나머지로 둔다. */
function split(gross: number, withholding: number) {
  const incomeTax = won(gross * B_INCOME);
  return { incomeTax, localTax: withholding - incomeTax };
}

export function fromGross(gross: number) {
  const withholding = won(gross * B);
  return { gross: won(gross), withholding, net: won(gross) - withholding, ...split(won(gross), withholding) };
}

export function fromNet(net: number) {
  const gross = won(net / (1 - B));
  const withholding = won(gross * B);
  return { gross, withholding, net: gross - withholding, ...split(gross, withholding) };
}

/**
 * 기타소득(필요경비 60% — 강연료·원고료 등) 원천징수. 계산은 소득세율 시리즈의 otherIncomeTax 하나로:
 * 소득금액(받은 금액 × 40%)이 건별 5만원 이하면 과세하지 않는다(소득세법 제84조 제3호) — 125,000원까지 0원.
 */
export function otherIncome(gross: number) {
  const g = won(gross);
  const t = otherIncomeTax(g);
  return { gross: g, withholding: t.total, net: g - t.total, incomeTax: t.tax, localTax: t.local, exempt: t.exempt };
}

/** 기타소득 역산 — 실수령이 과세최저한 이하면 뗄 세금이 없어 계약금액 = 실수령, 아니면 실수령 ÷ (1 − 8.8%) */
export function otherIncomeFromNet(net: number) {
  const n = won(net);
  return otherIncome(n <= otherIncomeExemptMax() ? n : won(n / (1 - O)));
}
