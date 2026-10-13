/**
 * 성실신고확인 — 소득세법 시행령 제133조(업종별 수입금액 기준), 소득세법 제81조의2(미제출 가산세),
 * 조세특례제한법 제126조의6(확인비용 60% 세액공제). rates: diligent-filer-2026.json
 */
import r from "../rates/diligent-filer-2026.json";

/** 원 미만 버림 — 부동소수점 오차 보정 */
const fl = (v: number) => Math.floor(v + 1e-6);

/** 업종 구분(0: 15억원, 1: 7억5천만원, 2: 5억원)의 수입금액 기준 이상이면 성실신고확인대상 */
export function isDiligentTarget(revenue: number, group: 0 | 1 | 2): boolean {
  return revenue >= r.threshold.groups[group].amount;
}

/** 미제출 가산세 = max(산출세액 × 사업소득금액/종합소득금액 × 5%, 수입금액 × 0.02%) — 비율은 0~1로 자른다 */
export function diligentPenalty(o: { computedTax: number; businessIncome: number; totalIncome: number; revenue: number }): number {
  const ratio = o.totalIncome > 0 ? Math.min(1, Math.max(0, o.businessIncome / o.totalIncome)) : 0;
  const byTax = fl(Math.max(0, o.computedTax) * ratio * r.penalty.rate);
  const byRevenue = fl(Math.max(0, o.revenue) * r.penalty.revenueRate);
  return Math.max(byTax, byRevenue);
}

/** 확인비용 세액공제 = 비용 × 60%, 한도 120만원 */
export function diligentCostCredit(cost: number): number {
  return Math.min(fl(Math.max(0, cost) * r.costCredit.rate), r.costCredit.cap);
}
