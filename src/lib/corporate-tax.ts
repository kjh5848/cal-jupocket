/**
 * 법인세 — 법인세법 제55조(10·20·22·25%, 2026. 1. 1. 이후 개시 사업연도), 제60조(3개월·성실신고 4개월), 제63조·제63조의2(중간예납),
 * 제64조(1천만원 초과 분납). rates: corporate-tax-2026.json
 */
import r from "../rates/corporate-tax-2026.json";

const fl = (v: number) => Math.floor(v + 1e-6);

/** 산출세액 — rental 은 제60조의2 제1항 제1호 법인(부동산임대업 주업 등) */
export function corporateTax(base: number, rental = false): number {
  const b = Math.max(0, base);
  const table = rental ? r.rentalBrackets : r.brackets;
  const row = table.find((x) => x.upTo === null || b <= x.upTo)!;
  return fl(row.base + (b - row.over) * row.rate);
}

/** 한계세율 */
export function corporateMarginal(base: number, rental = false): number {
  const table = rental ? r.rentalBrackets : r.brackets;
  return table.find((x) => x.upTo === null || base <= x.upTo)!.rate;
}

/** 1%p 인상 전 세율로 계산하면 — 개정이유가 '각각 1퍼센트씩 인상'이라 구간 경계는 같고 세율만 1%p 낮다 */
export function corporateTaxBeforeRaise(base: number): number {
  const b = Math.max(0, base);
  let tax = 0;
  let lower = 0;
  for (const row of r.brackets) {
    const upper = row.upTo ?? Infinity;
    if (b > lower) tax += (Math.min(b, upper) - lower) * (row.rate - r.raise.by);
    lower = upper;
  }
  return fl(tax);
}

/** 사업연도 종료일 → 신고·납부기한(그 달 말일부터 3개월·성실신고 4개월이 되는 달의 말일) */
export function corporateDeadline(endYear: number, endMonth: number, diligent = false): Date {
  const m = diligent ? r.filing.monthsDiligent : r.filing.months;
  return new Date(Date.UTC(endYear, endMonth - 1 + m + 1, 0));
}

/** 직전 기준 중간예납 — (직전 산출세액 − 감면 − 원천징수 − 수시부과) × 6 ÷ 직전 월수 */
export function prepayByPrior(priorTax: number, deductions = 0, priorMonths = 12): number {
  return fl(((priorTax - deductions) * 6) / priorMonths);
}

/** 중간예납 기한 — 사업연도 개시일부터 6개월이 지난 날부터 2개월(12월 결산이면 8월 31일) */
export function prepayDeadline(startYear: number, startMonth: number): Date {
  return new Date(Date.UTC(startYear, startMonth - 1 + 6 + r.prepay.months, 0));
}
