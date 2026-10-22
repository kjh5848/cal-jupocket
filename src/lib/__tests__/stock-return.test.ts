/**
 * 주식 수익률 — 세율은 rates(stock-trade-2026.json), 기대값 넷은 2026-10-22 roberin 계산기에 같은 입력을 넣어 본 값
 * (우리 산식으로 손으로 다시 셈해 같음을 확인 — calc-benchmark #17).
 */
import { describe, it, expect } from "vitest";
import r from "../../rates/stock-trade-2026.json";
import { stockReturn, priceForReturn, feeOf, sellTaxes, MARKETS } from "../stock-return";
import { readFileSync } from "node:fs";
import { stockReturnSeries } from "../../data/series/stock-return";

describe("세율 — 증권거래세법 시행령 제5조 · 농어촌특별세법 제5조 ① 5호", () => {
  it("1만분의 단위", () => {
    expect(r.markets.kospi).toMatchObject({ tax: 5, rural: 15 });
    expect(r.markets.kosdaq).toMatchObject({ tax: 20, rural: 0 });
    expect(r.markets.konex).toMatchObject({ tax: 10, rural: 0 });
    expect(r.markets.kotc).toMatchObject({ tax: 20, rural: 0 });
    expect(r.markets.etf).toMatchObject({ tax: 0, rural: 0 });
  });

  it("소수 오차 없이 원 미만 버림 — 7,950,000 × 0.05% = 3,975", () => {
    expect(sellTaxes(7_950_000, "kospi")).toEqual({ tax: 3_975, rural: 11_925 });
    expect(sellTaxes(502_423, "kospi")).toEqual({ tax: 251, rural: 753 });
    expect(feeOf(456_765, 0.015)).toBe(68);
    expect(feeOf(1_250, 0.015)).toBe(0);
  });
});

describe("roberin 같은 입력 4개", () => {
  it("코스피 12,345원 × 37주 → 13,579원, 수수료 0.015%", () => {
    const x = { buyPrice: 12_345, qty: 37, feePct: 0.015, market: "kospi" as const };
    const res = stockReturn({ ...x, sellPrice: 13_579 });
    expect(res).toMatchObject({ cost: 456_833, sellFee: 75, tax: 251, rural: 753, proceeds: 501_344, profit: 44_511, costs: 1_147 });
    expect(res.returnRate * 100).toBeCloseTo(9.74, 2);
    expect(priceForReturn(x)).toBe(12_374);
    expect(priceForReturn(x, 10)).toBe(13_611);
  });

  it("코스닥 손실 48,750원 × 23주 → 41,230원", () => {
    const x = { buyPrice: 48_750, qty: 23, feePct: 0.015, market: "kosdaq" as const };
    const res = stockReturn({ ...x, sellPrice: 41_230 });
    expect(res).toMatchObject({ cost: 1_121_418, proceeds: 946_252, profit: -175_166, tax: 1_896, rural: 0 });
    expect(res.buyFee + res.sellFee).toBe(310);
    expect(priceForReturn(x)).toBe(48_863);
  });

  it("1주 — 끝수로 순손익이 출렁여도 본전·목표가는 그 위에서 내려가지 않는 값", () => {
    const x = { buyPrice: 1_234, qty: 1, feePct: 0.015, market: "kospi" as const };
    const res = stockReturn({ ...x, sellPrice: 1_250 });
    expect(res).toMatchObject({ profit: 15, rural: 1, tax: 0, sellFee: 0 });
    expect(priceForReturn(x)).toBe(1_235);
    expect(priceForReturn(x, 5)).toBe(1_297);
  });

  it("코넥스 3,333원 × 333주 → 3,456원, 수수료 0.25%", () => {
    const x = { buyPrice: 3_333, qty: 333, feePct: 0.25, market: "konex" as const };
    const res = stockReturn({ ...x, sellPrice: 3_456 });
    expect(res).toMatchObject({ profit: 34_158, tax: 1_150 });
    expect(res.buyFee + res.sellFee).toBe(5_651);
    expect(priceForReturn(x)).toBe(3_354);
  });
});

describe("본전·목표가 정의", () => {
  it("돌려준 가격부터 위로 1,000원 동안 순손익이 목표 아래로 내려가지 않고, 한 칸 아래는 목표 미달", () => {
    for (const [buyPrice, qty, market, target] of [
      [1_234, 1, "kospi", 0],
      [987, 3, "kosdaq", 3],
      [55_500, 7, "kospi", -5],
      [20_000, 10, "etf", 0],
    ] as const) {
      const x = { buyPrice, qty, feePct: 0.015, market };
      const p = priceForReturn(x, target)!;
      const cost = stockReturn({ ...x, sellPrice: buyPrice }).cost;
      const hit = (s: number) => stockReturn({ ...x, sellPrice: s }).profit >= (cost * target) / 100;
      expect(hit(p - 1)).toBe(false);
      for (let s = p; s < p + 1_000; s++) expect(hit(s)).toBe(true);
    }
  });

  it("ETF 는 세금 0 — 수수료만", () => {
    const res = stockReturn({ buyPrice: 10_000, qty: 10, sellPrice: 10_000, feePct: 0.015, market: "etf" });
    expect(res.tax + res.rural).toBe(0);
    expect(res.profit).toBe(-30);
  });

  it("수량·매수가가 없으면 null", () => {
    expect(priceForReturn({ buyPrice: 0, qty: 10, feePct: 0.015, market: "kospi" })).toBeNull();
    expect(priceForReturn({ buyPrice: 1_000, qty: 0, feePct: 0.015, market: "kospi" })).toBeNull();
  });
});

/**
 * 주식 수익률 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 그 문자열의 비율이 rates(1만분의 단위)와 어긋나지 않는지 대조한다. 0.015% 는 수수료 예시(사용자 입력, 출처 숫자 아님).
 */
describe("주식 수익률 시리즈 제목·설명", () => {
  const bp = (n: number) => `${Number((n / 100).toFixed(2))}%`;
  const rates = new Set(["0.015%", ...MARKETS.flatMap((k) => [r.markets[k].tax, r.markets[k].rural, r.markets[k].tax + r.markets[k].rural].filter(Boolean).map(bp))]);
  it("rates 숫자", () => {
    expect([...rates].sort()).toEqual(["0.015%", "0.05%", "0.1%", "0.15%", "0.2%"]);
    expect(r.appliesFrom).toBe("2026-01-01");
  });
  for (const s of [stockReturnSeries.hub, ...stockReturnSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head).not.toMatch(/억원|만원/);
      for (const m of head.matchAll(/[\d.]+%/g)) expect(rates, m[0]).toContain(m[0]);
    });
  }
});
