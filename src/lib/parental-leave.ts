/**
 * 육아휴직 급여·출산전후휴가 급여 — 고용보험법 시행령 제95조(월 통상임금 100%·80%, 상한 250·200·160만원, 하한 70만원),
 * 제95조의3(6+6 특례·한부모), 고용보험법 제76조, 고용노동부고시 제2026-67호(90일 660만원). rates: parental-leave-2026.json
 */
import r from "../rates/parental-leave-2026.json";

const P = r.pay;
const fl = (v: number) => Math.floor(v + 1e-6);

export type Mode = "normal" | "sixSix" | "single";

function band(month: number, mode: Mode) {
  const bands = mode === "single" ? P.single.bands : P.bands;
  return bands.find((b) => month >= b.from && (b.to === null || month <= b.to))!;
}

/** n번째 달(1부터)의 월 지급액. 6+6 특례는 부모가 각각 같은 개월 수를 쓴다고 보고 6개월까지 특례 상한 */
export function monthlyPay(ordinary: number, month: number, mode: Mode = "normal"): number {
  const o = Math.max(0, ordinary);
  if (mode === "sixSix" && month <= 6) {
    return Math.max(P.floor, Math.min(o, P.sixSix.caps[month - 1]));
  }
  const b = band(month, mode === "sixSix" ? "normal" : mode);
  return Math.max(P.floor, Math.min(fl(o * b.rate), b.cap));
}

export function schedule(ordinary: number, months: number, mode: Mode = "normal") {
  const rows = Array.from({ length: Math.max(0, Math.floor(months)) }, (_, i) => ({ month: i + 1, pay: monthlyPay(ordinary, i + 1, mode) }));
  return { rows, total: rows.reduce((a, b) => a + b.pay, 0) };
}

/** 출산전후휴가 — 1일 통상임금(월급 ÷ 209 × 8)과 고용보험 지급액(90일 상한 660만원, 대규모 기업은 마지막 30일분만) */
export function maternityPay(monthlyOrdinary: number, priority: boolean) {
  const M = r.maternity;
  const daily = fl((monthlyOrdinary / 209) * 8);
  const full = daily * M.days;
  const insuredDays = priority ? M.days : M.days - M.paidDays;
  const cap = fl((M.cap90 * insuredDays) / M.days);
  const insurance = Math.min(daily * insuredDays, cap);
  return { daily, full, insuredDays, insurance, employer: Math.max(0, daily * M.paidDays - (priority ? Math.min(daily * M.paidDays, fl((M.cap90 * M.paidDays) / M.days)) : 0)) };
}
