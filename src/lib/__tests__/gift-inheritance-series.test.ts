/**
 * 증여세·상속세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율·기간이 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import g from "../../rates/gift-2026.json";
import ih from "../../rates/inheritance-2026.json";
import { giftSeries, inheritanceSeries } from "../../data/series/gift-inheritance";
import { eokwon } from "../won";

const item = (k: string) => g.relationDeduction.items.find((i) => i.key === k)!;
const money = new Set([
  ...g.brackets.filter((b) => b.upTo).map((b) => eokwon(b.upTo!)),
  eokwon(item("spouse").amount), eokwon(item("ascendant").amount), eokwon(item("ascendant").minorAmount!), eokwon(g.marriageBirthDeduction.amount),
  eokwon(g.installment.over), eokwon(g.yearlyInstallment.over), eokwon(g.priorGiftAggregation.threshold), eokwon(g.minimumBase.amount),
  eokwon(ih.lumpSum.amount), eokwon(ih.spouse.minimum), eokwon(ih.basicDeduction.amount), eokwon(ih.otherPersonal.child),
  eokwon(ih.otherPersonal.minorPerYear), eokwon(ih.lumpSum.amount + ih.spouse.minimum), eokwon(ih.deductionLimit.giftAddThreshold),
]);
const pct = (v: number) => `${Math.round(v * 100)}%`;
const percents = new Set([...g.brackets.map((b) => pct(b.rate)), pct(g.filingCredit.rate), pct(g.generationSkip.rate)]);
const periods = new Set([`${g.deadline.months}개월`, `${ih.deadline.months}개월`, `${ih.deadline.monthsNonResident}개월`, `${g.priorGiftAggregation.windowYears}년`]);

describe("증여세·상속세 시리즈 제목·설명", () => {
  for (const s of [giftSeries, inheritanceSeries].flatMap((x) => [x.hub, ...x.items])) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const head = (src.match(/^const title = "([^"]+)";/m)?.[1] ?? "") + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+억[\d,]*천?만원|[\d,]+억원|[\d,]+천만원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d월])\d+개월|(?<![\d,월])\d+년(?= 동안| 안)/g)) expect(periods, m[0]).toContain(m[0]);
    });
  }

  it("세율표는 증여·상속이 같다(제56조)", () => expect(g.brackets).toEqual(ih.brackets));
  it("상속 rates 의 '조문 대조 못 함' 항목은 2026-10-13 원문 대조로 지웠다", () =>
    expect(ih.notVerified.join(" ")).not.toMatch(/조문 번호와의 대조/));
});
