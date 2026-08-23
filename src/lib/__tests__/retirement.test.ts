import { describe, it, expect } from "vitest";
import {
  monthlyGap,
  totalShortfall,
  monthlySavingNeeded,
  coverageRatio,
} from "../retirement";

describe("monthlyGap", () => {
  it("목표에서 연금을 뺀 부족액을 낸다", () => {
    expect(monthlyGap(1976000, 800000)).toBe(1176000);
  });
  it("연금이 목표보다 많으면 0을 낸다(음수 부족액은 없다)", () => {
    expect(monthlyGap(1392000, 1500000)).toBe(0);
  });
});

describe("totalShortfall", () => {
  it("월 부족액 x 12개월 x 노후기간", () => {
    // 117.6만원 x 12 x 25년 = 3억 5,280만원
    expect(totalShortfall(1176000, 25)).toBe(352800000);
  });
  it("음수 기간은 던진다", () => {
    expect(() => totalShortfall(1000000, -1)).toThrow();
  });
});

describe("monthlySavingNeeded", () => {
  it("총 부족자금을 남은 개월수로 나눈다", () => {
    // 3억 5,280만원 / (20년 x 12개월) = 147만원
    expect(monthlySavingNeeded(352800000, 20)).toBe(1470000);
  });
  it("준비 기간이 0이면 던진다", () => {
    expect(() => monthlySavingNeeded(100000000, 0)).toThrow();
  });
});

describe("coverageRatio", () => {
  it("연금이 목표의 몇 할을 채우는지", () => {
    expect(coverageRatio(2000000, 800000)).toBeCloseTo(0.4, 5);
  });
  it("연금이 목표를 넘으면 1로 자른다", () => {
    expect(coverageRatio(1000000, 1500000)).toBe(1);
  });
});
