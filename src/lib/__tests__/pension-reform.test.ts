import { describe, it, expect } from "vitest";
import { rateSchedule, rateForYear } from "../pension-reform";
import rates from "../../rates/pension-premium-2026.json";

describe("rateSchedule", () => {
  const schedule = rateSchedule();

  it("8개 연도를 만든다", () => {
    expect(schedule).toHaveLength(rates.reform.years);
  });

  it("2026년은 현재 요율(9.5%)로 시작한다", () => {
    expect(schedule[0]).toEqual({ year: 2026, rate: rates.rate });
  });

  it("마지막 해는 2033년 13%다 — 공단이 밝힌 도착점", () => {
    expect(schedule[schedule.length - 1]).toEqual({
      year: rates.reform.targetYear,
      rate: rates.reform.targetRate,
    });
  });

  it("매년 정확히 0.5%p 오른다 (부동소수 오차 없이)", () => {
    for (let i = 1; i < schedule.length; i++) {
      const diff =
        Math.round((schedule[i].rate - schedule[i - 1].rate) * 1000) / 1000;
      expect(diff).toBe(rates.reform.stepPerYear);
    }
  });

  it("요율에 부동소수 잔재가 없다", () => {
    for (const s of schedule) {
      expect(s.rate).toBe(Math.round(s.rate * 1000) / 1000);
    }
  });
});

describe("rateForYear", () => {
  it("인상 시작 전·첫해는 9.5%", () => {
    expect(rateForYear(2025)).toBe(rates.rate);
    expect(rateForYear(2026)).toBe(rates.rate);
  });

  it("중간 연도를 계산한다", () => {
    expect(rateForYear(2027)).toBe(0.1);
    expect(rateForYear(2030)).toBe(0.115);
  });

  it("인상 완료 후에는 13%로 고정된다", () => {
    expect(rateForYear(2033)).toBe(0.13);
    expect(rateForYear(2040)).toBe(0.13);
  });
});
