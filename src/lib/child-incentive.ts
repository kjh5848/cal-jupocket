/**
 * 자녀장려금 어림 — 조세특례제한법 제100조의28~제100조의31, 준용하는 제100조의5·제100조의7, 시행령 제100조의31.
 *
 * 법 제100조의29 제1항의 식으로 계산한다. 실제 금액은 시행령 별표 11의2 산정표(구간별)로
 * 정하는데 별표는 읽지 않았다. 그래서 '어림' 이다.
 */
import r from "../rates/child-incentive-2026.json";
import { shiftToBusinessDay } from "./tax-deadline";

export type Household = "single" | "dual";

/** 부양자녀 1명당 금액 — 제100조의29 ① 표 */
export function perChild(household: Household, pay: number): number {
  const f = r.formula[household];
  if (pay < f.flatUnder) return r.formula.perChildMax;
  if (pay >= f.upTo) return 0;
  return r.formula.perChildMax - ((pay - f.flatUnder) * f.taperAmount) / f.taperSpan;
}

export interface ChildIncentiveInput {
  household: Household;
  /** 총급여액 등(가구 합산) */
  pay: number;
  /** 부양자녀 수 */
  children: number;
  /** 가구원 재산 합계 */
  assets?: number;
  /** 연말정산·종합소득세에서 받은 자녀세액공제(배우자 포함) */
  childTaxCredit?: number;
  /** 신청기간이 지난 뒤 6개월 안에 신청 */
  late?: boolean;
}

export function childIncentive(i: ChildIncentiveInput) {
  const assets = i.assets ?? 0;
  const n = Math.max(0, Math.floor(i.children));
  // 신청자격(제100조의28 ①): 총소득 7천만원 미만, 재산 2억4천만원 미만, 부양자녀 있음.
  // 총소득과 총급여액 등은 시행령상 다른 개념이지만 여기서는 같은 입력으로 어림한다.
  const eligible = n > 0 && i.pay < r.eligibility.totalIncomeUnder && assets < r.eligibility.assetsUnder;
  if (!eligible)
    return { eligible, band: "none" as const, base: 0, afterAssets: 0, afterLate: 0, minusCredit: 0, amount: 0, floored: false, assetsCut: 0, lateCut: 0, floorAdj: 0, belowMax: 0 };
  const band = i.pay < r.formula[i.household].flatUnder ? ("flat" as const) : ("taper" as const);
  const base = Math.floor(n * perChild(i.household, i.pay));
  const afterAssets = assets >= r.reductions.assets.from ? Math.floor(base * r.reductions.assets.rate) : base;
  const afterLate = i.late ? Math.floor(afterAssets * r.reductions.late.rate) : afterAssets;
  // 자녀세액공제는 결정할 때 뺀다(시행령 제100조의31 ②). 재산·기한 후 감액 뒤에 뺐다 — 순서는 조문에 문장으로 없다(rates notVerified)
  const minusCredit = Math.min(i.childTaxCredit ?? 0, afterLate);
  const left = afterLate - minusCredit;
  // 제100조의31 ② — '제1항(재산·기한 후 준용) 및 제100조의30제2항(자녀세액공제)에 따라 감액되어' 3만원 미만이면 3만원(영이거나 음수면 제외).
  // 하한은 세 감액을 모두 거친 금액에 적용한다. 제100조의7 ③(근로장려금 최소 금액)은 준용에서 빠진다.
  const floored = left > 0 && left < r.reductions.floor.amount;
  const amount = floored ? r.reductions.floor.amount : left;
  return {
    eligible,
    /** 1명당 100만원 구간(flat) / 줄어드는 구간(taper) */
    band,
    /** 법 식 금액(자녀 수 × 1명당 금액, 원 미만 버림) */
    base,
    afterAssets,
    afterLate,
    /** 자녀세액공제로 줄어든 돈 */
    minusCredit,
    amount,
    floored,
    /** 재산 1억7천만원 이상이라 줄어든 돈 */
    assetsCut: base - afterAssets,
    /** 기한 후 신청이라 줄어든 돈 */
    lateCut: afterAssets - afterLate,
    /** 3만원 하한으로 더한 돈(0 이상) */
    floorAdj: amount - left,
    /** 자녀 수 × 100만원보다 적은 돈(소득 구간 때문) */
    belowMax: n * r.formula.perChildMax - base,
  };
}

/** 1명당 100만원을 받는 총급여액 등 상한과, 줄어드는 구간에서 1만원 더 벌 때 '자녀 1명당' 줄어드는 돈(제100조의29 ① 기울기) */
export function bandInfo(h: Household) {
  const f = r.formula[h];
  return { flatUnder: f.flatUnder, upTo: f.upTo, perChildTaperPer10k: (10_000 * f.taperAmount) / f.taperSpan };
}

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addMonths = (d: Date, months: number) => utc(d.getUTCFullYear(), d.getUTCMonth() + 1 + months, d.getUTCDate());
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/**
 * 그해 소득분 자녀장려금의 일정 — 다음 해 5월 확정신고 기간에 신청한다.
 * 공휴일 달력은 갖고 있지 않아 주말만 미룬다(tax-deadline.ts).
 */
export function schedule(incomeYear: number, holidays: string[] = []) {
  const y = incomeYear + 1;
  const from = utc(y, 5, 1);
  const deadline = shiftToBusinessDay(utc(y, 5, 31), holidays);
  const lateFrom = addDays(deadline, 1);
  // '다음 날부터 6개월 이내' — 6개월 뒤 같은 날의 전날까지
  const lateTo = addDays(addMonths(lateFrom, r.apply.late.months), -1);
  // '기한이 지난 후 3개월 이내' — 기한 다음 날부터 3개월
  const decideBy = addDays(addMonths(lateFrom, r.decision.months), -1);
  return { from, deadline, lateFrom, lateTo, decideBy, refundDays: r.refund.days };
}
