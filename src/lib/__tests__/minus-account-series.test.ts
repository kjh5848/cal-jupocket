/**
 * 마이너스통장 이자 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 법령 숫자가 없는 시리즈라 제목·설명에 금액·비율·날수를 넣지 않는다(금액은 본문에서 overdraftInterest() 가 낸다).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/overdraft-2026.json";
import { minusAccountSeries } from "../../data/series/minus-account";

describe("마이너스통장 이자 시리즈 제목·설명", () => {
  it("rates 에 일수 계산·단수 문장과 약정서 출처가 있다", () => {
    expect(r.dayCount).toContain("윤년 366일");
    expect(r.rounding).toContain("원 미만 버림");
    expect(r.sources[0].url).toMatch(/^https:\/\//);
  });

  for (const s of [minusAccountSeries.hub, ...minusAccountSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      expect(head).not.toMatch(/\d/);
    });
  }
});
