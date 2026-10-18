/**
 * 야근수당 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자가 overtime-2026.json(제56조 ①②③, 별표 1)과 labor-2026.json(2026 최저시급)에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/overtime-2026.json";
import { overtimeSeries } from "../../data/series/overtime";
import { minWage } from "../labor";
import { won } from "../won";

const P = r.premium;
const pct = (v: number) => `${v * 100}%`;
const allowed = new Set([
  pct(P.overtime), // 50%
  pct(P.holidayOver8), // 100%
  `${1 + P.overtime}배`, // 1.5배
  `${1 + P.holidayOver8}배`, // 2배 (휴일 8시간 초과)
  `${1 + P.overtime + P.night}배`, // 2배 (연장 + 야간)
  `${P.holidayLimitHours}시간`,
  `${P.nightStart - 12}시`, // 오후 10시
  `${P.nightEnd}시`, // 오전 6시
  `${r.smallBusiness.maxWorkers}명`,
  "1주",
  "2026년",
  won(minWage(2026)),
]);

describe("야근수당 시리즈 제목·설명", () => {
  it("rates 숫자", () => {
    expect(P.nightStart - 12).toBe(10);
    expect(1 + P.holidayOver8).toBe(2);
    expect(minWage(2026)).toBe(10320);
  });

  for (const s of [overtimeSeries.hub, ...overtimeSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      for (const m of head.matchAll(/\d[\d,.]*(?:%|배|시간|시|년|원|명|주)?/g)) expect(allowed.has(m[0]), m[0]).toBe(true);
    });
  }
});
