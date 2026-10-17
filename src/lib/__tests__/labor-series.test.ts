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
  it("1주·월 평균 근무 임금 — 주 20시간 206,400원·월 896,857원, 1주 합계 247,680원", () => {
    const x = weeklyHolidayPay(m26, 20);
    expect([x.base, x.monthlyBase, x.weekTotal, x.monthly]).toEqual([206_400, 896_857, 247_680, 179_371]);
  });
  it("개근하지 않은 주는 주휴 0원(시행령 제30조 제1항), 근무 임금은 그대로", () => {
    const x = weeklyHolidayPay(m26, 20, false);
    expect([x.hours, x.weekly, x.base, x.hourlyWithHoliday]).toEqual([0, 0, 206_400, m26]);
  });
  it("40시간 넘게 넣어도 소정근로 임금은 40시간분(제50조 제1항)", () => {
    expect(weeklyHolidayPay(m26, 45).base).toBe(412_800);
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
const A = r.annualLeave;
const W = r.weeklyHoliday;
const counts = new Set([
  `${W.minWeeklyHours}시간`, `${W.maxWeeklyHours}시간`, "20시간", `${weeklyHolidayHours(20)}시간`, `${r.wageClaimYears}년`, "5일",
  `${A.monthly}일`, `${A.full}일`, `${A.cap}일`, `${A.firstYearMax}일`, `${A.addEvery}년`, "5명", "80%", `${A.full}~${A.cap}일`, `${r.year}년`, "1년",
]);

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
