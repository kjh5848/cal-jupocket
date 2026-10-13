import { describe, it, expect } from "vitest";
import tr from "../../rates/2026.json";
import { marginalRate, basicTax, otherIncomeTax, otherIncomeExemptMax, businessWithholding, earnedTaxByPay } from "../income-tax-rate";

describe("기본세율 표(제55조 img alt 대조)", () => {
  it("구간 경계와 세율", () => {
    expect(tr.incomeTaxBrackets.map((b) => b.upTo)).toEqual([14_000_000, 50_000_000, 88_000_000, 150_000_000, 300_000_000, 500_000_000, 1_000_000_000, null]);
    expect(tr.incomeTaxBrackets.map((b) => b.rate)).toEqual([0.06, 0.15, 0.24, 0.35, 0.38, 0.4, 0.42, 0.45]);
  });
  it("조문의 구간 기본세액과 누진공제 방식이 같은 값을 낸다", () => {
    // 84만원·624만원·1,536만원·3,706만원·9,406만원·1억7,406만원·3억8,406만원
    const starts = [840_000, 6_240_000, 15_360_000, 37_060_000, 94_060_000, 174_060_000, 384_060_000];
    tr.incomeTaxBrackets.slice(0, 7).forEach((b, i) => expect(basicTax(b.upTo!).tax).toBe(starts[i]));
  });
  it("한계세율", () => {
    expect(marginalRate(14_000_000)).toBe(0.06);
    expect(marginalRate(14_000_001)).toBe(0.15);
    expect(marginalRate(2_000_000_000)).toBe(0.45);
  });
});

describe("기타소득", () => {
  it("강연료 100만원 → 소득금액 40만원 × 20% = 8만원 + 지방 8천원 = 8.8%", () => {
    const x = otherIncomeTax(1_000_000);
    expect(x.income).toBe(400_000);
    expect(x.tax).toBe(80_000);
    expect(x.total).toBe(88_000);
  });
  it("소득금액 5만원 이하면 과세 안 함 — 60% 경비면 12만5천원까지", () => {
    expect(otherIncomeExemptMax()).toBe(125_000);
    expect(otherIncomeTax(125_000).tax).toBe(0);
    expect(otherIncomeTax(125_010).tax).toBeGreaterThan(0);
  });
  it("80% 경비 상금 — 25만원까지 과세최저한", () => expect(otherIncomeExemptMax(0.8)).toBe(250_000));
});

it("사업소득 3.3%", () => expect(businessWithholding(1_000_000).total).toBe(33_000));

describe("연봉별 근로소득세", () => {
  it("연봉이 오를수록 실효세율이 오른다", () => {
    const a = earnedTaxByPay(30_000_000), b = earnedTaxByPay(50_000_000), c = earnedTaxByPay(100_000_000);
    expect(a.effective).toBeLessThan(b.effective);
    expect(b.effective).toBeLessThan(c.effective);
  });
  it("연봉 1,500만원은 근로소득세가 0", () => expect(earnedTaxByPay(15_000_000).decided).toBe(0));
});
