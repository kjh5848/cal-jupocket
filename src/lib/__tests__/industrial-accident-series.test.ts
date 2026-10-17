/**
 * 산재 시리즈 — 휴업급여·장해급여 계산이 산재보험법 제52조·제54조·제55조·제57조, 별표 1·2,
 * 고용노동부고시 제2025-84호대로인지, 제목·설명의 숫자가 rates·계산 함수에서 나오는지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/industrial-accident-2026.json";
import labor from "../../rates/labor-2026.json";
import { industrialAccidentSeries } from "../../data/series/industrial-accident";
import { leavePayDaily, bandRange, disabilityPay, LOW_CAP } from "../industrial-accident";
import { won, manwon } from "../won";

describe("보상기준 금액", () => {
  it("2026 최고 268,299원 · 최저 82,560원 = 최저임금 시급 × 8(제36조 ⑦)", () => {
    expect(r.compensationBase.max).toBe(268_299);
    expect(r.compensationBase.min).toBe(82_560);
    expect(r.compensationBase.minWageDaily).toBe(labor.minWage["2026"].hourly * 8);
    expect(LOW_CAP).toBe(66_048);
  });
});

describe("휴업급여", () => {
  it("70% — 상한 268,299원 적용", () => {
    expect(leavePayDaily(130_434).daily).toBe(91_303);
    expect(leavePayDaily(300_000)).toMatchObject({ kind: "standard", avg: 268_299, daily: 187_809 });
  });
  it("저소득 — 90%가 66,048원 이하면 최저임금액 82,560원(제54조 ①②)", () => {
    expect(leavePayDaily(50_000)).toMatchObject({ kind: "floor", daily: 82_560 });
    expect(leavePayDaily(73_386)).toMatchObject({ kind: "floor", daily: 82_560 });
  });
  it("단서 구간 73,387~94,354원은 금액을 내지 않는다", () => {
    expect(bandRange()).toEqual([73_387, 94_354]);
    expect(leavePayDaily(73_387).daily).toBeNull();
    expect(leavePayDaily(94_354).daily).toBeNull();
    expect(leavePayDaily(94_355)).toMatchObject({ kind: "standard", daily: 66_048 });
  });
  it("61세 이후 별표 1 — 70% 수급자 66/70…50/70, 최저임금액 수급자 86/90…70/90, 제3호 하한", () => {
    expect(leavePayDaily(130_434, 63).daily).toBe(Math.floor(130_434 * 0.7 * 58 / 70));
    expect(leavePayDaily(60_000, 65).daily).toBe(Math.floor(82_560 * 70 / 90));
    expect(leavePayDaily(95_000, 65).daily).toBe(Math.floor(66_048 * 70 / 90)); // 66,500×50/70 < 제3호
    expect(leavePayDaily(130_434, 63, true).daily).toBe(91_303); // 시행령 제51조 2년 유예
  });
});

describe("휴업급여 나눠 보기 — 제52조·제54조 ②·별표 1 제1~3호 손계산", () => {
  it("70% — 130,434원 → 91,303원, 상한 300,000 → 268,299 × 70% = 187,809원", () => {
    expect(leavePayDaily(130_434)).toMatchObject({ byRate: 91_303, raise: 0, ageCut: 0, floorAdd: 0, daily: 91_303 });
    expect(leavePayDaily(300_000)).toMatchObject({ byRate: 187_809, daily: 187_809 });
  });
  it("저소득 — 50,000원 × 90% = 45,000원, 최저임금액까지 37,560원 보탬", () => {
    expect(leavePayDaily(50_000)).toMatchObject({ byRate: 45_000, raise: 37_560, daily: 82_560 });
  });
  it("63세 70% 수급자 — 91,303.8 × 58/70 = 75,651원, 줄어든 돈 15,652원", () => {
    expect(leavePayDaily(130_434, 63)).toMatchObject({ byRate: 91_303, ageCut: 15_652, floorAdd: 0, daily: 75_651 });
  });
  it("65세 95,000원 — 66,500 × 50/70 = 47,500 < 제3호 66,048 × 70/90 = 51,370 → 3,870원 보탬", () => {
    expect(leavePayDaily(95_000, 65)).toMatchObject({ byRate: 66_500, ageCut: 19_000, floorAdd: 3_870, daily: 51_370 });
  });
  it("65세 최저임금액 수급자 — 82,560 × 70/90 = 64,213원, 줄어든 돈 18,347원", () => {
    expect(leavePayDaily(60_000, 65)).toMatchObject({ byRate: 54_000, raise: 28_560, ageCut: 18_347, daily: 64_213 });
  });
  it("유예면 줄어든 돈 0", () => {
    expect(leavePayDaily(130_434, 63, true)).toMatchObject({ ageCut: 0, floorAdd: 0, daily: 91_303 });
  });
  it("무작위 2만 건 — 평균임금 × 비율 + 보탠 돈 − 줄어든 돈 + 제3호로 보탠 돈 = 1일 휴업급여", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
    for (let i = 0; i < 20_000; i++) {
      const p = leavePayDaily(Math.floor(rnd() * 320_000), 55 + Math.floor(rnd() * 15), rnd() < 0.2);
      if (p.daily === null) continue;
      expect(p.byRate + p.raise - p.ageCut + p.floorAdd).toBe(p.daily);
      expect(Math.min(p.raise, p.ageCut, p.floorAdd)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("휴업급여 글", () => {
  it("FAQ 가 단서 구간을 공단 확인으로 남긴다", () => {
    const src = readFileSync("src/pages/guide/industrial-accident-leave-pay/index.astro", "utf-8");
    expect(src).toContain("${won(bandLo)}~${won(bandHi)}은 상한과 겹쳐 공단 결정액을 확인하세요");
    expect(src).toContain('id="ia-grace"');
  });
});

describe("장해급여", () => {
  it("별표 2 일수", () => {
    expect(Object.values(r.disability.lumpDays)).toEqual([1474, 1309, 1155, 1012, 869, 737, 616, 495, 385, 297, 220, 154, 99, 55]);
    expect(Object.values(r.disability.annuityDays)).toEqual([329, 291, 257, 224, 193, 164, 138]);
  });
  it("평균임금 하한 82,560원 적용 — 14급 4,540,800원, 1~3급 연금만, 8급부터 일시금만", () => {
    expect(disabilityPay(50_000, 14)).toMatchObject({ avg: 82_560, lump: 4_540_800, way: "lump" });
    expect(disabilityPay(100_000, 12).lump).toBe(15_400_000);
    expect(disabilityPay(100_000, 3)).toMatchObject({ way: "annuity", lump: 0, annuityYear: 25_700_000 });
    expect(disabilityPay(100_000, 7).way).toBe("choice");
    expect(disabilityPay(1_000_000, 1).avg).toBe(268_299);
  });
});

const B = r.compensationBase;
const money = new Set([won(B.max), won(B.min), manwon(Math.floor(disabilityPay(0, 14).lump / 10_000) * 10_000)]);
const pcts = new Set(["70%"]);
const days = new Set(["1,474일분", "55일분"]);

describe("산재 시리즈 제목·설명", () => {
  for (const s of [industrialAccidentSeries.hub, ...industrialAccidentSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+원|[\d,]+만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d,]+일분/g)) expect(days, m[0]).toContain(m[0]);
    });
  }
});
