import { describe, it, expect } from "vitest";
import rates from "../../rates/2026.json";
import { round1, splitWithholdingRate } from "../rate-display";

describe("round1", () => {
  it("부동소수점 오차를 소수 첫째 자리로 정리한다", () => {
    expect(round1(3.3000000000000003)).toBe(3.3);
  });
  it("정수는 그대로 유지한다", () => {
    expect(round1(10)).toBe(10);
  });
});

describe("splitWithholdingRate", () => {
  it("사업소득 3.3% 원천징수를 소득세 3% + 지방소득세 0.3%로 분해한다", () => {
    const r = splitWithholdingRate(
      rates.withholding.business,
      rates.localTaxRate,
    );
    expect(r.incomeTaxPercent).toBe(3);
    expect(r.localSurchargePercent).toBe(0.3);
  });
});
