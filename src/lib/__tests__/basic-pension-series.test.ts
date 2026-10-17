/**
 * 기초연금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 금액이 basic-pension-2026.json(보건복지부고시 제2026-156호)과 basic-pension.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/basic-pension-2026.json";
import { basicPensionSeries } from "../../data/series/basic-pension";
import { basicPension, propertyIncome, propertySteps, workIncome, npsFullUpTo, npsFloor } from "../basic-pension";
import { won, eokwon } from "../won";

describe("기초연금 계산", () => {
  it("2026 기준연금액 349,700원, 부부 각 279,760원", () => {
    expect(basicPension({ recognized: 0, couple: false }).total).toBe(349_700);
    expect(basicPension({ recognized: 0, couple: true }).each).toBe(279_760);
  });
  it("선정기준액 247만원 초과면 대상 아님, 경계에서는 최소 10%(34,970원)", () => {
    expect(basicPension({ recognized: 2_470_001, couple: false }).eligible).toBe(false);
    expect(basicPension({ recognized: 2_470_000, couple: false }).total).toBe(34_970);
    expect(basicPension({ recognized: 2_300_000, couple: false }).total).toBe(170_000);
  });
  it("재산 환산(대도시 3억·예금 5천만원 → 월 650,000원), 근로 200만원 → 588,000원", () => {
    expect(propertyIncome({ general: 300_000_000, financial: 50_000_000, region: "metro" })).toBe(650_000);
    expect(workIncome(2_000_000)).toBe(588_000);
  });
  it("국민연금 150% 경계 524,550원, 바닥 174,850원", () => {
    expect([npsFullUpTo(), npsFloor()]).toEqual([524_550, 174_850]);
  });
});

// 새 틀 영수증 — 법 제8조 ①·②, 시행령 제11조, 시행규칙 제4조 손계산(2026-10-17)
describe("기초연금 영수증 손계산", () => {
  it("혼자·소득인정액 0 → 기준연금액 그대로, 남은 금액 247만원", () => {
    expect(basicPension({ recognized: 0, couple: false })).toMatchObject({ baseTotal: 349_700, coupleCut: 0, reversalCut: 0, total: 349_700, room: 2_470_000 });
  });
  it("혼자·230만원 → 349,700 − 179,700 = 170,000(선정기준액 − 소득인정액)", () => {
    expect(basicPension({ recognized: 2_300_000, couple: false })).toMatchObject({ baseTotal: 349_700, reversalCut: 179_700, total: 170_000 });
  });
  it("부부·350만원 → 699,400 − 부부 139,880 − 107,520 = 452,000(각 226,000)", () => {
    expect(basicPension({ recognized: 3_500_000, couple: true })).toMatchObject({ baseTotal: 699_400, coupleCut: 139_880, reversalCut: 107_520, total: 452_000, each: 226_000 });
  });
  it("부부·선정기준액 정확히 → 최소 20% 69,940원, 1원 넘으면 대상 아님(넘은 금액 1원)", () => {
    expect(basicPension({ recognized: 3_952_000, couple: true })).toMatchObject({ coupleCut: 139_880, reversalCut: 489_580, total: 69_940 });
    expect(basicPension({ recognized: 3_952_001, couple: true })).toMatchObject({ eligible: false, room: -1, coupleCut: 0, reversalCut: 0, total: 0 });
  });
  it("재산 단계 — 대도시 3억·예금 5천만 → 1억6,500만 + 3,000만, 부채 3억은 남은 재산 1억9,500만까지만", () => {
    expect(propertySteps({ general: 300_000_000, financial: 50_000_000, region: "metro" })).toEqual({ basic: 135_000_000, general: 165_000_000, financial: 30_000_000, debtUsed: 0, net: 195_000_000 });
    expect(propertySteps({ general: 300_000_000, financial: 50_000_000, debt: 300_000_000, region: "metro" })).toMatchObject({ debtUsed: 195_000_000, net: 0 });
    expect(propertySteps({ general: 50_000_000, financial: 10_000_000, region: "rural" })).toMatchObject({ general: 0, financial: 0, net: 0 });
  });
  it("항등식 — 기준연금액 − 부부 감액 − 선정기준액 감액 = 받는 금액(무작위 2만 건)", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let i = 0; i < 20_000; i++) {
      const couple = rnd() < 0.5;
      const x = basicPension({ recognized: Math.floor(rnd() * 4_200_000), couple });
      if (x.eligible) expect(x.baseTotal - x.coupleCut - x.reversalCut).toBe(x.total);
      else expect(x.total).toBe(0);
    }
  });
});

const money = new Set([
  won(r.basePension), won(279_760), won(npsFullUpTo()), won(npsFloor()),
  eokwon(r.selection.single), eokwon(r.selection.couple), `${Math.floor(r.selection.couple / 10_000)}만${(r.selection.couple % 10_000) / 1000}천원`, eokwon(r.property.basic.metro), eokwon(r.property.financialDeduction),
]);

describe("기초연금 시리즈 제목·설명", () => {
  for (const s of [basicPensionSeries.hub, ...basicPensionSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/(?:\d+억)?[\d,]+(?:만(?:[\d,]+천)?)?원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
