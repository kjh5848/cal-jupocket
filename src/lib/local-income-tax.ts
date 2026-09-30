/**
 * 개인지방소득세 — 5월에 종합소득세와 함께 따로 내는 세금.
 *
 * "종합소득세 10%" 라고 흔히 말하는데, 정확히는 **소득세 산출세액의 10%가
 * 아니라 같은 과세표준에 1/10 세율을 적용한 것**이다. 결과는 대개 비슷하지만
 * 세액공제·감면을 반영하는 방식이 달라 정확히 10%가 아닐 수 있다.
 *
 * 그래서 이 파일은 **소득세액에서 계산하지 않는다.** 과세표준에서
 * 지방세법 제92조 제1항의 표를 그대로 적용한다.
 *
 * 그리고 국세가 아니다 — 신고처가 다르다. 홈택스가 아니라 위택스이고,
 * 신고기한만 소득세와 같다(제95조 제1항).
 */
import rates from "../rates/local-tax-2026.json";

const L = rates.localIncomeTax;

/** 과세표준 → 개인지방소득세 산출세액. 초과누진. */
export function taxOn(base: number): number {
  if (base <= 0) return 0;
  let prev = 0;
  for (const b of L.brackets) {
    if (b.upTo === null || base <= b.upTo) {
      return Math.floor(b.base + (base - prev) * b.rate);
    }
    prev = b.upTo;
  }
  return 0;
}

/** 그 과세표준이 걸리는 구간의 세율(%). */
export function bracketPercent(base: number): number {
  let prev = 0;
  for (const b of L.brackets) {
    if (b.upTo === null || base <= b.upTo) return b.rate * 100;
    prev = b.upTo;
  }
  return 0;
}

/** 100만원을 넘으면 기한 후 2개월 안에 나눠 낼 수 있다. */
export function canInstall(tax: number): boolean {
  return tax > L.installment.over;
}

export const BRACKETS = L.brackets;
export const INSTALLMENT = L.installment;
export const ORDINANCE = L.ordinanceRange;
export const FILING = L.filing;
