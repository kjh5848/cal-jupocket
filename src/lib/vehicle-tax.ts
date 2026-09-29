/**
 * 자동차세 — 배기량과 차령으로 정해진다.
 *
 * 사람들이 실제로 묻는 것은 두 가지다. "우리 차 얼마 나오나"와 "몇 년
 * 지나면 깎이나". 둘 다 조문에 계산식이 있다.
 *
 *   연세액   배기량(cc) × cc당 세액          제127조 ① 1호
 *   차령감면 각 기분세액 = A/2 − (A/2 × 5%)(n − 2)   제127조 ① 2호
 *   교육세   자동차세액의 30%                 제151조 ① 7호
 *
 * **차령 감면은 3년차부터 시작해 12년에서 멈춘다.** 조문이 n 을 2 이상
 * 12 이하로 묶고, 12년을 넘으면 12년으로 본다고 못박았다. 그래서 감면은
 * 최대 50% 다 — "오래 타면 계속 깎인다" 가 아니다.
 *
 * 지방교육세 비율이 재산세(20%)와 다른 30% 라는 점도 자주 어긋난다.
 *
 * 숫자는 `src/rates/local-tax-2026.json` 에서만 온다. 세액표는 조문이
 * 이미지로 싣는 것을 대체 텍스트에서 읽어, DOM 순서로 조문을 대조한
 * 뒤에 옮겼다(2026-09-29).
 */
import rates from "../rates/local-tax-2026.json";

const V = rates.vehicleTax;

export type Use = "nonBusiness" | "business";

/** cc 당 세액 — 구간을 넘으면 그 구간의 단가가 전체에 붙는다(누진 아님). */
export function perCc(cc: number, use: Use = "nonBusiness"): number {
  const table = V.passengerPerCc[use];
  const row = table.find((r) => r.upTo === null || cc <= r.upTo);
  return row ? row.won : table[table.length - 1].won;
}

/**
 * 차령 감면 전 연세액.
 *
 * 누진이 아니다. 1,600cc 를 1cc 넘으면 전체에 200원이 붙는다 —
 * 1,599cc 와 1,601cc 의 차이가 큰 이유다.
 */
export function yearlyBase(cc: number, use: Use = "nonBusiness"): number {
  if (cc <= 0) return 0;
  return Math.floor(cc * perCc(cc, use));
}

/**
 * 차령에 따른 감면율. 비영업용 승용차만.
 *
 * n=2 까지는 0, n=3 이면 5%, … n=12 이상이면 50% 에서 멈춘다.
 */
export function ageDiscountRate(ageYears: number): number {
  const n = Math.min(Math.max(Math.floor(ageYears), 0), V.ageDiscount.maxYear);
  if (n < V.ageDiscount.startYear) return 0;
  return (n - 2) * V.ageDiscount.ratePerYear;
}

export interface VehicleBill {
  /** 감면 전 연세액 */
  baseYearly: number;
  /** 차령 감면율 */
  discountRate: number;
  /** 감면 후 자동차세 (연) */
  vehicleTax: number;
  /** 지방교육세 — 자동차세의 30% */
  educationTax: number;
  /** 합계 (연) */
  total: number;
  /** 한 기분 — 절반. 다만 연세액 10만원 이하면 6월에 한 번에 온다 */
  perHalf: number;
  /** 연세액이 10만원 이하라 1기분에 전액 부과될 수 있는가 */
  lumpSum: boolean;
}

export function bill(opts: {
  cc: number;
  ageYears?: number;
  use?: Use;
}): VehicleBill {
  const { cc, ageYears = 0, use = "nonBusiness" } = opts;
  const baseYearly = yearlyBase(cc, use);
  // 차령 감면은 비영업용 승용자동차에만 있다(제127조 ① 2호).
  const discountRate = use === "nonBusiness" ? ageDiscountRate(ageYears) : 0;
  const vehicleTax = Math.floor(baseYearly * (1 - discountRate));
  const educationTax = Math.floor(vehicleTax * V.localEducationTax.rate);
  const total = vehicleTax + educationTax;
  return {
    baseYearly,
    discountRate,
    vehicleTax,
    educationTax,
    total,
    perHalf: Math.floor(total / 2),
    lumpSum: vehicleTax <= V.lumpSumUnder.amount,
  };
}

export const PERIODS = V.periods;
export const AGE = V.ageDiscount;
export const EDU_RATE = V.localEducationTax.rate;
export const LUMP_SUM_UNDER = V.lumpSumUnder.amount;
export const PREPAY_CAP = V.prepayDiscount.capRate;
