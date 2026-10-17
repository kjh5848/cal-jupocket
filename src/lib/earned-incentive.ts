/**
 * 근로장려금 어림 — 조세특례제한법 제100조의3·제100조의5·제100조의7·제100조의8, 시행령 제100조의2·제100조의6·제100조의9.
 *
 * 법 제100조의5 제1항의 식으로 계산한다. 실제 금액은 시행령 별표 11 산정표(구간별)로
 * 정하는데 별표는 읽지 않았다. 그래서 '어림' 이다.
 * 신청·결정·환급 일정은 자녀장려금과 같은 조문이라 child-incentive.ts 의 schedule() 을 쓴다.
 */
import r from "../rates/earned-incentive-2026.json";
import { shiftToBusinessDay } from "./tax-deadline";

export type EarnedHousehold = "single" | "oneEarner" | "dual";

/** 법 식 그대로의 금액 — 오르는 구간(가목)·평평한 구간(나목)·줄어드는 구간(다목) */
export function formulaAmount(h: EarnedHousehold, pay: number): { amount: number; band: "rise" | "flat" | "taper" | "none" } {
  const f = r.formula[h];
  if (pay <= 0 || pay >= f.upTo) return { amount: 0, band: "none" };
  if (pay < f.riseUnder) return { amount: (pay * f.max) / f.riseUnder, band: "rise" };
  if (pay < f.flatUnder) return { amount: f.max, band: "flat" };
  return { amount: f.max - ((pay - f.flatUnder) * f.max) / f.taperSpan, band: "taper" };
}

/** 제100조의7 ③ — 1만5천원 미만은 없음, 가목 구간 10만원 미만은 10만원, 다목 구간 3만원 미만은 3만원 */
function applyMinimum(amount: number, band: string): number {
  const m = r.reductions.minimum;
  if (amount < m.none) return 0;
  if (band === "rise" && amount < m.risingFloor) return m.risingFloor;
  if (band === "taper" && amount < m.taperFloor) return m.taperFloor;
  return amount;
}

export interface EarnedIncentiveInput {
  household: EarnedHousehold;
  /** 총급여액 등(배우자 합산) */
  pay: number;
  /** 가구원 재산 합계 */
  assets?: number;
  /** 신청기간이 지난 뒤 6개월 안에 신청 */
  late?: boolean;
}

export function earnedIncentive(i: EarnedIncentiveInput) {
  const assets = i.assets ?? 0;
  // 신청자격(제100조의3 ①): 가구별 총소득기준금액 미만, 재산 2억4천만원 미만.
  // 총소득과 총급여액 등은 시행령상 다른 개념이지만 여기서는 같은 입력으로 어림한다.
  const eligible = i.pay > 0 && i.pay < r.eligibility.totalIncomeUnder[i.household] && assets < r.eligibility.assetsUnder;
  if (!eligible) return { eligible, band: "none" as const, base: 0, amount: 0, assetsCut: 0, lateCut: 0, reduced: 0, minAdj: 0, belowMax: 0 };
  const { amount: raw, band } = formulaAmount(i.household, i.pay);
  const base = Math.floor(raw);
  const afterAssets = assets >= r.reductions.assets.from ? Math.floor(base * r.reductions.assets.rate) : base;
  const reduced = i.late ? Math.floor(afterAssets * r.reductions.late.rate) : afterAssets;
  // 제100조의7 ③ — 최소 금액은 재산(제100조의5 ④)·기한 후 신청(제100조의7 ②)으로 줄인 뒤의 금액에 적용한다
  const amount = applyMinimum(reduced, band);
  return {
    eligible,
    band,
    /** 법 식 금액(원 미만 버림) */
    base,
    amount,
    /** 재산 1억7천만원 이상이라 줄어든 돈 */
    assetsCut: base - afterAssets,
    /** 기한 후 신청이라 줄어든 돈 */
    lateCut: afterAssets - reduced,
    /** 두 감액 뒤 금액 */
    reduced,
    /** 최소 금액 규정으로 달라진 돈 — 1만5천원 미만이면 음수(없음), 10만원·3만원으로 올리면 양수 */
    minAdj: amount - reduced,
    /** 가구 최대 금액보다 적은 돈(소득 구간 때문) */
    belowMax: r.formula[i.household].max - base,
  };
}

/** 최대 금액을 받는 총급여액 등 구간과, 줄어드는 구간에서 1만원 더 벌 때 줄어드는 돈(제100조의5 ① 다목 기울기) */
export function bandInfo(h: EarnedHousehold) {
  const f = r.formula[h];
  return { flatFrom: f.riseUnder, flatUnder: f.flatUnder, max: f.max, taperPer10k: (10_000 * f.max) / f.taperSpan };
}

/**
 * 반기 신청 상반기분 — 제100조의5 ②: 상반기 근로소득 ÷ 근무월수 × (근무월수 + 6)을 그해 총급여액 등으로 보고
 * 계산한 금액의 35%. 재산 감액(④)도 함께 적용한다. 15만원 미만이면 그때 주지 않고 정산 때 준다(제100조의8 ⑤).
 */
export function firstHalf(h: EarnedHousehold, firstHalfPay: number, months: number, assets = 0) {
  const m = Math.min(6, Math.max(1, Math.floor(months)));
  const annualized = Math.floor((firstHalfPay / m) * (m + 6));
  const { amount: raw } = formulaAmount(h, annualized);
  let x = Math.floor(Math.floor(raw) * r.halfYear.firstHalfRate);
  if (assets >= r.reductions.assets.from) x = Math.floor(x * r.reductions.assets.rate);
  const held = x > 0 && x < r.halfYear.holdUnder;
  return { annualized, amount: x, held };
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
const addMonths = (d: Date, months: number) => utc(d.getUTCFullYear(), d.getUTCMonth() + 1 + months, d.getUTCDate());

/** 반기 신청 일정 — 상반기분은 그해 9월 1~15일, 하반기분은 다음 해 3월 1~15일. 기한 뒤 3개월 안에 결정, 15일 안에 환급 */
export function halfYearSchedule(incomeYear: number, holidays: string[] = []) {
  const one = (y: number, m: number) => {
    const deadline = shiftToBusinessDay(utc(y, m, 15), holidays);
    const decideBy = addDays(addMonths(addDays(deadline, 1), 3), -1);
    return { from: utc(y, m, 1), deadline, decideBy };
  };
  return { first: one(incomeYear, 9), second: one(incomeYear + 1, 3), refundDays: r.halfYear.decisionDays };
}
