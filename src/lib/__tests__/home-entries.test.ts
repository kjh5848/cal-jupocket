import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { homeEntries } from "../../data/home-entries";
import { icons } from "../../data/icons";

const page = (href: string) => `src/pages${href}index.astro`;

describe("홈 고민 입구 카드", () => {
  it("네 장, 카드마다 질문 2개와 계산기 1개", () => {
    expect(homeEntries).toHaveLength(4);
    for (const e of homeEntries) {
      expect(e.questions).toHaveLength(2);
      expect(e.calc.href).toBeTruthy();
    }
  });

  it("모든 주소가 실제 페이지다", () => {
    for (const e of homeEntries) {
      for (const href of [...e.questions.map((q) => q.href), e.calc.href]) expect(existsSync(page(href)), href).toBe(true);
    }
  });

  it("아이콘이 있고 질문은 20자 안팎", () => {
    for (const e of homeEntries) {
      expect(icons[e.icon], e.icon).toBeTruthy();
      for (const q of e.questions) expect(q.q.length, q.q).toBeLessThanOrEqual(22);
    }
  });
});
