/**
 * 건강보험 피부양자 소득·재산 요건 — 국민건강보험법 시행규칙 별표 1의2(2025. 4. 23. 개정). rates: health-dependent-2026.json
 */
import r from "../rates/health-dependent-2026.json";

const I = r.income;
const P = r.property;

export interface DependentInput {
  /** 이자·배당·사업·근로·연금·기타소득 합계(연, 비과세 제외, 공적연금 전액) */
  income: number;
  /** 사업소득(연) */
  business?: number;
  /** 사업자등록이 있는가 */
  registered?: boolean;
  /** 재산세 과세표준 합계 */
  propertyBase: number;
  sibling?: boolean;
}

export function checkDependent(o: DependentInput) {
  const business = o.business ?? 0;
  const businessOk = business === 0 || (!o.registered && business <= I.businessAllow);
  const incomeOk = o.income <= I.limit && businessOk;
  const propertyOk = o.sibling
    ? o.propertyBase <= P.siblings
    : o.propertyBase <= P.base || (o.propertyBase <= P.upper && o.income <= P.upperIncome);
  return { incomeOk, businessOk, propertyOk, eligible: incomeOk && propertyOk };
}
