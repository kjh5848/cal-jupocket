import { describe, it, expect } from "vitest";
import { prepayDiscount, daysAfter, effectivePrepayRate, yearlyBase, PREPAY_INTEREST } from "../vehicle-tax";

/**
 * 자동차세 연납 공제 — 지방세법 제128조 제3항 계산식, 시행령 제125조 제6항(5%).
 * 고정하는 것: 이자율은 5%지만 1월에 내도 실제 공제율은 5%보다 작다.
 */
describe("자동차세 연납 공제", () => {
  it("이자율은 5%", () => {
    expect(PREPAY_INTEREST).toBe(0.05);
  });

  it("1월 31일 기한이면 남은 일수는 2월 1일~12월 31일", () => {
    expect(daysAfter(2027, 1, 31)).toBe(334);
    expect(daysAfter(2028, 1, 31)).toBe(335); // 윤년
    expect(daysAfter(2027, 9, 30)).toBe(92);
  });

  it("2,000cc 신차(연세액 40만원)를 2027년 1월에 연납하면 18,301원", () => {
    const annual = yearlyBase(2000);
    expect(annual).toBe(400_000);
    expect(prepayDiscount(annual, "jan", 2027)).toBe(18_301);
  });

  it("1월 연납의 실제 공제율은 5%보다 작다(약 4.58%)", () => {
    const r = effectivePrepayRate("jan", 2027);
    expect(r).toBeLessThan(0.05);
    expect(r).toBeCloseTo(0.04575, 4);
  });

  it("늦게 낼수록 공제가 줄어든다", () => {
    const a = 400_000;
    const jan = prepayDiscount(a, "jan", 2027);
    const mar = prepayDiscount(a, "mar", 2027);
    const jun = prepayDiscount(a, "jun", 2027);
    const sep = prepayDiscount(a, "sep", 2027);
    expect(jan).toBeGreaterThan(mar);
    expect(mar).toBeGreaterThan(jun);
    expect(jun).toBeGreaterThan(sep);
    expect(jun).toBe(10_000); // 제2기분 20만 × 5%
  });
});
