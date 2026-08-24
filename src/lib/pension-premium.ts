/**
 * 국민연금 지역가입자 월 보험료 계산 (순수 함수).
 *
 * 요율·상하한은 rates/pension-premium-2026.json(국민연금공단 원문 대조)
 * 에서만 가져온다. 지역가입자는 보험료 전액을 본인이 부담하므로
 * 기준소득월액 × 요율이 곧 본인 부담액이다.
 *
 * 계산 규칙:
 *  - 기준소득월액 = 신고소득의 천원 미만 절사 후, 상·하한으로 clamp
 *  - 월 보험료 = 기준소득월액 × 요율, 10원 미만 절사
 */
import data from "../rates/pension-premium-2026.json";
import { won } from "./money";

const RATE = data.rate; // 0.095
const CEIL = data.standardIncomeCeiling; // 6,590,000
const FLOOR = data.standardIncomeFloor; // 410,000
const ROUND = data.premiumRoundUnit; // 10

const floorTo = (v: number, unit: number) => Math.floor(v / unit) * unit;

/** 신고소득 → 기준소득월액(천원 절사 후 상·하한 적용) */
export function standardIncome(income: number): number {
  const truncated = floorTo(won(income), 1000);
  if (truncated <= FLOOR) return FLOOR;
  if (truncated >= CEIL) return CEIL;
  return truncated;
}

/**
 * 신고소득 → 월 보험료·연 보험료·기준소득월액과 상·하한 적용 여부.
 * 소득이 0 이하이면 계산하지 않고 0을 돌려준다.
 */
export function compute(income: number) {
  const inc = won(income);
  if (inc <= 0) {
    return {
      income: 0,
      standardIncome: 0,
      monthly: 0,
      annual: 0,
      capped: false,
      floored: false,
    };
  }
  const std = standardIncome(inc);
  const monthly = floorTo(std * RATE, ROUND);
  return {
    income: inc,
    standardIncome: std,
    monthly,
    annual: monthly * 12,
    capped: floorTo(inc, 1000) >= CEIL,
    floored: floorTo(inc, 1000) <= FLOOR,
  };
}
