/**
 * 건강보험 피부양자 소득·재산 요건 — 국민건강보험법 시행규칙 별표 1의2(2025. 4. 23. 개정). rates: health-dependent-2026.json
 */
import r from "../rates/health-dependent-2026.json";

const I = r.income;
const P = r.property;

export interface DependentInput {
  /** 연 소득 합계 — 근로는 총급여, 연금은 총연금액(공적연금 전액), 사업·기타는 소득금액, 이자·배당은 합계 1천만원 이하면 빼고(시행규칙 제44조 제1항), 비과세 제외 */
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
