/**
 * 노후자금 부족분 계산.
 *
 * "얼마 있어야 하나"에 답하는 유일한 정직한 방법은 목표 생활비에서
 * 이미 확보된 연금을 빼는 것이다. 그래서 이 파일은 단정적인 "필요
 * 총액"을 만들지 않고, 사용자가 넣은 값으로 부족분을 역산한다.
 *
 * 물가상승·투자수익률·세금은 반영하지 않는다(글에서 이 가정을 밝힌다).
 * 반영하려면 가정값 하나로 결과가 크게 흔들려, 오히려 오해를 만든다.
 */
import { won } from "./money";

/** 목표 월 생활비에서 연금으로 채워지는 부분을 뺀 월 부족액. 음수면 0. */
export function monthlyGap(
  targetMonthly: number,
  pensionMonthly: number,
): number {
  return Math.max(0, won(targetMonthly) - won(pensionMonthly));
}

/** 노후 기간(년) 동안 필요한 총 부족자금. */
export function totalShortfall(
  monthlyGapAmount: number,
  retirementYears: number,
): number {
  if (retirementYears < 0) {
    throw new Error(`노후 기간은 음수일 수 없다: ${retirementYears}`);
  }
  return won(monthlyGapAmount * 12 * retirementYears);
}

/** 은퇴까지 남은 기간(년)에 걸쳐 매월 모아야 하는 금액. */
export function monthlySavingNeeded(
  shortfall: number,
  yearsToPrepare: number,
): number {
  if (yearsToPrepare <= 0) {
    throw new Error(`준비 기간은 0보다 커야 한다: ${yearsToPrepare}`);
  }
  return won(shortfall / (yearsToPrepare * 12));
}

/** 목표 생활비 중 연금이 채우는 비율(0~1). 목표가 0이면 0. */
export function coverageRatio(
  targetMonthly: number,
  pensionMonthly: number,
): number {
  if (targetMonthly <= 0) return 0;
  return Math.min(1, pensionMonthly / targetMonthly);
}
