/**
 * 국세환급가산금 — 국세기본법 제52조, 시행령 제43조의3 제1항 제4호(신고일 또는 법정신고기일부터 30일이 지난 날의 다음 날),
 * 시행규칙 제19조의3(연 1천분의 31). rates: refund-2026.json, tax-refund-2026.json
 */
import rf from "../rates/refund-2026.json";
import r from "../rates/tax-refund-2026.json";

/** 종합소득세 환급가산금 기산일 — 5월 31일(법정신고기일)부터 30일이 지난 날의 다음 날 */
export function incomeTaxRefundInterestStart(year: number, dueMonth = r.incomeTax.dueMonth, dueDay = r.incomeTax.dueDay): Date {
  const due = Date.UTC(year, dueMonth - 1, dueDay);
  return new Date(due + (r.payment.days + 1) * 86_400_000);
}

/** 환급가산금 — 환급금 × 연 3.1% × 일수 ÷ 365 */
export function refundInterest(amount: number, days: number): number {
  return Math.floor((amount * rf.refundInterest.annualRate * Math.max(0, days)) / 365 + 1e-6);
}
