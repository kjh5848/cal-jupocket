/**
 * 시급 계산기 — hourlyWagePay()·hourlyFromMonthly(). roberin(#11) 같은 입력 대조는 docs/calc-benchmark.md.
 * 주 40시간 월급은 고시의 209시간(roberin 은 365/7/12 = 208.57시간이라 4,423원 적다), 40시간·8시간 넘는 입력은 연장근로로 따로 뺀다.
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/labor-2026.json";
import { hourlyWagePay, hourlyFromMonthly, minimumMonthly } from "../labor";

const pick = (x: ReturnType<typeof hourlyWagePay>) => [x.daily, x.weekBase, x.weekHoliday, x.weekTotal, x.monthly, x.annual];

describe("시급 → 일급·주급·월급", () => {
  it("4시간 × 3일(주 12시간)은 주휴 0 — roberin 과 같음", () => {
    const x = hourlyWagePay(10_320, 4, 3);
    expect(x.holidayHours).toBe(0);
    expect(pick(x)).toEqual([41_280, 123_840, 0, 123_840, 538_114, 538_114 * 12]);
  });
  it("8시간 × 5일은 고시 월 환산액(209시간)", () => {
    const x = hourlyWagePay(10_320, 8, 5);
    expect(x.monthHours).toBe(r.minWage.monthlyHours);
    expect(pick(x)).toEqual([82_560, 412_800, 82_560, 495_360, r.minWage["2026"].monthly, r.minWage["2026"].monthly * 12]);
    expect(hourlyWagePay(10_700, 8, 5, true, 2027).monthly).toBe(r.minWage["2027"].monthly);
  });
  it("3시간 × 5일(정확히 15시간)은 주휴 3시간 — 제18조 ③ '미만'", () => {
    const x = hourlyWagePay(10_320, 3, 5);
    expect(x.holidayHours).toBe(3);
    expect(pick(x)).toEqual([30_960, 154_800, 30_960, 185_760, 807_171, 807_171 * 12]);
  });
  it("월급은 시급 × 월 시간을 한 번만 버린다(roberin 은 반올림 1,877,143)", () => {
    expect(hourlyWagePay(12_000, 6, 5).monthly).toBe(1_877_142);
  });
  it("40시간·8시간 넘는 시간은 소정근로에 넣지 않는다", () => {
    const six = hourlyWagePay(10_320, 8, 6);
    expect([six.weekHours, six.overHours, six.monthly]).toEqual([40, 8, r.minWage["2026"].monthly]);
    const ten = hourlyWagePay(10_320, 10, 5);
    expect([ten.dailyHours, ten.weekHours, ten.overHours]).toEqual([8, 40, 10]);
  });
  it("주휴를 빼면 주 시간 × 365/7 ÷ 12", () => {
    const x = hourlyWagePay(10_320, 8, 5, false);
    expect([x.weekHoliday, x.monthly]).toEqual([0, Math.floor((10_320 * 40 * 365) / 84)]);
  });
  it("최저임금 판정", () => {
    expect(hourlyWagePay(10_320, 8, 5).meetsMin).toBe(true);
    expect(hourlyWagePay(10_319, 8, 5).meetsMin).toBe(false);
    expect(hourlyWagePay(10_320, 8, 5, true, 2027).meetsMin).toBe(false);
  });
});

describe("월급 → 시급", () => {
  it("고시 월 환산액은 그해 최저시급", () => {
    expect(hourlyFromMonthly(r.minWage["2026"].monthly, 40)).toBe(10_320);
    expect(hourlyFromMonthly(minimumMonthly(2026, 20), 20)).toBe(10_320);
  });
  it("0시간은 0", () => {
    expect(hourlyFromMonthly(1_000_000, 0)).toBe(0);
  });
});
