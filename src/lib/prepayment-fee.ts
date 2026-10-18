/**
 * 중도상환수수료 — /guide/prepayment-fee-calculator/.
 *
 * 법은 '대출계약이 성립한 날부터 3년' 안에 갚을 때만 받게 한다(금융소비자보호법 제20조 ① 4호 나목 1)).
 * 얼마를 받는지는 약정이 정한다 — 은행 상품 안내의 '원금 × 수수료율 × 잔존일수 ÷ 대출기간(최장 3년)' 꼴을 쓴다.
 * 날짜를 세는 방식은 그 문구에 대한 해석이다(rates: prepayment-fee-2026.json window·dayCount).
 *
 * 정한 규칙(테스트로 고정):
 * - 부과기간 끝날 = 실행일 + 3년(그 달에 같은 날이 없으면 말일 — 민법 제160조 ③). 만기가 더 이르면 만기.
 * - 부과기간 날수 = 끝날 − 실행일, 남은 날 = 끝날 − 상환일. 끝날이나 그 뒤에 갚으면 0원.
 * - 요율은 1/10000 % 정수로 바꿔 BigInt 로 한 번에 나누고 원 미만 버림(0.54 × 10000 같은 오차를 피한다).
 */
import rates from "../rates/prepayment-fee-2026.json";
import { addMonths } from "./date-calc";

export const LEGAL_YEARS = rates.legalYears;

export interface PrepaymentInput {
  /** 이번에 갚는 원금(원) */
  amount: number;
  /** 약정 중도상환수수료율(%), 예: 1.2 */
  ratePct: number;
  /** 대출 실행일(계약 성립일) — 일련번호(date-calc toDay) */
  start: number;
  /** 대출 만기일 — 모르면 null(3년만 본다) */
  maturity: number | null;
  /** 갚는 날 */
  payDate: number;
}

export type PrepaymentError = "pay-before-start" | "maturity-before-start" | "pay-after-maturity";

export interface PrepaymentResult {
  error: PrepaymentError | null;
  fee: number;
  /** 갚는 원금 + 수수료 */
  total: number;
  /** 법이 정한 3년 끝날(실행일 + 3년) */
  legalEnd: number;
  /** 부과기간 끝날 — 3년 끝날과 만기 중 이른 날. 이날부터 0원 */
  windowEnd: number;
  /** 만기가 3년보다 일러 만기에서 끝나는가 */
  endsAtMaturity: boolean;
  windowDays: number;
  daysLeft: number;
  /** 갚는 원금 대비 수수료(소수, 0.00702 = 0.702%) */
  ratio: number;
  /** 30일 뒤에 갚으면 줄어드는 수수료 */
  saving30: number;
}

/** 수수료율(%)을 1/10000 % 정수로 */
const micro = (pct: number) => Math.round(pct * 10_000);

/** 원금 × 요율 × 남은 날 ÷ 부과기간 날수, 원 미만 버림 */
export function proratedFee(amount: number, ratePct: number, daysLeft: number, windowDays: number): number {
  if (amount <= 0 || ratePct <= 0 || daysLeft <= 0 || windowDays <= 0) return 0;
  const left = Math.min(daysLeft, windowDays);
  return Number((BigInt(Math.floor(amount)) * BigInt(micro(ratePct)) * BigInt(left)) / (BigInt(windowDays) * 1_000_000n));
}

export function prepaymentFee(input: PrepaymentInput): PrepaymentResult {
  const { amount, ratePct, start, maturity, payDate } = input;
  const legalEnd = addMonths(start, LEGAL_YEARS * 12);
  const endsAtMaturity = maturity !== null && maturity > start && maturity < legalEnd;
  const windowEnd = endsAtMaturity ? maturity! : legalEnd;
  const windowDays = windowEnd - start;
  let error: PrepaymentError | null = null;
  if (maturity !== null && maturity <= start) error = "maturity-before-start";
  else if (payDate < start) error = "pay-before-start";
  else if (maturity !== null && payDate > maturity) error = "pay-after-maturity";

  const daysLeft = error ? 0 : Math.max(0, windowEnd - payDate);
  const fee = error ? 0 : proratedFee(amount, ratePct, daysLeft, windowDays);
  const later = error ? 0 : proratedFee(amount, ratePct, Math.max(0, daysLeft - 30), windowDays);
  return {
    error,
    fee,
    total: Math.max(0, Math.floor(amount)) + fee,
    legalEnd,
    windowEnd,
    endsAtMaturity,
    windowDays,
    daysLeft,
    ratio: amount > 0 ? fee / amount : 0,
    saving30: fee - later,
  };
}
