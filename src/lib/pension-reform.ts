/**
 * 국민연금 보험료율 단계 인상 스케줄 (2025년 연금개혁).
 *
 * 공단이 확인해 준 것은 "2026년 9.5%에서 매년 0.5%p씩 8년간 올라 2033년
 * 13%가 된다"는 문장이다. 연도별 표를 손으로 적어두면 각 연도를 개별
 * 확인한 것처럼 보이므로, 그 문장의 파라미터에서 계산해서 만든다.
 *
 * 출처: rates/pension-premium-2026.json (국민연금공단, 2026-08-24 확인)
 */
import data from "../rates/pension-premium-2026.json";

const { startYear, startRate, stepPerYear, years, targetRate, targetYear } =
  data.reform;

export interface RateStep {
  year: number;
  rate: number;
}

/** 2026년부터 인상이 끝나는 해까지의 연도별 요율. */
export function rateSchedule(): RateStep[] {
  return Array.from({ length: years }, (_, i) => ({
    year: startYear + i,
    // 0.005 를 반복해서 더하면 부동소수 오차가 쌓인다 — 1000배로 계산해 되돌린다.
    rate: Math.round((startRate + stepPerYear * i) * 1000) / 1000,
  }));
}

/** 특정 연도의 요율. 인상 완료 후에는 목표 요율로 고정된다. */
export function rateForYear(year: number): number {
  if (year <= startYear) return startRate;
  if (year >= targetYear) return targetRate;
  return rateSchedule().find((s) => s.year === year)?.rate ?? targetRate;
}
