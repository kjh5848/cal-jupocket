/**
 * 통상임금 — 근로기준법 시행령 제6조 ②③(rates ordinary-wage-2026.json).
 * roberin 대조값(2026-10-18, docs/calc-benchmark.md)도 같이 고정한다.
 */
import { describe, it, expect } from "vitest";
import { basisHours, itemHourly, ordinaryWage, type WageItem } from "../ordinary-wage";

const std = { weeklyHours: 40, dailyHours: 8 };
const m = (amount: number, period: WageItem["period"] = "month", include = true): WageItem => ({ amount, period, include });

describe("산정 기준시간", () => {
  it("주 40시간 → 1주 48시간, 월 209시간(고시)", () => {
    const h = basisHours(std);
    expect(h.weekly).toBe(48);
    expect(h.monthly).toBe(209);
  });
  it("주 20시간 → 주휴 4시간, 월 (24 × 365/7/12)", () => {
    const h = basisHours({ weeklyHours: 20, dailyHours: 4 });
    expect(h.holiday).toBe(4);
    expect(h.monthly).toBeCloseTo(104.2857, 3);
  });
  it("주 15시간 미만은 주휴 없음", () => {
    expect(basisHours({ weeklyHours: 14, dailyHours: 3 }).holiday).toBe(0);
  });
  it("토요일 유급 4시간을 더하면 209시간이 아니라 산식 값", () => {
    expect(basisHours({ ...std, extraPaidWeekly: 4 }).monthly).toBeCloseTo((52 * 365) / 7 / 12, 6);
  });
  it("주 40시간을 넘게 넣어도 40시간으로", () => {
    expect(basisHours({ weeklyHours: 48, dailyHours: 8 }).monthly).toBe(209);
  });
});

describe("지급 단위별 시간급(제2항 제1호~제5호)", () => {
  const h = basisHours(std);
  it("시간급은 그대로, 일급은 ÷ 1일 시간, 주급은 ÷ 48", () => {
    expect(itemHourly({ amount: 10320, period: "hour" }, h)).toBe(10320);
    expect(itemHourly({ amount: 82560, period: "day" }, h)).toBe(10320);
    expect(itemHourly({ amount: 495360, period: "week" }, h)).toBe(10320);
  });
  it("분기·반기·1년은 개월 수로 나눈 뒤 월 기준시간으로", () => {
    expect(itemHourly({ amount: 627000, period: "quarter" }, h)).toBeCloseTo(1000, 9);
    expect(itemHourly({ amount: 1254000, period: "half" }, h)).toBeCloseTo(1000, 9);
    expect(itemHourly({ amount: 2508000, period: "year" }, h)).toBeCloseTo(1000, 9);
    expect(itemHourly({ amount: 418000, period: "2month" }, h)).toBeCloseTo(1000, 9);
  });
  it("1일 시간 0이면 일급은 0", () => {
    expect(itemHourly({ amount: 80000, period: "day" }, basisHours({ weeklyHours: 40, dailyHours: 0 }))).toBe(0);
  });
});

describe("합산·단수(제7호·제3항)", () => {
  it("2026 최저 월급 2,156,880 → 통상시급 10,320 · 1일 82,560 (roberin 같음)", () => {
    const x = ordinaryWage([m(2_156_880)], std);
    expect(x.hourly).toBe(10320);
    expect(x.daily).toBe(82560);
    expect(x.monthly).toBe(2_156_880);
  });
  it("기본급 200만 + 20만 + 10만 + 연 360만 → 월 260만 · 12,440 · 99,521 (roberin 12,440.19 · 99,521.53)", () => {
    const x = ordinaryWage([m(2_000_000), m(200_000), m(100_000), m(3_600_000, "year")], std);
    expect(x.monthly).toBe(2_600_000);
    expect(x.hourly).toBe(12440);
    expect(x.daily).toBe(99521);
  });
  it("항목별로 버리지 않고 더한다 — 버렸다면 12,438", () => {
    const x = ordinaryWage([m(2_000_000), m(200_000), m(100_000), m(3_600_000, "year")], std);
    const floored = x.rows.reduce((s, r) => s + Math.floor(r.hourly), 0);
    expect(floored).toBe(12438);
    expect(x.hourly).toBe(12440);
  });
  it("뺀 항목은 통상시급에 안 들어가고 따로 보인다", () => {
    const x = ordinaryWage([m(2_000_000), m(200_000, "month", false)], std);
    expect(x.monthly).toBe(2_000_000);
    expect(x.excludedMonthly).toBe(200_000);
  });
  it("주 20시간 월 100만 → 9,589 · 1일 4시간 38,356 (roberin 은 104.28시간 직접 입력이라 9,589.57)", () => {
    const x = ordinaryWage([m(1_000_000)], { weeklyHours: 20, dailyHours: 4 });
    expect(x.hourly).toBe(9589);
    expect(x.daily).toBe(38356);
  });
  it("시급제 + 매월 수당 섞기", () => {
    const x = ordinaryWage([m(10_320, "hour"), m(209_000)], std);
    expect(x.hourly).toBe(11320);
  });
  it("빈 입력은 0", () => {
    const x = ordinaryWage([m(0)], std);
    expect(x.hourly).toBe(0);
    expect(x.daily).toBe(0);
  });
});
