/**
 * 전기차 세금 시리즈 — 제목·설명의 금액·비율이 electric-car-2026.json 과 electric-car.ts 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/electric-car-2026.json";
import { electricCarSeries } from "../../data/series/electric-car";
import { evAcquisitionTax, evFullExemptPrice, evVehicleTax, evPage } from "../electric-car";
import { manwon } from "../won";

describe("전기차 세금 계산", () => {
  it("비영업용 자동차세 10만원 + 지방교육세 30% = 13만원, 영업용은 교육세 없음", () => {
    expect(evVehicleTax()).toEqual({ base: 100_000, edu: 30_000, total: 130_000, perHalf: 65_000 });
    expect(evVehicleTax(true).total).toBe(20_000);
  });
  it("취득세 7% − 140만원, 2027년 취득은 감면 없음", () => {
    expect(evAcquisitionTax(40_000_000)).toEqual({ gross: 2_800_000, exempt: 1_400_000, tax: 1_400_000 });
    expect(evAcquisitionTax(40_000_000, "2027-01-01").tax).toBe(2_800_000);
    expect(evAcquisitionTax(15_000_000).tax).toBe(0);
    expect(evFullExemptPrice()).toBe(20_000_000);
    expect(evAcquisitionTax(evFullExemptPrice()).tax).toBe(0);
  });
});

describe("전기차 세금 계산기 화면 (evPage)", () => {
  // 지방세법 제12조 ① 2호 가목 1천분의 70 · 지특법 제66조 ④ 140만원 — 조문 손계산
  it("손계산 — 2천만원 경계 0원, 4천만원 140만원, 6천만원 280만원, 2027년 4천만원 280만원", () => {
    expect(evPage(20_000_000)).toMatchObject({ gross: 1_400_000, exempt: 1_400_000, tax: 0, overFull: 0, effectiveRate: 0 });
    expect(evPage(20_010_000)).toMatchObject({ tax: 700, overFull: 10_000 });
    expect(evPage(40_000_000)).toMatchObject({ tax: 1_400_000, overFull: 20_000_000, effectiveRate: 3.5 });
    expect(evPage(60_000_000)).toMatchObject({ tax: 2_800_000, effectiveRate: 4.67 });
    expect(evPage(40_000_000, "2027-01-01")).toMatchObject({ exempt: 0, tax: 2_800_000, exemptOn: false, overFull: 40_000_000, effectiveRate: 7 });
    expect(evPage(0)).toMatchObject({ gross: 0, tax: 0, effectiveRate: 0 });
  });
  it("감면 기한 안이면 낼 취득세 = 2천만원을 넘은 차값 × 7%", () => {
    for (let p = 0; p <= 200_000_000; p += 1_230_000) {
      const x = evPage(p);
      expect(x.tax, String(p)).toBe(Math.floor((x.overFull * 70) / 1000));
      expect(x.gross - x.exempt, String(p)).toBe(x.tax);
    }
  });
  it("원 미만 버림 — 1원 단위 차값 1천만원~1천1만원·1만원 단위 0~2억 정수 연산과 0건 차이", () => {
    const exact = (p: number) => Number((BigInt(p) * 70n) / 1000n);
    for (let p = 10_000_000; p <= 10_010_000; p += 1) expect(evAcquisitionTax(p, "2027-01-01").gross).toBe(exact(p));
    let bad = 0;
    for (let p = 0; p <= 200_000_000; p += 10_000) if (evAcquisitionTax(p, "2027-01-01").gross !== exact(p)) bad++;
    expect(bad).toBe(0);
  });
  it("1년 자동차세는 차값과 상관없이 13만원(본세 10만원 + 교육세 3만원)", () => {
    expect(evPage(90_000_000).car).toEqual(evVehicleTax());
  });
});

const ev = evVehicleTax();
const money = new Set([
  manwon(ev.base), manwon(ev.total), manwon(r.exemption.acquisition.cap), manwon(r.exemption.excise.cap),
  manwon(evAcquisitionTax(40_000_000).tax), manwon(evAcquisitionTax(40_000_000, "2027-01-01").tax), "4천만원",
]);
const pcts = new Set([`${Math.round(r.acquisitionTax.rate * 100)}%`]);

describe("전기차 세금 시리즈 제목·설명", () => {
  for (const s of [electricCarSeries.hub, ...electricCarSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+(?:천)?만원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(pcts, m[0]).toContain(m[0]);
    });
  }
});
