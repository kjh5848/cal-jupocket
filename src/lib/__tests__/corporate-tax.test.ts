import { describe, it, expect } from "vitest";
import { corporateTax, corporateMarginal, corporateTaxBeforeRaise, corporateDeadline, prepayByPrior, prepayDeadline } from "../corporate-tax";

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe("법인세율(2026. 1. 1. 이후 개시 사업연도)", () => {
  it("2억원 이하 10%", () => expect(corporateTax(200_000_000)).toBe(20_000_000));
  it("200억원 = 2천만원 + 198억원 × 20% = 39억8천만원", () => expect(corporateTax(20_000_000_000)).toBe(3_980_000_000));
  it("3천억원 = 39억8천만원 + 2,800억원 × 22% = 655억8천만원", () => expect(corporateTax(300_000_000_000)).toBe(65_580_000_000));
  it("부동산임대 주업 법인은 200억원 이하 20%", () => {
    expect(corporateTax(100_000_000, true)).toBe(20_000_000);
    expect(corporateTax(20_000_000_000, true)).toBe(4_000_000_000);
  });
  it("한계세율", () => {
    expect(corporateMarginal(300_000_000)).toBe(0.2);
    expect(corporateMarginal(1)).toBe(0.1);
  });
  it("인상 전 세율로는 1%p씩 적다 — 과세표준 3억원이면 300만원 차이", () => {
    expect(corporateTaxBeforeRaise(300_000_000)).toBe(18 * 1e6 + 19 * 1e6);
    expect(corporateTax(300_000_000) - corporateTaxBeforeRaise(300_000_000)).toBe(3_000_000);
  });
});

describe("기한", () => {
  it("12월 결산 → 3월 31일, 성실신고 4월 30일", () => {
    expect(iso(corporateDeadline(2026, 12))).toBe("2027-03-31");
    expect(iso(corporateDeadline(2026, 12, true))).toBe("2027-04-30");
  });
  it("6월 결산 → 9월 30일", () => expect(iso(corporateDeadline(2026, 6))).toBe("2026-09-30"));
  it("1월 시작 사업연도 중간예납 → 8월 31일", () => expect(iso(prepayDeadline(2026, 1))).toBe("2026-08-31"));
  it("직전 산출세액 2천만원 → 중간예납 1천만원", () => expect(prepayByPrior(20_000_000)).toBe(10_000_000));
});
