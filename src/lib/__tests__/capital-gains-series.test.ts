/**
 * 양도소득세 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액·비율·기간·날짜가 rates 와 계산 함수에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/capital-gains-2026.json";
import tr from "../../rates/2026.json";
import { capitalGainsSeries } from "../../data/series/capital-gains";
import { overseasStockTax, preliminaryDue } from "../capital-gains";
import { eokwon } from "../won";

const R = r.rates;
const LT = r.longTermDeduction;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const pp = (v: number) => `${Math.round(v * 100)}%p`;
const first = tr.incomeTaxBrackets[0].rate;
const last = tr.incomeTaxBrackets[tr.incomeTaxBrackets.length - 1].rate;
const md = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

const money = new Set([
  eokwon(r.exemption.highPrice), eokwon(r.basicDeduction.amount), eokwon(r.filing.installment.over),
  eokwon(r.farmland.annualCap), eokwon(r.farmland.fiveYearCap), eokwon(R.shares.majorBrackets[0].upTo!),
  eokwon(r.majorShareholder.kospi.value), eokwon(overseasStockTax(r.filing.installment.over).total),
]);
const percents = new Set([
  `${pct(first)}~${pct(last).slice(0, -1)}%`.replace(/%~/, "~"),
  `${pct(first + R.nonBusinessLand.add)}~${pct(last + R.nonBusinessLand.add)}`.replace(/%~/, "~"),
  pct(R.shortTerm.houseUnder1), pct(R.shortTerm.house1to2), pct(R.shortTerm.otherUnder1), pct(R.shortTerm.other1to2),
  pct(LT.table1.start), pct(LT.table1.max), pct(LT.table2.holdMax), pct(LT.table2.holdMax + LT.table2.resideMax),
  pct(r.farmland.rate), pct(R.shares.majorBrackets[0].rate), pct(R.shares.majorBrackets[1].rate),
  pct(r.majorShareholder.kospi.ratio), pct(r.majorShareholder.kosdaq.ratio), pct(r.majorShareholder.konex.ratio),
  pct(R.shares.overseasOther), pct(R.shares.overseasOther * r.localTax.ratio), pct(R.shares.overseasOther * (1 + r.localTax.ratio)),
  pp(R.nonBusinessLand.add), pp(R.multiHome.twoHomesAdd), pp(R.multiHome.threeHomesAdd), pp(LT.table1.perYear),
  `${Math.round(R.multiHome.twoHomesAdd * 100)}~${pp(R.multiHome.threeHomesAdd)}`,
]);
const years = new Set([
  r.exemption.holdYears, r.exemption.residenceYearsIfAdjusted, r.temporaryTwoHomes.afterYears, r.temporaryTwoHomes.sellWithinAdjusted,
  r.temporaryTwoHomes.sellWithinOther, LT.minYears, LT.table1.maxYears, r.farmland.years,
  5, // 제133조 '5개 과세기간' — fiveYearCap 의 기간
].map((n) => `${n}년`));
const months = new Set([`${r.filing.preliminary.realEstateMonths}개월`, `${r.filing.installment.months}개월`]);
const dates = new Set([
  md(new Date(r.rates.multiHome.graceEndDate + "T00:00:00Z")), "9월 30일", // 시행령 개정일(lawVersion 의 2026. 9. 30.)
  md(preliminaryDue(2026, 10, "realEstate")), md(preliminaryDue(2026, 3, "shares")), "5월 1일", // 제110조 확정신고 시작일
]);

describe("양도소득세 시리즈 제목·설명", () => {
  it("lawVersion 에 9월 30일 개정 시행령이 적혀 있다", () => expect(r.lawVersion).toContain("2026. 9. 30."));
  it("확정신고는 5월 1일부터", () => expect(r.filing.final.rule).toContain("5월 1일"));

  for (const s of [capitalGainsSeries.hub, ...capitalGainsSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head.length).toBeGreaterThan(40);
      for (const m of head.matchAll(/[\d,]+억[\d,]*천?만원|[\d,]+억원|[\d,]+천만원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+(?:~\d+)?%p?/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,])\d{1,2}년/g)) expect(years, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<![\d,])\d+개월/g)) expect(months, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/\d+월 \d+일/g)) expect(dates, m[0]).toContain(m[0]);
    });
  }
});
