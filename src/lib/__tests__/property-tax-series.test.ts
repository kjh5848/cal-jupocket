/**
 * 재산세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·날짜가 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/local-tax-2026.json";
import x from "../../rates/property-extra-2026.json";
import { propertyTaxSeries } from "../../data/series/property-tax";
import { bill } from "../property-tax";
import { eokwon } from "../won";

const P = r.propertyTax;
const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const H = P.rates.house.brackets;
const O = P.rates.houseOneHome.brackets;
const one = P.taxBase.houseOneHouseholdOneHome2026;
const ex = bill({ standardValue: 300_000_000, kind: "house", oneHome: true }).total;
const manCheon = (v: number) => `${Math.floor(v / 10_000)}만${(v % 10_000).toLocaleString("ko-KR")}원`;

const percents = new Set([
  pct(P.taxBase.ratios.house), `${Math.round(one[0].ratio * 100)}~${pct(one[2].ratio)}`,
  `${+(H[0].rate * 100).toFixed(2)}~${pct(H[3].rate)}`, `${+(O[0].rate * 100).toFixed(2)}~${pct(O[3].rate)}`,
  pct(P.localEducationTax.rate),
]);
const money = new Set([eokwon(x.installment.over), eokwon(x.inKind.over), eokwon(300_000_000), manCheon(ex)]);
const dates = new Set(["6월 1일", "6월 2일", "7월 16~31일", "9월 16~30일"]);
const counts = new Set([`${x.installment.months}개월`, `${P.noticeBeforeDays}일`, `${x.deferral.age}세`]);

describe("재산세 시리즈 제목·설명", () => {
  it("과세기준일·납기가 rates 와 같다", () => {
    expect(P.assessmentDate).toBe("6월 1일");
    expect(P.periods.find((p) => p.subject.startsWith("주택 (연"))!.from).toBe("7월 16일");
    expect(P.periods.find((p) => p.subject.startsWith("주택 (나"))!.to).toBe("9월 30일");
  });
  it("공시가격 3억원 1세대 1주택 = 11만8,800원", () => expect(manCheon(ex)).toBe("11만8,800원"));

  for (const s of [propertyTaxSeries.hub, ...propertyTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+(?:~[\d.]+)?%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+만[\d,]+원|[\d,]+억원|[\d,]+천만원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      const rest = head.replace(/\d+월 \d+(?:~\d+)?일/g, (d) => { expect(dates, d).toContain(d); return ""; });
      for (const m of rest.matchAll(/(?<![\d,.])\d+(?:개월|일|세(?!대))(?![\d])/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
