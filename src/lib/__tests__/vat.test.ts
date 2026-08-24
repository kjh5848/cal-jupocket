import { describe, it, expect } from "vitest";
import {
  fromSupply,
  fromTotal,
  simplifiedTax,
  isPaymentExempt,
  isSimplifiedEligible,
} from "../vat";

describe("일반과세 fromSupply", () => {
  it("공급가액 1,000,000 → 부가세 100,000, 합계 1,100,000", () => {
    const r = fromSupply(1000000);
    expect(r.tax).toBe(100000);
    expect(r.total).toBe(1100000);
  });
});

describe("일반과세 fromTotal (역산)", () => {
  it("합계 1,100,000 → 공급가액 1,000,000, 부가세 100,000", () => {
    const r = fromTotal(1100000);
    expect(r.supply).toBe(1000000);
    expect(r.tax).toBe(100000);
  });
  it("합계 2,200,000 → 공급가액 2,000,000 (SERP 예시와 일치)", () => {
    expect(fromTotal(2200000).supply).toBe(2000000);
  });
});

describe("간이과세 simplifiedTax", () => {
  it("음식점업(15%) 공급대가 10,000,000 → 150,000", () => {
    // 10,000,000 × 0.15 × 0.1 = 150,000
    expect(simplifiedTax(10000000, 0.15).tax).toBe(150000);
  });
  it("서비스업(30%) 공급대가 10,000,000 → 300,000", () => {
    expect(simplifiedTax(10000000, 0.3).tax).toBe(300000);
  });
});

describe("납부의무 면제 / 간이과세 대상", () => {
  it("공급대가 4,800만원 미만이면 납부면제", () => {
    expect(isPaymentExempt(47999999)).toBe(true);
    expect(isPaymentExempt(48000000)).toBe(false);
  });
  it("연매출 1억 400만원 미만이면 간이과세 대상", () => {
    expect(isSimplifiedEligible(103999999)).toBe(true);
    expect(isSimplifiedEligible(104000000)).toBe(false);
  });
});
