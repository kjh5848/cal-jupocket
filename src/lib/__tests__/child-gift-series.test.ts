/**
 * 자녀 증여 두 편 — 제목·설명의 금액이 gift-2026.json 과 computeGift() 에서 나오는 값인지 대조한다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import r from "../../rates/gift-2026.json";
import { computeGift, relationCap, taxFreeCeiling } from "../gift";
import { eokwon, won } from "../won";

const adult = relationCap("ascendant");
const minor = relationCap("ascendant", true);
const ex1 = computeGift({ amount: 100_000_000, relation: "ascendant" });

describe("자녀 증여 금액", () => {
  it("성인 5천만원·미성년 2천만원·혼인 포함 1억5천만원", () => {
    expect([adult, minor, taxFreeCeiling("ascendant", { marriageBirth: true })]).toEqual([50_000_000, 20_000_000, 150_000_000]);
  });
  it("성인 자녀 1억원 → 증여세 485만원(3% 공제 후)", () => {
    expect(ex1.payable).toBe(4_850_000);
  });
});

const money = new Set([eokwon(adult), eokwon(minor), eokwon(r.marriageBirthDeduction.combinedCap), eokwon(150_000_000), eokwon(100_000_000), eokwon(ex1.payable), won(ex1.payable)]);
const counts = new Set(["10년", `${r.marriageBirthDeduction.marriageWindowYears}년`]);

describe("자녀 증여 제목·설명", () => {
  for (const [slug, kw] of [["child-gift-limit", "자녀 증여 한도"], ["child-wedding-gift", "자녀 결혼자금 증여"]]) {
    it(slug, () => {
      const src = readFileSync(`src/pages/guide/${slug}/index.astro`, "utf-8");
      const title = src.match(/^const title = "([^"]+)";/m)?.[1] ?? "";
      const head = title + " " + (src.match(/const description =\s*"([^"]+)";/)?.[1] ?? "");
      expect(title).toContain(kw);
      for (const m of head.matchAll(/(?:\d+억)?\d+(?:,\d{3})*(?:천)?만원|\d+억원/g)) expect(money, m[0]).toContain(m[0]);
      for (const m of head.matchAll(/(?<!\d)\d+년/g)) expect(counts, m[0]).toContain(m[0]);
    });
  }
});
