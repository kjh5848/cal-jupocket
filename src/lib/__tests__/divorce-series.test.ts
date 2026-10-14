/**
 * 이혼 재산분할 세금 시리즈 — 취득세 계산이 지방세법 제15조 제1항 제6호·제151조대로인지,
 * 제목·설명의 금액·비율이 divorce-2026.json 과 divorce-tax.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/divorce-2026.json";
import { divorceSeries } from "../../data/series/divorce";
import { divisionAcqTax, plainGiftAcqTax } from "../divorce-tax";
import { manwon, eokwon } from "../won";

const A = r.acquisition;

describe("재산분할 취득세", () => {
  it("무상취득 3.5% − 중과기준세율 2% = 1.5%", () => {
    expect(A.rate).toBeCloseTo(A.baseRate - A.heavyRate, 10);
    expect(A.rate).toBe(0.015);
  });
  it("5억원 — 취득세 750만원 + 지방교육세 150만원(과세표준 × 1.5% × 20%)", () => {
    expect(divisionAcqTax(500_000_000)).toEqual({ acq: 7_500_000, edu: 1_500_000, total: 9_000_000 });
    expect(plainGiftAcqTax(500_000_000)).toEqual({ acq: 17_500_000, edu: 1_500_000, total: 19_000_000 });
  });
  it("판례 출처는 사건번호와 원문 주소를 남긴다", () => {
    const labels = r.sources.map((s) => s.label).join(" ");
    for (const no of ["2012두10901", "2001두4573", "2016두58901", "2016두36864", "96헌바14"]) expect(labels).toContain(no);
  });
});

const ex = divisionAcqTax(500_000_000);
const plain = plainGiftAcqTax(500_000_000);
const pct = (v: number) => `${Number((v * 100).toFixed(1))}%`;
const money = new Set([eokwon(500_000_000), manwon(ex.total), manwon(plain.total - ex.total)]);
const pcts = new Set([pct(A.rate), pct(A.baseRate), pct(A.heavyRate), pct((A.baseRate - A.heavyRate) * A.eduRate)]);

describe("이혼 재산분할 세금 시리즈 제목·설명", () => {
  for (const s of [divorceSeries.hub, ...divorceSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+(?:억)?(?:천)?만?원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
    });
  }
});
