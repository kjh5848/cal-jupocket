/**
 * 로또세금 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율·금액이 rates 와 lotteryTax() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/lottery-2026.json";
import { lottoTaxSeries } from "../../data/series/lotto-tax";
import { lotteryTax, lottoPage } from "../lottery-tax";
import { eokwon } from "../won";

const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
const percents = new Set([
  pct(r.rate.base), pct(r.rate.overRate), pct(r.local.ratio),
  pct(r.rate.base * r.local.ratio), pct(r.rate.base * (1 + r.local.ratio)), pct(r.rate.overRate * (1 + r.local.ratio)),
]);
const t = lotteryTax;
const money = new Set([
  "0원", eokwon(r.minimum.upTo), eokwon(r.rate.over),
  eokwon(100_000_000), eokwon(t(100_000_000).net),
  eokwon(1_000_000_000), eokwon(t(1_000_000_000).net), eokwon(t(1_000_000_000).total),
  eokwon(2_000_000_000), eokwon(t(2_000_000_000).net),
]);

describe("로또 세금 계산", () => {
  it("200만원까지 0원, 1원 넘으면 전체에 22%", () => {
    expect(t(2_000_000).total).toBe(0);
    expect(t(2_000_001).total).toBe(440_000);
  });
  it("3억원 = 6,600만원, 10억원 = 2억9,700만원, 20억원 실수령 13억7,300만원", () => {
    expect(t(300_000_000).total).toBe(66_000_000);
    expect(t(1_000_000_000).total).toBe(297_000_000);
    expect(eokwon(t(2_000_000_000).net)).toBe("13억7,300만원");
  });
});

/** BigInt 기준값 — 원천징수 소득세·지방소득세 모두 10원 미만 버림(국고금 관리법 제47조 ①, 지방세기본법 제59조) */
function ref(p: number) {
  const P = BigInt(p);
  if (P <= 2_000_000n) return { tax: 0, local: 0 };
  const over = P > 300_000_000n ? P - 300_000_000n : 0n;
  const raw = ((P - over) * 20n) / 100n + (over * 30n) / 100n;
  const tax = (raw / 10n) * 10n;
  const local = (tax / 100n) * 10n;
  return { tax: Number(tax), local: Number(local) };
}

describe("로또 세금 10원 미만 끝수 (roberin #5 대조 2026-10-18)", () => {
  it("roberin 과 같은 입력 4개", () => {
    const cases: [number, number, number][] = [
      [2_000_010, 400_000, 40_000],
      [333_333_333, 69_999_990, 6_999_990],
      [1_000_000_007, 270_000_000, 27_000_000],
      [2_345_678_901, 673_703_670, 67_370_360],
    ];
    for (const [p, tax, local] of cases) {
      expect(t(p).tax, String(p)).toBe(tax);
      expect(t(p).local, String(p)).toBe(local);
    }
  });
  it("1원 단위 200만~205만·3억 ±5만, 1만원 단위 0~50억 전수 — 기준값과 0건 차이", () => {
    let bad = 0;
    const check = (p: number) => {
      const a = t(p), b = ref(p);
      if (a.tax !== b.tax || a.local !== b.local || a.baseTax + a.overTax !== a.tax || a.net !== p - a.tax - a.local) bad++;
    };
    for (let p = 2_000_000; p <= 2_050_000; p++) check(p);
    for (let p = 299_950_000; p <= 300_050_000; p++) check(p);
    for (let p = 0; p <= 5_000_000_000; p += 10_000) check(p);
    expect(bad).toBe(0);
  });
  it("30% 구간 때문에 더 뗀 돈 — 3억 이하 0, 10억 = 700,000,000 × 10% × 1.1", () => {
    expect(lottoPage(300_000_000).overExtra).toBe(0);
    expect(lottoPage(1_000_000_000).overExtra).toBe(77_000_000);
    expect(lottoPage(1_000_000_000).overAmount).toBe(700_000_000);
    expect(lottoPage(2_000_000_000).effectiveRate).toBe(31.35);
  });
});

describe("로또세금 시리즈 제목·설명", () => {
  for (const s of [lottoTaxSeries.hub, ...lottoTaxSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(percents, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?:[\d,]+억)?[\d,]+만원|[\d,]+억원|\d+원/g)) expect(money, m[0]).toContain(m[0]);
    });
  }
});
