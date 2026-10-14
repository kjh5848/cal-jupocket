/**
 * 주휴수당·연차 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·시간·일수가 labor-2026.json 과 labor.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/labor-2026.json";
import { weeklyHolidaySeries } from "../../data/series/weekly-holiday";
import { annualLeaveSeries } from "../../data/series/annual-leave";
import {
  weeklyHolidayPay, weeklyHolidayHours, annualLeaveDays, firstYearLeaveDays, leaveSchedule,
  annualLeavePay, hourlyFromMonthly40, partTimeLeaveHours, minWage,
} from "../labor";
import { won, eokwon } from "../won";

const m26 = minWage(2026);
const daily300 = hourlyFromMonthly40(3_000_000) * 8;

describe("최저임금 고시", () => {
  it("2026 10,320원·월 2,156,880원, 2027 10,700원·월 2,236,300원 = 시급 × 209", () => {
    expect(r.minWage["2026"].hourly * r.minWage.monthlyHours).toBe(r.minWage["2026"].monthly);
    expect(r.minWage["2027"].hourly * r.minWage.monthlyHours).toBe(r.minWage["2027"].monthly);
  });
});

describe("주휴수당", () => {
  it("15시간 미만 0, 40시간 넘으면 40시간으로", () => {
    expect(weeklyHolidayHours(14.5)).toBe(0);
    expect(weeklyHolidayHours(15)).toBe(3);
    expect(weeklyHolidayHours(48)).toBe(8);
  });
  it("2026 최저시급 주 40시간 82,560원, 주 20시간 41,280원, 포함 시급 12,384원", () => {
    expect(weeklyHolidayPay(m26, 40).weekly).toBe(82_560);
    expect(weeklyHolidayPay(m26, 20).weekly).toBe(41_280);
    expect(weeklyHolidayPay(m26, 20).hourlyWithHoliday).toBe(12_384);
  });
});

describe("연차", () => {
  it("근속별 일수(1·2년 15, 3년 16, 5년 17, 21년부터 25)", () => {
    expect([1, 2, 3, 4, 5, 20, 21, 30].map(annualLeaveDays)).toEqual([15, 15, 16, 16, 17, 24, 25, 25]);
    expect(firstYearLeaveDays(12)).toBe(11);
  });
  it("입사 2024-03-02 → 2026-10-14 는 근속 2년 7개월", () => {
    const x = leaveSchedule(new Date(2024, 2, 2), new Date(2026, 9, 14));
    expect([x.years, x.months % 12, x.thisYear]).toEqual([2, 7, 15]);
  });
  it("월급 300만원 5일 = 574,160원, 단시간 주 20시간 15일 = 60시간", () => {
    expect(annualLeavePay(daily300, 5)).toBe(574_160);
    expect(partTimeLeaveHours(15, 20)).toBe(60);
  });
});

const money = new Set([won(m26), won(82_560), won(41_280), won(12_384), won(574_160), eokwon(3_000_000)]);
const counts = new Set(["15시간", "40시간", "20시간", "4시간", "3년", "5일", "1일", "15일", "25일", "11일", "2년", "5명", "80%", "15~25일", "2026년", "1년"]);

describe("주휴수당·연차 시리즈 제목·설명", () => {
  for (const s of [weeklyHolidaySeries.hub, ...weeklyHolidaySeries.items, annualLeaveSeries.hub, ...annualLeaveSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.~])\d+(?:~\d+)?(?:시간|년|일|명|%)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
