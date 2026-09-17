/**
 * 기한 후 신고로 돌려받을 때 — 언제 결정되고, 이자가 얼마 붙나.
 *
 * penalty.ts 가 "얼마를 더 내나"를 답한다면 이 파일은 그 반대쪽이다.
 * 3.3%로 미리 떼인 금액이 실제 세액보다 크면 기한 후 신고의 결과는
 * 납부가 아니라 환급이다. 검색어가 묻는 것도 "환급일·언제·입금"이다.
 *
 * 숫자는 전부 rates/refund-2026.json 에서 온다. 그 파일은 국세기본법
 * 제45조의2·제45조의3·제47조의2·제52조와 시행령 제43조의3,
 * 시행규칙 제19조의3 원문에서 확인한 것이다.
 *
 * 다루지 않는 것(rates 의 notVerified 참조): 복식부기의무자 판정 기준금액,
 * 홈택스 절차, 은행 입금까지의 실제 소요일.
 */
import rates from "../rates/refund-2026.json";

/** 원 단위로 맞춘다 — 표시와 계산이 어긋나지 않게 한곳에서 버린다. */
const won = (n: number) => Math.floor(Math.max(0, n));

export interface RefundInterestInput {
  /** 돌려받을 국세환급금(원). */
  refund: number;
  /** 기산일부터 지급결정일까지의 일수. */
  days: number;
}

export interface RefundInterestResult {
  /** 국세환급가산금(원). */
  interest: number;
  /** 환급금 + 가산금. */
  total: number;
  /** 적용 이자율(연, 0~1). */
  annualRate: number;
}

/**
 * 국세환급가산금.
 *
 * 제52조 제1항은 기산일부터 지급결정일까지의 기간에 시행규칙이 정한
 * 이자율을 곱하도록 한다. 일할 계산이므로 연이율을 365로 나눈다.
 */
export function computeRefundInterest({
  refund,
  days,
}: RefundInterestInput): RefundInterestResult {
  const annualRate = rates.refundInterest.annualRate;
  const interest = won((refund * annualRate * Math.max(0, days)) / 365);
  return { interest, total: won(refund) + interest, annualRate };
}

/**
 * 무신고가산세의 과세표준은 "납부하여야 할 세액"이다(제47조의2 제1항).
 * 그래서 환급인 경우 — 납부할 세액이 없으면 — 곱할 대상이 0이다.
 *
 * 다만 복식부기의무자·법인은 수입금액 기준 금액과 비교해 큰 쪽을 쓰므로
 * (제47조의2 제2항 제1호) 납부세액이 0이어도 가산세가 남을 수 있다.
 * 이 함수는 그 예외에 해당하지 않는 개인 기준이다.
 */
export function noReportPenaltyOnRefund(taxDue: number): number {
  return won(Math.max(0, taxDue)) === 0 ? 0 : won(taxDue * 0.2);
}

/** 기한 후 신고 뒤 결정·통지까지의 법정 기한(개월). */
export const decisionWithinMonths = rates.lateFiling.decisionWithinMonths;

/** 경정청구 기간(년). */
export const correctionWithinYears = rates.correctionClaim.withinYears;

export { rates as refundRates };
