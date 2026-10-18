/**
 * 중도상환수수료 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자는 법령 숫자(3년 = 금융소비자보호법 제20조 ① 4호 나목 1)) 뿐 — rates 와 대조한다.
 * 금액·요율은 예시라 본문에서 prepaymentFee() 가 낸다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/prepayment-fee-2026.json";
import { prepaymentFeeSeries } from "../../data/series/prepayment-fee";

describe("중도상환수수료 시리즈 제목·설명", () => {
  it("3년은 rates 에서", () => {
    expect(r.legalYears).toBe(3);
  });

  for (const s of [prepaymentFeeSeries.hub, ...prepaymentFeeSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      // 남는 숫자는 '3년'과 그 뒤의 '0원' 뿐
      const rest = head.replace(new RegExp(`${r.legalYears}년`, "g"), "").replace(/0원/g, "");
      expect(rest).not.toMatch(/\d/);
    });
  }
});
