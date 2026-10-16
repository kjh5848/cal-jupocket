import rates from "../rates/2026.json";
import { won } from "./money";

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

export function otherIncome(gross: number) {
  const withholding = won(gross * O);
  return { gross: won(gross), withholding, net: won(gross) - withholding };
}
