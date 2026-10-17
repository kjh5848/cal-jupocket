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

/** 차령을 세는 과세연도 — rates 연도에 묶는다(오늘 날짜로 잡으면 해가 바뀔 때 rates 와 어긋난다). */
export const TAX_YEAR = V.ageDiscount.ageCount.taxYear;

export type StartHalf = "first" | "second";

/**
 * 제1기분·제2기분 차령 — 지방세법 시행령 제122조 제2항.
 *
 * 기산일(자동차관리법 시행령 제3조: 제작연도에 등록했으면 최초 신규등록일,
 * 아니면 제작연도 말일)이 상반기면 두 기분 차령이 같고, 하반기면 제1기분이
 * 한 해 적다. 그래서 하반기에 등록한 차는 6월분과 12월분 감면율이 다르다.
 * 과세연도보다 뒤의 기산 연도는 0 으로 묶는다.
 */
export function carAge(startYear: number, half: StartHalf, taxYear: number = TAX_YEAR): { first: number; second: number } {
  const d = taxYear - Math.floor(startYear);
  const second = Math.max(d + 1, 0);
  const first = Math.max(half === "first" ? d + 1 : d, 0);
  return { first, second };
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
  /** 제1기분·제2기분 차령 감면율 — 하반기 기산 차는 다르다 */
  halfRates: [number, number];
  /** 제1기분(6월)·제2기분(12월) 자동차세 + 지방교육세. 합은 total */
  halves: [number, number];
}

/** 감면율을 정수 백분율로 — 5% 단위라 부동소수점 버림 오차를 피한다 */
const pct = (rate: number) => Math.round(rate * 100);

export function bill(opts: {
  cc: number;
  ageYears?: number;
  /** 기분별 차령(시행령 제122조 ②). 주면 ageYears 보다 우선 */
  ages?: { first: number; second: number };
  use?: Use;
}): VehicleBill {
  const { cc, ageYears = 0, use = "nonBusiness" } = opts;
  const ages = opts.ages ?? { first: ageYears, second: ageYears };
  const baseYearly = yearlyBase(cc, use);
  // 차령 감면은 비영업용 승용자동차에만 있다(제127조 ① 2호).
  const r1 = use === "nonBusiness" ? ageDiscountRate(ages.first) : 0;
  const r2 = use === "nonBusiness" ? ageDiscountRate(ages.second) : 0;
  // 각 기분세액 = A/2 × (1 − 감면율). 합을 한 번에 버린다(두 기분 감면율이 같으면 A × (1 − 감면율) 과 같다).
  const vehicleTax = Math.floor((baseYearly * (100 - pct(r1)) + baseYearly * (100 - pct(r2))) / 200);
  const educationTax = Math.floor(vehicleTax * V.localEducationTax.rate);
  const total = vehicleTax + educationTax;
  const firstTax = Math.floor((baseYearly * (100 - pct(r1))) / 200);
  const firstTotal = firstTax + Math.floor(firstTax * V.localEducationTax.rate);
  return {
    baseYearly,
    discountRate: (r1 + r2) / 2,
    vehicleTax,
    educationTax,
    total,
    perHalf: Math.floor(total / 2),
    lumpSum: vehicleTax <= V.lumpSumUnder.amount,
    halfRates: [r1, r2],
    halves: [firstTotal, total - firstTotal],
  };
}

export const PERIODS = V.periods;
export const AGE = V.ageDiscount;
export const EDU_RATE = V.localEducationTax.rate;
export const LUMP_SUM_UNDER = V.lumpSumUnder.amount;
export const PREPAY_CAP = V.prepayDiscount.capRate;

/**
 * 자동차세 연납 공제 — 지방세법 제128조 제3항(계산식 표), 시행령 제125조 제6항(이자율 5%).
 *
 * "연납 할인 5%" 라고 흔히 말하지만 계산식에 남은 일수 비율이 곱해진다. 1월(31일 기한)에
 * 내도 2월 1일~12월 31일 일수만큼만 쳐서 실제 공제율은 5%보다 작다.
 *
 * jan·mar: 연세액 × 남은 일수/연 일수 × 5%
 * jun:     제2기분 세액 × 5%
 * sep:     제2기분 세액 × 남은 일수/184 × 5%
 * 원 미만은 버린다(지방세 끝수 처리 규정은 따로 확인하지 않았다).
 */
export type PrepayWindow = "jan" | "mar" | "jun" | "sep";
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** 납부기한 다음 날부터 12월 31일까지의 일수 */
export function daysAfter(year: number, month: number, day: number): number {
  const end = Date.UTC(year, 11, 31);
  const next = Date.UTC(year, month - 1, day) + 86_400_000;
  return Math.round((end - next) / 86_400_000) + 1;
}

export function prepayDiscount(annualTax: number, window: PrepayWindow, year: number): number {
  const rate = V.prepayDiscount.interestRate;
  const w = V.prepayDiscount.windows.find((x) => x.key === window)!;
  const rest = daysAfter(year, w.deadlineMonth, w.deadlineDay);
  const half = annualTax / 2; // 제2기분 세액
  let d: number;
  if (window === "jan" || window === "mar") d = annualTax * (rest / (isLeap(year) ? 366 : 365)) * rate;
  else if (window === "jun") d = half * rate;
  else d = half * (rest / 184) * rate;
  return Math.floor(Math.min(d, annualTax * V.prepayDiscount.capRate));
}

/** 실제 공제율(연세액 대비) — 표시용 */
export const effectivePrepayRate = (window: PrepayWindow, year: number) =>
  prepayDiscount(1_000_000_000, window, year) / 1_000_000_000;

export const PREPAY_INTEREST = V.prepayDiscount.interestRate;
