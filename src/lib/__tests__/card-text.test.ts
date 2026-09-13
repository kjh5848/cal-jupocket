/**
 * 카드 그림을 글자로 바꾸는 일을 지킨다.
 *
 * 카드뉴스 페이지는 JPEG 넉 장이 전부였다 — 검색엔진도 AI 크롤러도 읽을 게
 * 없었고, alt 는 "카드 1 / 4" 라 아무 정보가 없었다. 여기가 그 페이지의
 * 유일한 텍스트 공급원이므로 비면 안 된다.
 */
import { describe, it, expect } from "vitest";
import { altText, transcript, setSummary, stripMarkup, cardTitle } from "../card-text";
import { cardSets } from "../../data/cards";

describe("강조 표시 걷어내기", () => {
  it("[[형광펜]] 과 {{경고}} 는 글자만 남는다", () => {
    expect(stripMarkup("2기 확정신고 [[1월 1일~25일]]")).toBe("2기 확정신고 1월 1일~25일");
    expect(stripMarkup("면세사업자는 {{2월 10일}}")).toBe("면세사업자는 2월 10일");
  });

  it("줄바꿈으로 디자인한 제목을 한 줄로 편다", () => {
    expect(cardTitle({ kind: "cta", title: "내 부가세는\n얼마일까?", sub: "" })).toBe(
      "내 부가세는 얼마일까?",
    );
  });
});

describe("alt 텍스트", () => {
  const cases = cardSets.flatMap((set) =>
    set.cards.map((card, i) => ({ slug: set.slug, card, i, total: set.cards.length })),
  );

  it.each(cases)("$slug #$i — 제목이 들어가고 비어 있지 않다", ({ card, i, total }) => {
    const alt = altText(card, i, total);
    expect(alt.length).toBeGreaterThan(10);
    expect(alt).toContain(`카드 ${i + 1}/${total}`);
    // 강조 표시가 그대로 새어나가면 안 된다.
    expect(alt).not.toMatch(/\[\[|\]\]|\{\{|\}\}/);
  });

  it("스크린리더가 한 장에 붙들리지 않게 길이를 제한한다", () => {
    for (const { card, i, total } of cases) {
      expect(altText(card, i, total).length).toBeLessThanOrEqual(170);
    }
  });
});

describe("카드 전문", () => {
  it.each(cardSets.map((s) => s.slug))("%s — 모든 장이 제목과 내용을 낸다", (slug) => {
    const set = cardSets.find((s) => s.slug === slug)!;
    const t = transcript(set);
    expect(t).toHaveLength(set.cards.length);
    for (const c of t) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.points.length).toBeGreaterThan(0);
      expect(c.points.every((p) => p.trim().length > 0)).toBe(true);
    }
  });

  it("페이지에 실릴 글자 수가 의미 있는 양이다 — 그림만 있으면 검색이 못 읽는다", () => {
    for (const set of cardSets) {
      const chars = transcript(set)
        .flatMap((c) => [c.title, ...c.points, c.footnote])
        .join("").length;
      expect(chars).toBeGreaterThan(200);
    }
  });
});

describe("세트 요약(meta description)", () => {
  it.each(cardSets.map((s) => s.slug))("%s — 155자를 넘지 않고 비어 있지 않다", (slug) => {
    const set = cardSets.find((s) => s.slug === slug)!;
    const s = setSummary(set);
    expect(s.length).toBeGreaterThan(20);
    expect(s.length).toBeLessThanOrEqual(155);
  });
});
