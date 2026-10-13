/**
 * 의료비·교육비·기부금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/special-credit-2026.json";
import y from "../../rates/year-end-2026.json";
import { medicalCreditSeries, educationCreditSeries, donationCreditSeries } from "../../data/series/special-credit";
import { hometownCredit } from "../special-credit";
import { eokwon, won } from "../won";

const M = r.medical, E = r.education, D = r.donation, L = D.generalLimit;
const money = new Set([
  ...[M.generalCap, M.scope.glassesCap, M.scope.postnatalCap, E.caps.university, E.caps.school, E.items.uniformCap, E.items.fieldTripCap,
    D.highFrom, y.calc.standardTaxCredit.amount, 100_000, 200_000, 20_000_000].map(eokwon),
  won(hometownCredit(100_000)), won(hometownCredit(200_000)),
]);
const pct = (v: number) => `${Math.round(v * 100)}%`;
const percents = new Set([
  pct(M.thresholdRate), pct(M.rates.general), pct(M.rates.premature), pct(M.rates.infertility), pct(D.rate), pct(D.highRate),
  pct(L.religiousRate), pct(L.otherRate), pct(L.nonReligiousRate), "40%", "100%",
]);

describe("특별세액공제 시리즈 제목·설명", () => {
  for (const s of [medicalCreditSeries, educationCreditSeries, donationCreditSeries].flatMap((x) => [x.hub, ...x.items])) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+천만원|[\d,]+만원|(?<![\d,])\d{1,3}(?:,\d{3})+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+%/g)) expect(percents, m[0]).toContain(m[0]);
    });
  }

  it("고향사랑 40% 구간과 교육비 개정 시점은 rates 에서 온다", () => {
    expect(r.hometown.tiers[1].rate).toBe(0.4);
    expect(r.education.amended.applies).toContain("2026. 1. 1.");
    expect(D.carryover.years).toBe(10);
  });
});
