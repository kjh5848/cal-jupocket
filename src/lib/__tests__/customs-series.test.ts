/**
 * 면세한도 시리즈 — 제목·설명의 달러·용량·개수·비율이 customs-2026.json(관세법 시행규칙 제48조·제45조, 관세청고시)과 같은지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/customs-2026.json";
import { customsSeries } from "../../data/series/customs";
import { eokwon } from "../won";

const T = r.traveler;
const D = r.direct;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const allowed = new Set([
  `${T.basicUsd}달러`, `${T.liquor.usd}달러`, `${D.freeUsd}달러`, `${D.listUsdUs}달러`, `${D.simpleUsd.toLocaleString("ko-KR")}달러`,
  `${T.liquor.liters}리터`, `${T.tobacco.cigarettes}개비`, `${T.perfumeMl}mL`,
  pct(r.selfReport.rate), pct(r.penalty.rate), eokwon(r.selfReport.cap), "1명당", "19세",
]);

describe("면세 기준", () => {
  it("800달러, 술 2리터·400달러, 궐련 200개비, 향수 100mL, 직구 150달러", () => {
    expect([T.basicUsd, T.liquor.liters, T.liquor.usd, T.tobacco.cigarettes, T.perfumeMl, D.freeUsd]).toEqual([800, 2, 400, 200, 100, 150]);
  });
});

describe("면세한도 시리즈 제목·설명", () => {
  for (const s of [customsSeries.hub, ...customsSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/[\d,]+(?:달러|리터|개비|mL|%|만원)/g)) expect(allowed, m[0]).toContain(m[0]);
    });
  }
});
