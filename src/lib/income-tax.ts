import rates from "../rates/2026.json";
import { won } from "./money";

export interface RefundInput {
  grossIncome: number;   // 연간 사업소득 총수입
  expenseRate: number;   // 단순경비율 (0~1)
  dependents: number;    // 본인 포함 인적공제 인원
}

export function estimateRefund(input: RefundInput) {
  const income = input.grossIncome * (1 - input.expenseRate);
  const taxableBase = Math.max(
    0,
    income - input.dependents * rates.personalDeductionPerHead
  );
  const bracket = rates.incomeTaxBrackets.find(
    (b) => b.upTo === null || taxableBase <= b.upTo
  )!;
  const computedBefore = taxableBase * bracket.rate - bracket.deduction;
  const computedTax = Math.max(0, won(computedBefore) - rates.standardTaxCredit);
  const prepaid = won(input.grossIncome * rates.withholding.business);
  return {
    taxableBase: won(taxableBase),
    computedTax: won(computedTax),
    prepaid,
    refund: prepaid - won(computedTax),
  };
}
