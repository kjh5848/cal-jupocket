import { describe, it, expect } from "vitest";
import r from "../../rates/four-insurance-2026.json";
import pp from "../../rates/pension-premium-2026.json";
import { pensionRate, careRatio, payroll, regionalHealth, workerRateSum } from "../four-insurance";

describe("4대보험 요율", () => {
  it("국민연금 2026년 4.75%씩, 2027년 5%씩 — 지역가입자 요율의 절반", () => {
    expect(pensionRate(2026)).toBe(0.0475);
    expect(pensionRate(2027)).toBe(0.05);
    for (const y of r.pension.byYear) expect(y.each * 2).toBeCloseTo(y.regional, 10);
    expect(r.pension.regional).toBe(pp.rate);
  });
  it("건강보험료율 1만분의 719, 장기요양 100만분의 9,448", () => {
    expect(r.health.rate).toBe(0.0719);
    expect(r.longTermCare.rate).toBe(0.009448);
  });
  it("장기요양 비율 — 11월 27일 전엔 원래 값, 그 뒤엔 0.1314", () => {
    expect(careRatio("2026-11-26")).toBeCloseTo(0.009448 / 0.0719, 12);
    expect(careRatio("2026-11-27")).toBe(0.1314);
  });
  it("실업급여 1.8%의 절반 0.9%", () => expect(r.employment.unemployment * r.employment.workerShare).toBeCloseTo(0.009, 10));
});

describe("payroll", () => {
  it("월 300만원 — 연금 142,500 · 건강 107,850 · 장기요양 14,172 · 고용 27,000", () => {
    const x = payroll(3_000_000);
    expect(x.pension).toBe(142_500);
    expect(x.health).toBe(107_850);
    expect(x.care).toBe(14_172); // 107,850 × 0.9448/7.19 = 1,500,000 × 0.9448% — 정확히 떨어진다
    expect(x.employment).toBe(27_000);
    expect(x.total).toBe(x.pension + x.health + x.care + x.employment);
  });
  it("국민연금은 상한 659만원에서 멈춘다", () => {
    expect(payroll(10_000_000).pensionBase).toBe(pp.standardIncomeCeiling);
    expect(payroll(10_000_000).pension).toBe(Math.floor((pp.standardIncomeCeiling * 0.0475) / 10) * 10);
  });
  it("사업주는 고용안정 0.25%를 더 낸다(150명 미만)", () => {
    const x = payroll(3_000_000);
    expect(x.employer.employment).toBe(Math.floor(3_000_000 * (0.009 + 0.0025)));
  });
  it("65세 이후 새로 고용되면 고용보험 근로자분 0", () => expect(payroll(3_000_000, { over65New: true }).employment).toBe(0));
  it("0원이면 0", () => expect(payroll(0).total).toBe(0));
});

describe("regionalHealth", () => {
  it("소득월액 × 7.19% + 점수 × 211.5원", () => {
    const x = regionalHealth(2_000_000, 500);
    expect(x.income).toBe(143_800);
    expect(x.property).toBe(105_750);
    expect(x.health).toBe(249_550);
  });
});

it("근로자 요율 합계는 9.4% 근처", () => expect(workerRateSum()).toBeCloseTo(0.0475 + 0.03595 + 0.03595 * (0.009448 / 0.0719) + 0.009, 10));
