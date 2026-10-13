/**
 * 취득세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/local-tax-2026.json";
import x from "../../rates/acquisition-extra-2026.json";
import { acquisitionSeries } from "../../data/series/acquisition";
import { acquisitionTotal } from "../acquisition-total";
import { eokwon } from "../won";

const A = r.acquisitionTax;
const S = A.standard;
const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const land = acquisitionTotal(100_000_000, "land");
const percents = new Set([
  pct(A.housePaid.under.rate), pct(A.housePaid.over.rate), `1~${pct(A.housePaid.over.rate)}`,
  pct(S.paidOther), pct(S.paidFarm), pct(S.gift), pct(S.inheritanceOther), pct(S.original),
  pct(land.total / 100_000_000), pct(land.edu / 100_000_000), pct((land.rural ?? 0) / 100_000_000),
  pct(A.localEducationTax.rate), // 지방교육세 20%
  `${Math.round((x.baseRate + x.surchargeBaseRate * x.surcharge.two) * 100)}~${pct(x.baseRate + x.surchargeBaseRate * x.surcharge.four)}`,
]);
const money = new Set([eokwon(A.housePaid.under.upTo), eokwon(A.housePaid.over.from), eokwon(x.firstHome.general)]);
const counts = new Set([`${A.deadline.generalDays}일`, `${A.deadline.giftMonths}개월`, `${x.rural.nationalSize}㎡`]);

describe("취득세 시리즈 제목·설명", () => {
  it("토지·상가 합계는 4.6%", () => expect(pct(land.total / 100_000_000)).toBe("4.6%"));

  for (const s of [acquisitionSeries.hub, ...acquisitionSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+억원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.])\d+(?:일|개월|㎡)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
