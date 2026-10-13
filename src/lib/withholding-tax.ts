/**
 * 원천세 계산 — 소득세법 제47조 제2항·제59조 제3항·제86조·제129조(일용근로자), 제81조의11(지급명세서 가산세),
 * 국세기본법 제47조의5·시행령 제27조의4(원천징수 납부지연가산세). rates: withholding-tax-2026.json
 */
import r from "../rates/withholding-tax-2026.json";

const fl = (v: number) => Math.floor(v + 1e-6);
const D = r.daily;
const P = r.penalty;

/** 일용근로자 하루 소득세 — (일급 − 15만원) × 6% − 산출세액의 55%. 1천원 미만이면 0(소액부징수) */
export function dailyWorkerTax(dayWage: number) {
  const base = Math.max(0, fl(dayWage) - D.deductionPerDay);
  const computed = fl(base * D.rate);
  const credit = fl(computed * D.creditRate);
  const raw = computed - credit;
  const tax = raw < D.minimum ? 0 : raw;
  const local = fl(tax * 0.1);
  return { base, computed, credit, raw, tax, local, total: tax + local };
}

/** 소득세가 처음 붙는 일급 — 세액 1천원이 되는 지점 */
export function dailyWorkerTaxFreeMax(): number {
  // (일급 − 15만) × 6% × 45% < 1천원 → 일급 < 15만 + 1천 ÷ 0.027
  let w = D.deductionPerDay;
  while (dailyWorkerTax(w + 1_000).tax === 0) w += 1_000;
  while (dailyWorkerTax(w + 100).tax === 0) w += 100;
  return w;
}

/** 원천징수 납부지연가산세 — 3% + 일 0.022%, 둘 합계 한도 10% */
export function withholdingLatePenalty(unpaid: number, days: number) {
  const base = fl(unpaid * P.lateBase);
  const interest = fl(unpaid * P.lateDaily * Math.max(0, days));
  const cap = fl(unpaid * P.lateCap);
  return { base, interest, total: Math.min(base + interest, cap), capped: base + interest > cap };
}

/** 지급명세서·간이지급명세서 미제출 가산세 */
export function statementPenalty(amount: number, kind: "annual" | "daily" | "simplified", late = false) {
  const rate =
    kind === "annual" ? (late ? P.statementNoneWithin3m : P.statementNone)
    : kind === "daily" ? (late ? P.dailyNoneWithin1m : P.dailyNone)
    : late ? P.simplifiedNoneWithin1m : P.simplifiedNone;
  return Math.round(amount * rate);
}
