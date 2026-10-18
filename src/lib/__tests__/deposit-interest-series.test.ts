/**
 * 예금 이자 시리즈 — 제목·설명은 RSS·사이트맵 메타가 문자열로 읽어(guide-meta.ts) 리터럴로 둔다.
 * 제목·설명에 쓰는 숫자는 법령 숫자(15.4% = 소득세 14% + 지방소득세 그 10%)와 계산식의 12 뿐 — rates 와 대조한다.
 * 금액(1억원 등)은 예시 입력이라 그대로 두고, 이자 금액은 본문에서 depositInterest() 가 낸다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import fin from "../../rates/financial-income-2026.json";
import { depositSeries } from "../../data/series/deposit";

const total = `${+(fin.withholding.interest * (1 + fin.local.ratio) * 100).toFixed(2)}%`;

describe("예금 이자 시리즈 제목·설명", () => {
  it("15.4% 는 rates 에서", () => {
    expect(total).toBe("15.4%");
  });

  for (const s of [depositSeries.hub, ...depositSeries.items]) {
    it(s.slug, () => {
      const src = readFileSync(`src/pages/guide/${s.slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(s.keyword);
      // 예시 입력(1억원을 연 3%로 1년)과 식의 12(÷ 12 · 12로)를 빼면 남는 숫자는 15.4% 뿐
      const cut = head.replace(/1억원|연 3%|÷ 12|12로|1년/g, "");
      for (const m of cut.matchAll(/\d+(?:\.\d+)?%/g)) expect(m[0]).toBe(total);
      const rest = cut.replace(/\d+(?:\.\d+)?%/g, "");
      expect(rest).not.toMatch(/\d/);
    });
  }
});
