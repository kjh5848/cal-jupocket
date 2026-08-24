/**
 * 부가가치세 계산 (순수 함수).
 *
 * 세율·부가가치율은 rates/vat-2026.json(국세청 대조)에서만 가져온다.
 * 일반과세는 공급가액↔공급대가 양방향 환산, 간이과세는 업종별
 * 부가가치율로 납부세액을 낸다.
 */
import vat from "../rates/vat-2026.json";
import { won } from "./money";

const RATE = vat.standardRate; // 0.1

/**
 * 일반과세 — 공급가액에서 부가세·공급대가(합계) 계산.
 * 공급가액(net) → 부가세 = net × 10%, 합계 = net + 부가세
 */
export function fromSupply(supply: number) {
  const s = won(supply);
  const tax = won(s * RATE);
  return { supply: s, tax, total: s + tax };
}

/**
 * 일반과세 — 합계금액(공급대가)에서 공급가액·부가세 역산.
 * 합계(total) → 공급가액 = total / 1.1, 부가세 = total − 공급가액
 */
export function fromTotal(total: number) {
  const t = won(total);
  const supply = won(t / (1 + RATE));
  return { supply, tax: t - supply, total: t };
}

/**
 * 간이과세 — 납부세액 = 공급대가 × 업종별 부가가치율 × 10%.
 * (매입 공제는 매입액이 있어야 하므로 여기서는 매출 기준 납부세액만 낸다.)
 */
export function simplifiedTax(supplyValue: number, valueAddedRate: number) {
  const s = won(supplyValue);
  return {
    supplyValue: s,
    valueAddedRate,
    tax: won(s * valueAddedRate * RATE),
  };
}

/** 공급대가 합계가 납부의무 면제 기준(4,800만원) 미만인지 */
export function isPaymentExempt(annualSupplyValue: number): boolean {
  return annualSupplyValue < vat.simplified.paymentExemptionUnder;
}

/** 연 매출이 간이과세 적용 기준(1억 400만원) 미만인지 */
export function isSimplifiedEligible(annualRevenue: number): boolean {
  return annualRevenue < vat.simplified.eligibilityRevenueUnder;
}
