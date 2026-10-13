/**
 * 원천세·지급명세서 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/withholding-tax-2026.json";
import it2 from "../../rates/income-tax-rate-2026.json";
import { withholdingTaxSeries } from "../../data/series/withholding-tax";
import { dailyWorkerTaxFreeMax } from "../withholding-tax";

const pct = (v: number) => `${+(v * 100).toFixed(3)}%`;
const N = r.penalty;
const D = r.daily;
const free = dailyWorkerTaxFreeMax();
const manCheon = (v: number) => `${Math.floor(v / 10_000)}만${(v % 10_000) / 1_000}천원`;

const percents = new Set([
  pct(N.lateBase), pct(N.lateDaily), pct(N.lateCap), pct(N.statementNone), pct(N.statementNoneWithin3m),
  pct(N.dailyNone), pct(N.dailyNoneWithin1m), pct(N.simplifiedNone),
  pct(D.rate), pct(D.creditRate), pct(D.rate * (1 - D.creditRate)),
  pct(it2.business.rate * (1 + it2.business.localRatio)), // 3.3%
]);
const money = new Set([`${D.deductionPerDay / 10_000}만원`, manCheon(free), `${D.minimum / 1_000}천원`, "0원"]);
const counts = new Set([`${r.payment.monthlyDay}일`, `${r.payment.halfYearStaff}명`, "1개월", "3개월", "1일"]);

describe("원천세 시리즈 제목·설명", () => {
  it("소득세가 처음 붙는 일급은 18만7천원", () => expect(manCheon(free)).toBe("18만7천원"));
  it("3개월·1개월은 가산세 감면 기간이다", () => {
    expect(N.rule).toContain("3개월");
    expect(N.rule).toContain("1개월");
  });

  for (const s of [withholdingTaxSeries.hub, ...withholdingTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+만\d천원|[\d,]+만원|\d+천원|(?<![\d,만천])\d+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,.월])\d+(?:개월|일|명)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
