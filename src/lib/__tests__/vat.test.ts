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

// 2026-10-17 roberin 대조 — 제29조 제7항(받은 금액 × 100/110)은 단수 처리를 정하지 않는다. 우리는 공급가액 반올림, 합은 늘 받은 금액
describe("합계 역산 단수 · roberin 대조 입력", () => {
  it.each([
    [1_000_000, 909_091, 90_909],
    [12_345, 11_223, 1_122],
    [999, 908, 91],
    [1_100_000, 1_000_000, 100_000],
  ])("합계 %i → 공급가액 %i · 부가세 %i", (t, s, x) => {
    const r = fromTotal(t);
    expect(r).toEqual({ supply: s, tax: x, total: t });
  });
  it.each([
    [12_345, 1_235, 13_580],
    [999, 100, 1_099],
  ])("공급가액 %i → 부가세 %i · 합계 %i", (s, x, t) => expect(fromSupply(s)).toEqual({ supply: s, tax: x, total: t }));
});
