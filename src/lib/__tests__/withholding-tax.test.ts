import { describe, it, expect } from "vitest";
import { dailyWorkerTax, dailyWorkerTaxFreeMax, withholdingLatePenalty, statementPenalty } from "../withholding-tax";

describe("일용근로자 세금", () => {
  it("일급 20만원 → (20만 − 15만) × 6% = 3,000원, 55% 공제 → 1,350원", () => {
    const x = dailyWorkerTax(200_000);
    expect(x.computed).toBe(3_000);
    expect(x.credit).toBe(1_650);
    expect(x.tax).toBe(1_350);
    expect(x.local).toBe(135);
  });
  it("일급 15만원 이하면 0", () => expect(dailyWorkerTax(150_000).tax).toBe(0));
  it("세액 1천원 미만이면 소액부징수로 0", () => {
    expect(dailyWorkerTax(180_000).raw).toBe(810);
    expect(dailyWorkerTax(180_000).tax).toBe(0);
  });
  it("소득세가 처음 붙는 일급", () => {
    const w = dailyWorkerTaxFreeMax();
    expect(dailyWorkerTax(w).tax).toBe(0);
    expect(dailyWorkerTax(w + 100).tax).toBeGreaterThan(0);
    expect(w).toBe(187_000);
  });
});

describe("원천징수 납부지연가산세", () => {
  it("100만원을 30일 늦게 → 3만원 + 6,600원", () => {
    const x = withholdingLatePenalty(1_000_000, 30);
    expect(x.base).toBe(30_000);
    expect(x.interest).toBe(6_600);
    expect(x.total).toBe(36_600);
  });
  it("오래 늦어도 미납세액의 10%가 한도", () => {
    const x = withholdingLatePenalty(1_000_000, 1_000);
    expect(x.total).toBe(100_000);
    expect(x.capped).toBe(true);
  });
});

it("지급명세서 미제출 1%, 일용·간이 0.25%", () => {
  expect(statementPenalty(10_000_000, "annual")).toBe(100_000);
  expect(statementPenalty(10_000_000, "annual", true)).toBe(50_000);
  expect(statementPenalty(10_000_000, "daily")).toBe(25_000);
  expect(statementPenalty(10_000_000, "simplified", true)).toBe(12_500);
});
