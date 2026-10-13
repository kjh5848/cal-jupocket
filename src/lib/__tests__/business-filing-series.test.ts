/**
 * 사업자 신고 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율·날짜가 rates 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/business-filing-2026.json";
import vp from "../../rates/vat-penalty-2026.json";
import { businessFilingSeries } from "../../data/series/business-filing";
import { eokwon } from "../won";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const money = new Set([
  eokwon(r.eInvoice.individualThreshold), eokwon(r.simplified.threshold), eokwon(r.simplified.rentalOrEntertainmentLimit),
  eokwon(r.cashReceipt.mandatoryOver), `${r.cashReceipt.minimumAmount}원`,
]);
const percents = new Set([pct(vp.taxInvoice.notIssuedException), pct(r.cashReceipt.penaltyMandatory)]);
const days = new Set([
  `${r.cashReceipt.selfIssueDays}일`, "10일", "25일", "1일", // 10일 = 다음 달 10일(제34조 제3항), 25일 = 폐업 확정신고, 1일 = 7월 1일
]);

describe("사업자 신고 시리즈 제목·설명", () => {
  it("rates 문장에 날짜 기준이 실제로 있다", () => {
    expect(r.eInvoice.startFrom).toContain("7월 1일");
    expect(r.simplified.period).toContain("7월 1일");
    expect(r.closure.finalReturn).toContain("25일");
  });

  for (const s of [businessFilingSeries.hub, ...businessFilingSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+억[\d,]*만원|[\d,]+억원|[\d,]+천[\d,]*만원|[\d,]+만원|(?<![\d,만천억])\d+원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,])\d+일/g)) expect(days, m[0]).toContain(m[0]);
    });
  }
});
