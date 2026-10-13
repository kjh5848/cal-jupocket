/**
 * 지방세(주민세·지방소득세) 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율·날짜가 rates 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/local-tax-2026.json";
import x from "../../rates/local-extra-2026.json";
import { localTaxSeries } from "../../data/series/local-tax";
import { eokwon } from "../won";

const L = r.localIncomeTax;
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;
const money = new Set([eokwon(r.residentTax.rateCap), eokwon(x.business.individual), `${x.business.perSqm}원`, eokwon(L.installment.over)]);
const percents = new Set([pct(x.employee.rate), `${pct(L.brackets[0].rate).slice(0, -1)}~${pct(L.brackets[L.brackets.length - 1].rate)}`, pct(x.localIncome.specialRatio)]);
const days = new Set(["16일", "31일", "1일"]); // 개인분 8월 16~31일(local-tax-2026), 사업소분 8월 1~31일
const sqm = new Set([`${x.business.areaExempt}㎡`]);

describe("지방세 시리즈 제목·설명", () => {
  it("개인분 납기는 8월 16일~31일, 사업소분은 8월 1일~31일", () => {
    expect(r.residentTax.from).toBe("8월 16일");
    expect(r.residentTax.to).toBe("8월 31일");
    expect(x.business.from).toBe("8월 1일");
  });

  for (const s of [localTaxSeries.hub, ...localTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+만원|(?<![\d,만])\d+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.])\d+일/g)) expect(days, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+㎡/g)) expect(sqm, m[0]).toContain(m[0]);
    });
  }
});
