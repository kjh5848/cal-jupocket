// 부동소수점 연산 오차(예: 0.033 * 100 === 3.3000000000000003)가 화면에
// 그대로 노출되지 않도록 소수 첫째 자리에서 반올림한다.
export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * 원천징수 합산 세율(예: 사업소득 3.3%)을 소득세분/지방소득세분으로
 * 분해한다. 지방소득세는 소득세액의 localTaxRate만큼 붙는 구조이므로
 * combinedRate = incomeTaxRate * (1 + localTaxRate) 관계를 역산한다.
 */
export function splitWithholdingRate(
  combinedRate: number,
  localTaxRate: number,
): { incomeTaxPercent: number; localSurchargePercent: number } {
  const combinedPercent = round1(combinedRate * 100);
  const incomeTaxPercent = round1(combinedPercent / (1 + localTaxRate));
  const localSurchargePercent = round1(combinedPercent - incomeTaxPercent);
  return { incomeTaxPercent, localSurchargePercent };
}
