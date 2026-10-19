/**
 * 일본 割増賃金の基礎となる1時間あたりの賃金 — 労働基準法施行規則 第19条 二号·四号(e-Gov 2026-10-20 확인).
 * 손계산: 365 − 120 = 245日, 245 × 8 ÷ 12 = 163.333…時間, 250,000 ÷ 163.333… = 1,530.612…円.
 * 366 − 120 = 246日, 246 × 8 ÷ 12 = 164時間. 日給 12,000 ÷ 8 = 1,500円.
 */
import { describe, it, expect } from "vitest";
import {
  monthlyAverageHours,
  annualWorkDays,
  hourlyFromMonthly,
  hourlyFromDaily,
  formatSen,
  formatHours,
} from "../jp/hourly-wage-base";

describe("月平均所定労働時間 (第19条 四号 — 一年間における一月平均)", () => {
  it("年間休日 120日·1日 8時間 → 245日, 163.33…時間", () => {
    expect(annualWorkDays(365, 120)).toBe(245);
    expect(monthlyAverageHours(245, 8)).toBeCloseTo(163.3333333, 6);
    expect(formatHours(monthlyAverageHours(245, 8))).toBe("163.33時間");
  });
  it("うるう年 366日 → 246日 × 8 ÷ 12 = 164時間", () => {
    expect(monthlyAverageHours(annualWorkDays(366, 120), 8)).toBe(164);
    expect(formatHours(164)).toBe("164時間");
  });
  it("0 や 負の値は 0", () => {
    expect(monthlyAverageHours(0, 8)).toBe(0);
    expect(annualWorkDays(365, 400)).toBe(0);
  });
});

describe("月給制 (第19条 四号)", () => {
  it("基本給 220,000 + 算入手当 30,000 (除外手当 20,000 は入れない) ÷ 163.33… = 1,530.61円", () => {
    const r = hourlyFromMonthly({ basePay: 220000, includedAllowances: 30000, excludedAllowances: 20000, monthlyHours: monthlyAverageHours(245, 8) });
    expect(r.base).toBe(250000);
    expect(r.hourly).toBeCloseTo(1530.6122449, 6);
    expect(formatSen(r.hourly)).toBe("1,530.61円");
  });
  it("除外手当の額は結果を変えない", () => {
    const a = hourlyFromMonthly({ basePay: 200000, includedAllowances: 0, excludedAllowances: 0, monthlyHours: 160 });
    const b = hourlyFromMonthly({ basePay: 200000, includedAllowances: 0, excludedAllowances: 50000, monthlyHours: 160 });
    expect(a.hourly).toBe(1250);
    expect(b.hourly).toBe(1250);
  });
  it("時間数 0 なら 0円", () => {
    expect(hourlyFromMonthly({ basePay: 200000, includedAllowances: 0, excludedAllowances: 0, monthlyHours: 0 }).hourly).toBe(0);
  });
});

describe("日給制 (第19条 二号)", () => {
  it("日給 12,000 ÷ 8時間 = 1,500円", () => {
    expect(hourlyFromDaily(12000, 8).hourly).toBe(1500);
    expect(formatSen(1500)).toBe("1,500.00円");
  });
  it("日給 10,000 ÷ 7.5時間 = 1,333.33円（銭未満は表示しない）", () => {
    expect(formatSen(hourlyFromDaily(10000, 7.5).hourly)).toBe("1,333.33円");
  });
});
