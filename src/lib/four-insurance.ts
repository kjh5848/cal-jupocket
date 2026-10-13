/**
 * 4대보험 근로자·사업주 부담 어림 — 국민연금법 제88조·부칙 <법률 제20903호> 제4조, 국민건강보험법 제73조·제76조·시행령 제44조,
 * 노인장기요양보험법 제9조·시행령 제4조, 보험료징수법 제13조·시행령 제12조.
 *
 * 월 보수(비과세 근로소득을 뺀 금액) 하나로 계산한다. 국민연금은 기준소득월액 상·하한과 천원·10원 절사를 넣었고,
 * 건강·장기요양·고용은 원 미만만 버린다 — 공단 고지액과 몇십 원 차이가 날 수 있어 '어림'이다.
 * 건강보험료 상·하한(고시)과 산재보험료(업종별 고시)는 넣지 않았다.
 */
import r from "../rates/four-insurance-2026.json";
import { standardIncome } from "./pension-premium";

const H = r.health;
const C = r.longTermCare;
const E = r.employment;
/** 원 미만 버림 — 0.018 × 0.5 같은 곱이 26,999.999… 로 떨어지는 부동소수점 오차를 막는다 */
const fl = (v: number) => Math.floor(v + 1e-6);

/** 그 해 국민연금 요율(본인·사용자 각각) — 부칙 제4조 표 */
export function pensionRate(year = r.year): number {
  const row = r.pension.byYear.find((x) => x.year === year) ?? r.pension.byYear[r.pension.byYear.length - 1];
  return row.each;
}

/** 건강보험료율 대비 장기요양보험료율의 비율 — 2026-11-27부터 소수점 다섯째자리에서 반올림(법률 제21690호) */
export function careRatio(onDate = `${r.year}-10-13`): number {
  const raw = C.rate / H.rate;
  return onDate >= C.roundingFrom ? Math.round(raw * 10000) / 10000 : raw;
}

export interface PayrollOptions {
  /** 기준 연도(국민연금 요율) */
  year?: number;
  /** 적용일(장기요양 비율 반올림 여부) — "YYYY-MM-DD" */
  onDate?: string;
  /** 고용안정·직업능력개발 보험료율 구간(0: 150명 미만 … 3: 1천명 이상) */
  stabilityTier?: 0 | 1 | 2 | 3;
  /** 65세 이후 새로 고용 — 실업급여 보험료 없음 */
  over65New?: boolean;
}

/** 월 보수 → 근로자 공제액과 사업주 부담액(산재 제외) */
export function payroll(pay: number, o: PayrollOptions = {}) {
  const p = Math.max(0, fl(pay));
  if (p === 0) return { pay: 0, pensionBase: 0, pension: 0, health: 0, care: 0, employment: 0, total: 0, employer: { pension: 0, health: 0, care: 0, employment: 0, total: 0 } };
  const pensionBase = standardIncome(p);
  const pension = fl((pensionBase * pensionRate(o.year)) / 10) * 10;
  const health = fl(p * H.rate * H.employeeShare);
  const care = fl(health * careRatio(o.onDate));
  const unemp = o.over65New ? 0 : E.unemployment * E.workerShare;
  const employment = fl(p * unemp);
  const stab = E.stability[o.stabilityTier ?? 0].rate;
  const employer = {
    pension,
    health,
    care,
    employment: fl(p * (unemp + stab)),
    total: 0,
  };
  employer.total = employer.pension + employer.health + employer.care + employer.employment;
  return { pay: p, pensionBase, pension, health, care, employment, total: pension + health + care + employment, employer };
}

/** 지역가입자 건강보험료 = 소득월액 × 보험료율 + 재산보험료부과점수 × 점수당 금액(제69조 제5항) */
export function regionalHealth(monthlyIncome: number, propertyPoints = 0) {
  const income = fl(Math.max(0, monthlyIncome) * H.rate);
  const property = fl(Math.max(0, propertyPoints) * H.regionalPointValue);
  const health = income + property;
  const care = fl(health * careRatio());
  return { income, property, health, care, total: health + care };
}

/** 4대보험 근로자 요율 합계(국민연금 + 건강 + 장기요양 + 고용) — 상·하한 없이 단순 합 */
export function workerRateSum(year = r.year, onDate?: string): number {
  const h = H.rate * H.employeeShare;
  return pensionRate(year) + h + h * careRatio(onDate) + E.unemployment * E.workerShare;
}
