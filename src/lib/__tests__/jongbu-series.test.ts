/**
 * 종부세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 숫자가 rates 와 어긋나지 않는지 여기서 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/comprehensive-property-2026.json";
import { jongbuSeries } from "../../data/series/jongbu";
import { eokwon } from "../won";

const pct = (v: number) => `${(v * 100).toFixed(1).replace(/\.0$/, "")}%`;
const A = r.rates.upTo2Homes.brackets;
const B = r.rates.from3Homes.brackets;
const money = new Set(
  [r.taxBase.deduction.oneHouseholdOneHome, r.taxBase.deduction.other, r.rates.sameUntil, r.land.comprehensive.threshold,
    r.land.separate.threshold, r.installment.tiers[0].over].map(eokwon),
);
const other = new Set([
  pct(r.taxBase.ratio), pct(r.oneHomeCredit.cap), pct(r.ruralTax.rate), pct(A[0].rate), pct(A[A.length - 1].rate),
  pct(B[B.length - 1].rate), pct(r.corporation.upTo2Homes), pct(r.corporation.from3Homes),
  `${r.oneHousehold.deemed.temporaryTwoHomes.adjustedToAdjusted}년`, `${r.oneHousehold.deemed.temporaryTwoHomes.other}년`,
]);

describe("종부세 시리즈 제목·설명", () => {
  for (const s of [jongbuSeries.hub, ...jongbuSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+억[\d,]*천?만원|[\d,]+억원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%|(?<![월일\d])\d+년(?![\s\d]*\d+월)/g)) {
        if (/^20\d\d년$/.test(m[0])) continue; // 연도는 아래에서 날짜로 본다
        expect(other, m[0]).toContain(m[0]);
      }
    });
  }

  it("날짜", () => {
    const pay = readFileSync("src/pages/guide/jongbu-payment/index.astro", "utf-8");
    expect(r.payment.from).toBe("12월 1일");
    expect(pay).toContain("12월 1일부터 15일까지");
    const reform = readFileSync("src/pages/guide/jongbu-reform/index.astro", "utf-8");
    expect(r.oneHousehold.deemed.temporaryTwoHomes.from).toBe("2026-08-04");
    expect(reform).toContain("2026년 8월 4일 이후");
    expect(r.exclusionReport.period).toContain("9월 16일부터 9월 30일까지");
  });
});
