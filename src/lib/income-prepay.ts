/**
 * 종합소득세 중간예납 (순수 함수).
 *
 * 요율·기준금액은 rates/income-prepay-2026.json(소득세법 제65조·제77조·
 * 제86조, 시행령 제123조·제140조 원문 대조)에서만 가져온다.
 *
 * 부가세 예정고지(vat-prepay.ts)와 모양이 같다 — 절반을 곱하고, 1천원
 * 미만을 버리고, 50만원 미만이면 징수하지 않는다. 다른 것은 셋이다.
 *
 * 1. 기준액이 "직전에 낸 세금" 한 줄이 아니라 제65조 제7항의 **합계 − 환급**
 *    이다. 원천징수세액(3.3%)은 그 열거에 없다
 * 2. 갈아타는 선이 3분의 1이 아니라 **100분의 30**이고, 재는 것이 공급가액이
 *    아니라 **세액**(중간예납추계액)이다
 * 3. 1천만원을 넘으면 **분할납부**가 된다(제77조·시행령 제140조)
 *
 * 여기서 가산세와 추계액 자체는 계산하지 않는다. 가산세는 rates 의
 * notVerified 에 적어 둔 대로 원문에서 확인하지 못했고, 추계액은 반기 소득·
 * 공제·기납부세액이 전부 필요해 예시 하나로 뽑으면 오히려 오해를 산다.
 */
import r from "../rates/income-prepay-2026.json";

export const noticeRate = r.notice.rate; // 0.5
export const roundDownUnder = r.notice.roundDownUnder; // 1,000
export const noCollectionUnder = r.noCollectionUnder; // 500,000
export const estimateFraction = r.estimate.fraction; // 0.3
export const installmentOver = r.installment.over; // 10,000,000
export const installmentUpTo = r.installment.upTo20m; // 20,000,000

export interface BaseInput {
  /** 직전 과세기간의 중간예납세액 (작년 11월에 낸 것) */
  previousPrepay?: number;
  /** 제76조 확정신고납부세액 (5월 신고 때 추가로 낸 것) */
  finalReturnPaid?: number;
  /** 제85조 추가납부세액(가산세 포함) */
  additionalPaid?: number;
  /** 국세기본법 제45조의3 기한후신고납부세액·제46조 추가자진납부세액(가산세 포함) */
  lateReturnPaid?: number;
  /** 제85조 환급세액 */
  refund?: number;
}

/**
 * 중간예납기준액 — 제65조 제7항.
 *
 * 네 가지 세액의 합계에서 환급세액을 뺀다. 원천징수세액은 넣지 않는다 —
 * 열거에 없다. 음수가 되면 고지할 금액이 없으므로 0 으로 둔다.
 */
export function prepayBase(i: BaseInput): number {
  const sum =
    (i.previousPrepay ?? 0) +
    (i.finalReturnPaid ?? 0) +
    (i.additionalPaid ?? 0) +
    (i.lateReturnPaid ?? 0);
  return Math.max(0, Math.floor(sum - (i.refund ?? 0)));
}

export interface NoticeResult {
  /** 중간예납기준액 (입력값) */
  base: number;
  /** 2분의 1 — 절사 전 */
  halved: number;
  /** 1천원 미만 단수를 버린 금액 = 중간예납세액 */
  amount: number;
  /** 고지서가 나오는가. 50만원 미만이면 징수하지 않는다(제86조 제4호) */
  collected: boolean;
}

/**
 * 중간예납세액 — 제65조 제1항 + 제86조 제4호.
 *
 * 기준액 × 1/2 → 1천원 미만 절사 → 50만원 미만이면 징수하지 않음.
 */
export function noticeAmount(base: number): NoticeResult {
  const b = Math.max(0, Math.floor(base));
  const halved = b * noticeRate;
  const amount = Math.floor(halved / roundDownUnder) * roundDownUnder;
  return { base: b, halved, amount, collected: amount >= noCollectionUnder };
}

/** 고지서가 나오기 시작하는 중간예납기준액. 50만원 ÷ 1/2 = 100만원. */
export function noticeThresholdBase(): number {
  return noCollectionUnder / noticeRate;
}

/**
 * 추계액 신고로 바꿀 수 있는 선 — 제65조 제3항.
 *
 * 중간예납추계액(세액)이 중간예납기준액의 100분의 30에 **미달**해야 한다.
 * 정확히 30%는 미달이 아니다.
 */
export function estimateLine(base: number): number {
  return base * estimateFraction;
}

export function qualifiesByEstimate(base: number, estimate: number): boolean {
  return estimate < estimateLine(base);
}

/**
 * 분할납부할 수 있는 최대 금액 — 법 제77조 + 시행령 제140조.
 *
 * 1천만원 **초과**여야 분납이 된다(정확히 1천만원은 안 된다).
 * 2천만원 이하 → 1천만원을 초과하는 금액.
 * 2천만원 초과 → 그 세액의 100분의 50 이하 — 원 단위 버림.
 */
export function maxInstallment(amount: number): number {
  const a = Math.max(0, Math.floor(amount));
  if (a <= installmentOver) return 0;
  if (a <= installmentUpTo) return a - installmentOver;
  return Math.floor(a * r.installment.overHalfRate);
}

export const schedule = r.schedule;
