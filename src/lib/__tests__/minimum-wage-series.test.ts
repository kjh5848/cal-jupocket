/**
 * 최저임금 시리즈 — 제목·설명의 금액·비율이 labor-2026.json(2026·2027 고시)과 labor.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/labor-2026.json";
import { minimumWageSeries } from "../../data/series/minimum-wage";
import { checkMinWage, minimumMonthly, minWage, weeklyHolidayPay } from "../labor";
import { won } from "../won";

describe("최저임금 계산", () => {
  it("주 40시간 월급 = 고시 월 환산액", () => {
    expect(minimumMonthly(2026)).toBe(r.minWage["2026"].monthly);
    expect(minimumMonthly(2027)).toBe(r.minWage["2027"].monthly);
  });
  it("수습 90%, 월 210만원은 10,047원·56,880원 부족", () => {
    expect(minimumMonthly(2026, 40, true)).toBe(Math.floor(10_320 * 0.9) * 209);
    const x = checkMinWage(2_100_000);
    expect([x.hourly, x.ok, x.shortfall]).toEqual([10_047, false, 56_880]);
  });
});

const m26 = minWage(2026);
const m27 = minWage(2027);
const money = new Set([
  won(m26), won(m27), won(r.minWage["2026"].monthly), won(r.minWage["2027"].monthly), won(r.minWage["2027"].monthly * 12),
  won(m27 - m26), won(weeklyHolidayPay(m27, 40).hourlyWithHoliday), won(checkMinWage(2_100_000).hourly), "210만원",
]);
const pcts = new Set(["90%", `${(((m27 - m26) / m26) * 100).toFixed(1)}%`]);

describe("최저임금 시리즈 제목·설명", () => {
  for (const s of [minimumWageSeries.hub, ...minimumWageSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+(?:만)?원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
    });
  }
});
