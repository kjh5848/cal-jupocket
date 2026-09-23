/**
 * 부가가치세 예정고지 (순수 함수).
 *
 * 요율·기준금액은 rates/vat-prepay-2026.json(부가가치세법 제48조·시행령
 * 제90조 원문 대조)에서만 가져온다.
 *
 * 조문의 순서가 계산의 순서다 — 50%를 곱하고, 1천원 미만을 버리고,
 * 그 결과가 50만원 미만이면 아예 고지되지 않는다. 손으로 적으면 이 순서가
 * 반드시 흐려진다. 특히 "50만원 미만"은 직전 납부세액이 아니라 **절사까지
 * 끝난 고지 예정액**을 재는 것이라, 순서를 바꾸면 경계가 통째로 움직인다.
 *
 * 여기서 가산세는 계산하지 않는다. 예정고지세액을 안 냈을 때 얼마가 붙는지는
 * rates 의 notVerified 에 적어 둔 대로 원문에서 확인하지 못했다.
 */
import r from "../rates/vat-prepay-2026.json";

export const noticeRate = r.notice.rate; // 0.5
export const roundDownUnder = r.notice.roundDownUnder; // 1,000
export const noCollectionUnder = r.noCollectionUnder; // 500,000
export const corporateSupplyThreshold = r.corporateSupplyThreshold; // 150,000,000

export interface NoticeResult {
  /** 직전 과세기간 납부세액 (입력값) */
  previousTax: number;
  /** 50%를 곱한 금액 — 절사 전 */
  halved: number;
  /** 1천원 미만 단수를 버린 금액 */
  amount: number;
  /** 고지서가 나오는가. 50만원 미만이면 나오지 않는다 */
  collected: boolean;
}

/**
 * 예정고지세액 — 제48조 제3항.
 *
 * 직전 과세기간 납부세액 × 50% → 1천원 미만 절사 → 50만원 미만이면 미고지.
 */
export function noticeAmount(previousTax: number): NoticeResult {
  const previous = Math.max(0, Math.floor(previousTax));
  const halved = previous * noticeRate;
  const amount = Math.floor(halved / roundDownUnder) * roundDownUnder;
  return {
    previousTax: previous,
    halved,
    amount,
    collected: amount >= noCollectionUnder,
  };
}

/**
 * 고지서가 나오기 시작하는 직전 과세기간 납부세액.
 *
 * 절사가 1천원 단위라 경계는 정확히 100만원이다 — 50만원을 고지받으려면
 * 절사 후 금액이 50만원 이상이어야 하고, 50%를 되돌리면 100만원이다.
 */
export function noticeThresholdTax(): number {
  return noCollectionUnder / noticeRate;
}

/**
 * 법인사업자가 예정고지 대상인가 — 시행령 제90조 제4항.
 *
 * 직전 과세기간 공급가액 합계액이 1억5천만원 **미만**이면 예정고지를 받고,
 * 그 이상이면 예정신고 의무자다. 개인사업자는 공급가액과 무관하게 제3항의
 * 예정고지 대상이라 이 함수를 쓰지 않는다.
 */
export function isCorporateNoticeSubject(previousSupplyValue: number): boolean {
  return previousSupplyValue < corporateSupplyThreshold;
}

/**
 * 예정신고로 갈아탈 수 있는 기준선 — 시행령 제90조 제6항 제1호.
 *
 * 예정신고기간의 공급가액 또는 납부세액이 직전 과세기간의 그것의 3분의 1에
 * **미달**해야 한다. 경계값(정확히 3분의 1)은 미달이 아니다.
 */
export function oneThirdLine(previous: number): number {
  return previous / 3;
}

export function qualifiesBySlump(previous: number, current: number): boolean {
  return current < oneThirdLine(previous);
}

/** 과세기간별 일정 — 표로 그대로 내보낸다. */
export const periods = r.periods;

/** 이 글이 다루는 2기 예정신고기간(7월 1일~9월 30일)의 일정. */
export const period2 = r.periods.find((p) => p.period === 2)!;
