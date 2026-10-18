/**
 * 중개보수 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자가 brokerage-fee-2026.json(시행규칙 별표 1·2, 제20조 ④·⑤)과 맞는지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/brokerage-fee-2026.json";
import { brokerageFeeSeries } from "../../data/series/brokerage-fee";

const pct = (permille: number) => `${permille / 10}`;
const sale = r.housing.sale.map((b) => b.permille);
const lease = r.housing.lease.map((b) => b.permille);
const allowed = new Set([
  pct(Math.min(...sale.slice(2))), // 매매 2억 이상 최저 0.4
  `${pct(Math.max(...sale))}%`, // 매매 최고 0.7%
  pct(Math.min(...lease)), // 임대차 최저 0.3
  `${pct(Math.max(...lease))}%`, // 임대차 최고 0.6%
  `${r.housing.sale[1].below! / 100_000_000}억원`, // 한도액이 있는 매매 구간 끝 2억원
  `${pct(r.officetel.salePermille)}%`,
  `${pct(r.officetel.leasePermille)}%`,
  `${pct(r.other.permille)}%`,
  `${r.monthlyRent.multiplier}`,
  `${r.monthlyRent.multiplier}배`,
  `${r.monthlyRent.smallMultiplier}`,
  `${r.monthlyRent.smallMultiplier}배`,
  `${r.monthlyRent.smallBelow / 10_000_000}천만원`,
  `${r.vatRate * 100}%`,
  "1", // 별표 1
  "2", // 별표 2
]);

describe("중개보수 시리즈 제목·설명", () => {
  it("rates 숫자", () => {
    expect(Math.min(...sale.slice(2))).toBe(4);
    expect(Math.max(...sale)).toBe(7);
    expect(r.monthlyRent.smallBelow).toBe(50_000_000);
    expect(r.vatRate).toBe(0.1);
  });

  for (const s of [brokerageFeeSeries.hub, ...brokerageFeeSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d[\d,.]*(?:%|억원|천만원|배)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
    });
  }
});
