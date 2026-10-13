/**
 * 성실신고 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율·날짜가 diligent-filer-2026.json 과 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/diligent-filer-2026.json";
import { diligentSeries } from "../../data/series/diligent";
import { diligentPenalty, diligentCostCredit, isDiligentTarget } from "../diligent-filer";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const percents = new Set([pct(r.costCredit.rate), pct(r.medicalEdu.rate), pct(r.penalty.rate), pct(r.penalty.revenueRate)]);
const money = new Set([
  ...r.threshold.groups.map((g) => eokwon(g.amount)), "15억", "7억5천만", "5억원",
  eokwon(r.costCredit.cap), eokwon(r.standardCredit.diligentBusiness), eokwon(r.standardCredit.other),
]);

describe("성실신고 계산", () => {
  it("기준 금액은 이상(>=)", () => {
    expect(isDiligentTarget(1_500_000_000, 0)).toBe(true);
    expect(isDiligentTarget(1_499_999_999, 0)).toBe(false);
    expect(isDiligentTarget(500_000_000, 2)).toBe(true);
  });
  it("가산세 = max(산출세액×비중×5%, 수입금액×0.02%)", () => {
    expect(diligentPenalty({ computedTax: 50_000_000, businessIncome: 1, totalIncome: 1, revenue: 1_000_000_000 })).toBe(2_500_000);
    expect(diligentPenalty({ computedTax: 0, businessIncome: 1, totalIncome: 1, revenue: 800_000_000 })).toBe(160_000);
    expect(diligentPenalty({ computedTax: 10_000_000, businessIncome: 3, totalIncome: 2, revenue: 0 })).toBe(500_000);
  });
  it("확인비용 공제 60%, 120만원 한도", () => {
    expect(diligentCostCredit(1_000_000)).toBe(600_000);
    expect(diligentCostCredit(3_000_000)).toBe(1_200_000);
  });
});

describe("성실신고 시리즈 제목·설명", () => {
  for (const s of [diligentSeries.hub, ...diligentSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+억(?:\d+천만)?(?:원)?|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+월 \d+일/g)) expect([`${r.deadline.to}`]).toContain(m[0]);
    });
  }
});
