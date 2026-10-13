/**
 * 세금 환급 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간·날짜가 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/tax-refund-2026.json";
import rf from "../../rates/refund-2026.json";
import it2 from "../../rates/income-tax-rate-2026.json";
import { taxRefundSeries } from "../../data/series/tax-refund";
import { incomeTaxRefundInterestStart } from "../tax-refund";
import { eokwon } from "../won";

const start = incomeTaxRefundInterestStart(2027);
const lastFree = new Date(start.getTime() - 86_400_000);
const md = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
const percents = new Set([`${+(rf.refundInterest.annualRate * 100).toFixed(2)}%`, `${+(it2.business.rate * 1.1 * 100).toFixed(2)}%`]);
const money = new Set([eokwon(r.offset.small)]);
const counts = new Set([`${r.payment.days}일`, `${r.limitation.years}년`, "1년"]);
const dates = new Set([md(start), md(lastFree), `${r.incomeTax.dueMonth}월 ${r.incomeTax.dueDay}일`]);

describe("세금 환급 시리즈 제목·설명", () => {
  it("5월 31일 + 30일 → 6월 30일, 기산일 7월 1일", () => {
    expect(md(lastFree)).toBe("6월 30일");
    expect(md(start)).toBe("7월 1일");
  });

  for (const s of [taxRefundSeries.hub, ...taxRefundSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+만원|[\d,]+억원/g)) expect(money, m[0]).toContain(m[0]);
      const noDates = head.replace(/\d+월 \d+일/g, (d) => { expect(dates, d).toContain(d); return ""; });
      for (const m of noDates.matchAll(/(?<![\d,.])\d+(?:일|년)(?!\d)/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
