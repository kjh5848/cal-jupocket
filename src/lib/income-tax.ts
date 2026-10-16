import rates from "../rates/2026.json";
import itr from "../rates/income-tax-rate-2026.json";
import { won } from "./money";

export interface RefundInput {
  grossIncome: number;   // 연간 사업소득 총수입
  expenseRate: number;   // 단순경비율 (0~1)
  dependents: number;    // 본인 포함 인적공제 인원
}

/**
 * 종소세 환급 예상 — 소득세와 지방소득세를 따로 정산해 더한다.
 * 확정신고 때 결정세액에서 빼는 기납부세액은 원천징수 '소득세'(3%)뿐이고(소득세법 제76조 제3항 제4호),
 * 3.3% 중 0.3% 는 지방소득세(결정세액의 10%)에서 따로 정산한다.
 */
export function estimateRefund(input: RefundInput) {
  const income = input.grossIncome * (1 - input.expenseRate);
  const taxableBase = Math.max(
    0,
    income - input.dependents * rates.personalDeductionPerHead
  );
  // Safe: last bracket has upTo: null, so find() always matches
  const bracket = rates.incomeTaxBrackets.find(
    (b) => b.upTo === null || taxableBase <= b.upTo
  )!;
  const computedBefore = taxableBase * bracket.rate - bracket.deduction;
  const computedTax = won(Math.max(0, won(computedBefore) - rates.standardTaxCredit));
  const localTax = won(computedTax * rates.localTaxRate);
  const prepaidNational = won(input.grossIncome * itr.business.rate);
  const prepaidLocal = won(prepaidNational * itr.business.localRatio);
  const refundNational = prepaidNational - computedTax;
  const refundLocal = prepaidLocal - localTax;
  return {
    taxableBase: won(taxableBase),
    computedTax,
    localTax,
    totalTax: computedTax + localTax,
    prepaidNational,
    prepaidLocal,
    prepaid: prepaidNational + prepaidLocal,
    refundNational,
    refundLocal,
    refund: refundNational + refundLocal,
  };
}
