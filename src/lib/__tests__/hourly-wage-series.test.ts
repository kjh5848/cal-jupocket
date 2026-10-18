/**
 * 시급 계산 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자가 labor-2026.json(2026·2027 고시, 제18조 ③ 15시간, 제50조 40시간)과 hourlyWagePay() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/labor-2026.json";
import { hourlyWageSeries } from "../../data/series/hourly-wage";
import { hourlyWagePay, minWage } from "../labor";
import { won } from "../won";

const allowed = new Set([
  won(minWage(2026)),
  won(r.minWage["2026"].monthly),
  won(r.minWage["2027"].monthly),
  won(hourlyWagePay(minWage(2026), 8, 5).monthly),
  `${r.minWage.monthlyHours}시간`,
  `${r.weeklyHoliday.minWeeklyHours}시간`,
  `${r.weeklyHoliday.maxWeeklyHours}시간`,
  "2026년",
  "2027년",
  "365",
  "7",
  "12",
]);

describe("시급 계산 시리즈 제목·설명", () => {
  it("주 40시간 최저시급 월급 = 고시 월 환산액", () => {
    expect(hourlyWagePay(minWage(2026), 8, 5).monthly).toBe(r.minWage["2026"].monthly);
  });

  for (const s of [hourlyWageSeries.hub, ...hourlyWageSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      // 금액·시간·연도·식의 숫자(365 ÷ 7 ÷ 12)만 남는다 — 각각 rates 에서 나온 값이어야 한다
      for (const m of head.matchAll(/\d[\d,]*(?:원|시간|년)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
    });
  }
});
