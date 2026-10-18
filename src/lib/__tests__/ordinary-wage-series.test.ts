/**
 * 통상임금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자가 ordinary-wage-2026.json·labor-2026.json(주 40시간·209시간)에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import labor from "../../rates/labor-2026.json";
import { ordinaryWageSeries } from "../../data/series/ordinary-wage";
import { basisHours } from "../ordinary-wage";

const allowed = new Set([`${labor.minWage.monthlyHours}시간`, `${labor.weeklyHoliday.maxWeeklyHours}시간`, "1일", "1주", "1년", "12", "6" /* 시행령 제6조 */]);

describe("통상임금 시리즈 제목·설명", () => {
  it("rates 숫자", () => {
    expect(labor.minWage.monthlyHours).toBe(209);
    expect(basisHours({ weeklyHours: 40, dailyHours: 8 }).monthly).toBe(209);
  });

  for (const s of [ordinaryWageSeries.hub, ...ordinaryWageSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d[\d,.]*(?:%|배|시간|시|년|원|명|주|일)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
    });
  }
});
