/**
 * 미국 연방 FICA(Social Security·Medicare·Additional Medicare) 근로자 원천징수 — 미국판 /en-us/fica-tax/ 가 쓴다.
 * 한국어판 4대보험(/guide/four-insurance-calculator/)과 제도가 달라 짝(hreflang)이 아니다.
 *
 * 원문(2026-10-21 확인, 과세연도 2026) — rates/us/payroll-fica-2026.json:
 * - IRS Topic 751: Social Security 6.2% 근로자·6.2% 사업주, Medicare 1.45%·1.45%, 2026 wage base $184,500,
 *   Additional Medicare 0.9% 를 한 해 $200,000 넘는 임금에 사업주가 원천징수(신고 유형 무관).
 * - Pub 15 (2026): 임금(팁 포함)이 $184,500 에 닿으면 근로자 Social Security 징수를 멈추고, Medicare 는 상한 없음.
 * - Additional Medicare Q&A: 사업주 매칭 없음, 실제 세액 기준 금액은 신고 유형별(MFJ $250,000 · MFS $125,000 · 그 밖 $200,000).
 *
 * 금액은 센트 정수로 계산하고 항목마다 센트 반올림한다.
 */
import rates from "../../rates/us/payroll-fica-2026.json";

export const SS_RATE = rates.socialSecurity.employee;
export const SS_EMPLOYER_RATE = rates.socialSecurity.employer;
export const SS_WAGE_BASE = rates.socialSecurity.wageBase;
export const MEDICARE_RATE = rates.medicare.employee;
export const MEDICARE_EMPLOYER_RATE = rates.medicare.employer;
export const ADDL_RATE = rates.additionalMedicare.rate;
export const ADDL_WITHHOLD_OVER = rates.additionalMedicare.withholdOver;

export type FilingStatus = keyof typeof rates.additionalMedicare.thresholds;
export const ADDL_THRESHOLDS: Record<FilingStatus, number> = rates.additionalMedicare.thresholds;
export const SOURCES = rates.sources;

/** 센트 단위 반올림 */
const cents = (x: number) => Math.round(x * 100) / 100;

/** '$1,234.56' · '1234.5' → 1234.56. 음수·빈 칸은 0 */
export function parseUsd(raw: string): number {
  const s = String(raw).replace(/[^0-9.]/g, "");
  const first = s.indexOf(".");
  const clean = first < 0 ? s : s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, "");
  const v = parseFloat(clean);
  return Number.isFinite(v) && v > 0 ? cents(v) : 0;
}

export interface Withholding {
  /** 이번 지급분 중 Social Security 과세 임금(상한까지) */
  ssWages: number;
  ss: number;
  medicare: number;
  /** 이번 지급분 중 $200,000 을 넘는 부분 */
  addlWages: number;
  addl: number;
  /** 근로자 FICA 합계 */
  total: number;
  employerSs: number;
  employerMedicare: number;
  employerTotal: number;
  /** 이번 지급 뒤 같은 사업주에게서 받은 올해 임금 합계 */
  ytdAfter: number;
  /** 이번 지급으로(또는 그 전에) 상한에 닿았는지 */
  capReached: boolean;
}

/**
 * 같은 사업주가 올해 이미 준 임금(ytd)을 알고, 이번에 wages 를 줄 때의 원천징수.
 * 1년치를 한 번에 보려면 ytd = 0, wages = 연봉.
 */
export function withholding(wages: number, ytd = 0): Withholding {
  const w = Math.max(0, wages || 0);
  const before = Math.max(0, ytd || 0);
  const after = before + w;
  const ssWages = cents(Math.max(0, Math.min(after, SS_WAGE_BASE) - Math.min(before, SS_WAGE_BASE)));
  const addlWages = cents(Math.max(0, after - ADDL_WITHHOLD_OVER) - Math.max(0, before - ADDL_WITHHOLD_OVER));
  const ss = cents(ssWages * SS_RATE);
  const medicare = cents(w * MEDICARE_RATE);
  const addl = cents(addlWages * ADDL_RATE);
  const employerSs = cents(ssWages * SS_EMPLOYER_RATE);
  const employerMedicare = cents(w * MEDICARE_EMPLOYER_RATE);
  return {
    ssWages,
    ss,
    medicare,
    addlWages,
    addl,
    total: cents(ss + medicare + addl),
    employerSs,
    employerMedicare,
    employerTotal: cents(employerSs + employerMedicare),
    ytdAfter: cents(after),
    capReached: after >= SS_WAGE_BASE,
  };
}

/** 한 해 근로자 Social Security 세금의 최대액 = 상한 × 6.2% */
export const MAX_SS_TAX = cents(SS_WAGE_BASE * SS_RATE);

/**
 * 신고 때 Additional Medicare 세액(Form 8959 의 기준 금액 방식) — 한 해 Medicare 임금 합계(모든 사업주, 부부 합산이면 합산)에서
 * 신고 유형 기준 금액을 넘는 부분 × 0.9%. 원천징수된 금액과 다를 수 있다.
 */
export function additionalMedicareLiability(medicareWages: number, status: FilingStatus): number {
  return cents(Math.max(0, (medicareWages || 0) - ADDL_THRESHOLDS[status]) * ADDL_RATE);
}

/** '$1,234.56' (센트까지) */
export function usd(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** '$184,500' (센트가 0이면 생략) */
export function usd0(v: number): string {
  const whole = Number.isInteger(v);
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** 0.062 → '6.2%' */
export function pct(r: number): string {
  return `${Math.round(r * 10000) / 100}%`;
}
