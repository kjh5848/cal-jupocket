/**
 * 일본 消費税 — 税抜 ↔ 税込 환산. 일본어판 /ja/consumption-tax/ 가 쓴다.
 *
 * 원문(2026-10-20 확인):
 * - 国税庁 No.6303 [令和8年4月1日現在法令等] — 標準税率 10%(消費税 7.8% + 地方消費税 2.2%),
 *   軽減税率 8%(6.24% + 1.76%).
 * - 消費税法施行令 第70条の10 — 税抜価額 × 100分の10(軽減 100分の8) 또는 税込価額 × 110分の10(軽減 108分の8),
 *   1円未満の端数は処理する(방법은 조문에 없음 → 사용자가 고른다).
 *
 * 부동소수 곱셈(× 1.1)을 쓰지 않고 정수 유리수로 나눈다 — 10/110 = 1/11, 8/108 = 2/27.
 * 税込 → 税抜 은 세액을 먼저 끝수 처리하고 税抜 = 税込 − 세액(넣은 税込 금액이 그대로 남는다).
 */
import rates from "../../rates/jp/consumption-tax-2026.json";

export type TaxRate = 10 | 8;
export type Rounding = "floor" | "round" | "ceil";

/** rates 의 세율(%) — 10 과 8 */
export const STANDARD: TaxRate = Math.round(rates.standardRate * 100) as TaxRate;
export const REDUCED: TaxRate = Math.round(rates.reducedRate * 100) as TaxRate;

/** num/den(둘 다 0 이상 정수)을 1円 단위로 끝수 처리 */
function divide(num: number, den: number, rounding: Rounding): number {
  const q = Math.floor(num / den);
  const r = num - q * den;
  if (r === 0 || rounding === "floor") return q;
  if (rounding === "ceil") return q + 1;
  return 2 * r >= den ? q + 1 : q;
}

export interface TaxSplit {
  /** 税抜価格 */
  exclusive: number;
  /** 消費税額等(国+地方) */
  tax: number;
  /** 税込価格 */
  inclusive: number;
}

/** 税抜価格(円, 0 이상 정수) → 消費税額·税込価格 */
export function fromExclusive(exclusive: number, rate: TaxRate, rounding: Rounding = "floor"): TaxSplit {
  const tax = divide(exclusive * rate, 100, rounding);
  return { exclusive, tax, inclusive: exclusive + tax };
}

/** 税込価格(円, 0 이상 정수) → 消費税額·税抜価格 */
export function fromInclusive(inclusive: number, rate: TaxRate, rounding: Rounding = "floor"): TaxSplit {
  const tax = divide(inclusive * rate, 100 + rate, rounding);
  return { exclusive: inclusive - tax, tax, inclusive };
}
