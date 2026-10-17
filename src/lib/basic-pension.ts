/**
 * 기초연금 — 기초연금법 제3조(선정기준액), 제5조~제8조(기준연금액·국민연금 연계·부부 20%·소득역전 감액),
 * 시행령 제10조·제11조, 시행규칙 제4조(재산 소득환산율 연 4%), 보건복지부고시 제2026-156호(2026 금액). rates: basic-pension-2026.json
 *
 * 국민연금 연계 감액은 A급여 기반 소득재분배급여금액이 있어야 정확하다 — 여기서는 국민연금 급여액 기준의 경계(150%·200%)와
 * 바닥(기준연금액의 2분의 1)만 낸다.
 */
import r from "../rates/basic-pension-2026.json";

const P = r.property;
const I = r.income;
const A = r.amount;
const fl = (v: number) => Math.floor(v + 1e-6);
const pos = (v: number) => Math.max(0, v);

export type Region = "metro" | "city" | "rural";

type PropertyInput = { general: number; financial: number; debt?: number; region: Region; luxury?: number };

/** 재산 소득환산의 단계 — 기본재산액 뺀 일반재산 · 2천만원 뺀 금융재산 · 실제로 뺀 부채(남은 재산까지만) · 환산 대상 재산 */
export function propertySteps(o: PropertyInput) {
  const general = pos(o.general - P.basic[o.region]);
  const financial = pos(o.financial - P.financialDeduction);
  const debtUsed = Math.min(pos(o.debt ?? 0), general + financial);
  const net = general + financial - debtUsed;
  return { basic: P.basic[o.region], general, financial, debtUsed, net };
}

/** 재산의 월 소득환산액 */
export function propertyIncome(o: PropertyInput): number {
  return fl((propertySteps(o).net * P.conversionRate) / 12) + (o.luxury ?? 0);
}

/** 근로소득 월 평가액 — 116만원 공제 후 30% 추가 공제 */
export function workIncome(monthly: number): number {
  return fl(pos(monthly - I.workDeduction) * (1 - I.workExtraRate));
}

/** 이자소득 월 평가액 — 월 4만원 공제 */
export function interestIncome(monthly: number): number {
  return pos(monthly - I.interestDeduction);
}

/**
 * 소득인정액과 선정기준액으로 받는 금액(국민연금 연계 감액 전 기준연금액 기준).
 * baseTotal(기준연금액 × 받는 사람 수) − coupleCut(부부 20%, 법 제8조 ①) − reversalCut(선정기준액을 넘지 않게, 제8조 ② · 시행령 제11조) = total.
 * room 은 선정기준액 − 소득인정액(넘으면 음수).
 */
export function basicPension(o: { recognized: number; couple: boolean; bothReceive?: boolean }) {
  const base = r.basePension;
  const limit = o.couple ? r.selection.couple : r.selection.single;
  const both = o.couple && (o.bothReceive ?? true);
  const baseTotal = both ? base * 2 : base;
  const room = limit - o.recognized;
  if (o.recognized > limit) return { eligible: false, limit, room, baseTotal, coupleCut: 0, reversalCut: 0, each: 0, total: 0, reduced: false };
  const each = both ? fl(base * (1 - A.coupleCut)) : base;
  const full = both ? each * 2 : each;
  const coupleCut = baseTotal - full;
  if (o.recognized + full <= limit) return { eligible: true, limit, room, baseTotal, coupleCut, reversalCut: 0, each, total: full, reduced: false };
  // 소득역전 감액(시행령 제11조) — 선정기준액 − 소득인정액, 최소 기준연금액의 10%(부부 20%)
  const minPay = fl(base * (both ? A.reversalMinCouple : A.reversalMin));
  const total = Math.min(full, Math.max(room, minPay));
  return { eligible: true, limit, room, baseTotal, coupleCut, reversalCut: full - total, each: both ? fl(total / 2) : total, total, reduced: true };
}

/** 국민연금 급여액이 기준연금액의 150% 이하면 감액 없음 — 그 경계 금액 */
export const npsFullUpTo = () => fl(r.basePension * A.npsFullUpTo);
/** 국민연금 연계 감액 후에도 받는 최소 금액(부가연금액 = 기준연금액의 2분의 1) */
export const npsFloor = () => fl(r.basePension * A.npsFloorRatio);
