/**
 * 사업자등록·법인세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액·기간·날짜가 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import br from "../../rates/business-registration-2026.json";
import ct from "../../rates/corporate-tax-2026.json";
import vp from "../../rates/vat-penalty-2026.json";
import bf from "../../rates/business-filing-2026.json";
import { businessRegistrationSeries } from "../../data/series/business-registration";
import { corporateTaxSeries } from "../../data/series/corporate-tax";
import { corporateDeadline, prepayDeadline } from "../corporate-tax";
import { eokwon } from "../won";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const md = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
const percents = new Set([
  pct(vp.registration.lateRegistration), ...ct.brackets.map((b) => pct(b.rate)), `${Math.round(ct.raise.by * 100)}%p`,
  pct(ct.taxBase.lossCap), "100%", // 중소기업 이월결손금 100%(제13조 제1항 단서)
]);
const money = new Set([
  eokwon(bf.simplified.threshold), eokwon(ct.brackets[0].upTo!), eokwon(ct.brackets[1].upTo!), eokwon(ct.prepay.smeExempt),
]);
const counts = new Set([
  `${br.apply.days}일`, `${br.issue.days}일`, `${br.issue.extendDays}일`, `${br.corporate.months}개월`,
  `${ct.filing.months}개월`, `${ct.filing.monthsDiligent}개월`, `${ct.prepay.months}개월`, "6개월", `${ct.taxBase.lossYears}년`,
]);
const dates = new Set([md(corporateDeadline(2026, 12)), md(corporateDeadline(2026, 12, true)), md(prepayDeadline(2026, 1)), "1월 1일"]);

describe("사업자등록·법인세 시리즈 제목·설명", () => {
  it("12월 결산 3월 31일·4월 30일, 중간예납 8월 31일", () => {
    expect(md(corporateDeadline(2026, 12))).toBe("3월 31일");
    expect(md(prepayDeadline(2026, 1))).toBe("8월 31일");
  });
  it("인상 시행일은 2026년 1월 1일", () => expect(ct.raise.from).toBe("2026-01-01"));

  for (const s of [businessRegistrationSeries.hub, ...businessRegistrationSeries.items, corporateTaxSeries.hub, ...corporateTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d+%p?/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+억[\d,]*만원|[\d,]+억원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      const rest = head.replace(/\d+월 \d+일/g, (d) => { expect(dates, d).toContain(d); return ""; });
      for (const m of rest.matchAll(/(?<![\d,.])\d+(?:개월|일|년)(?![\d])/g)) {
        if (/^20\d\d년$/.test(m[0])) continue;
        expect(counts, m[0]).toContain(m[0]);
      }
    });
  }
});
