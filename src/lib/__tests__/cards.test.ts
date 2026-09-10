/**
 * 카드에 인쇄되는 숫자가 계산기와 같은지 검사한다.
 *
 * 카드는 이미지로 구워져 인스타로 나간다 — 발행 후에는 고칠 수 없고,
 * 틀린 숫자가 박힌 이미지는 그대로 남는다. 그래서 표의 모든 행을
 * 실제 계산 함수와 대조한다. 요율이나 상·하한이 바뀌면 여기서 먼저 깨진다.
 */
import { describe, it, expect } from "vitest";
import { cardSets, cardSetBySlug } from "../../data/cards";
import { compute } from "../pension-premium";
import { parseMarkup } from "../card-markup";
import { entryByNo } from "../../data/linkhub";
import rates from "../../rates/pension-premium-2026.json";

/** "28만 5,000원" 같은 표기를 숫자로 되돌린다. */
function parseWon(label: string): number {
  // "19만 원" 처럼 만 단위만 있고 뒤가 비는 표기도 받아야 한다.
  const m = label.match(/^(?:([\d,]+)만)?\s*(?:([\d,]+)\s*)?원$/);
  if (!m) throw new Error(`읽을 수 없는 금액 표기: ${label}`);
  const man = m[1] ? Number(m[1].replace(/,/g, "")) : 0;
  const rest = m[2] ? Number(m[2].replace(/,/g, "")) : 0;
  return man * 10000 + rest;
}

describe("parseWon (테스트용 헬퍼)", () => {
  it("만 단위와 나머지를 합친다", () => {
    expect(parseWon("28만 5,000원")).toBe(285000);
    expect(parseWon("19만 원")).toBe(190000);
    expect(parseWon("62만 6,050원")).toBe(626050);
  });
});

describe("pension-2026 카드", () => {
  const set = cardSetBySlug("pension-2026");

  it("세트가 존재한다", () => {
    expect(set).toBeDefined();
  });

  const table = set?.cards.find((c) => c.kind === "table");

  it("표 카드가 있다", () => {
    expect(table).toBeDefined();
  });

  it("표의 모든 행이 계산기 결과와 일치한다", () => {
    if (table?.kind !== "table") throw new Error("표 카드 없음");
    for (const row of table.rows) {
      const income = Number(row.label.replace(/[^\d]/g, "")) * 10000;
      expect(parseWon(row.value)).toBe(compute(income).monthly);
    }
  });

  it("상한 행이 실제 상한값을 쓴다", () => {
    if (table?.kind !== "table") throw new Error("표 카드 없음");
    const last = table.rows[table.rows.length - 1];
    expect(last.label).toContain(String(rates.standardIncomeCeiling / 10000));
    expect(parseWon(last.value)).toBe(compute(rates.standardIncomeCeiling).monthly);
  });

  it("리스트 카드가 현재 요율을 말한다", () => {
    const list = set?.cards.find((c) => c.kind === "list");
    if (list?.kind !== "list") throw new Error("리스트 카드 없음");
    const joined = list.items.map((i) => i.text).join(" ");
    expect(joined).toContain(`${rates.rate * 100}%`);
  });
});

describe("모든 카드 세트 공통", () => {
  it.each(cardSets.map((s) => s.slug))("%s — 마지막은 유도 카드다", (slug) => {
    const set = cardSetBySlug(slug)!;
    expect(set.cards[set.cards.length - 1].kind).toBe("cta");
  });

  it.each(cardSets.map((s) => s.slug))("%s — 캐러셀 10장 제한을 넘지 않는다", (slug) => {
    expect(cardSetBySlug(slug)!.cards.length).toBeLessThanOrEqual(10);
  });

  it.each(cardSets.map((s) => s.slug))("%s — 숫자를 쓴 카드에는 출처가 있다", (slug) => {
    for (const card of cardSetBySlug(slug)!.cards) {
      if (card.kind === "cta") continue;
      expect(card.footnote.length).toBeGreaterThan(0);
    }
  });

  it.each(cardSets.map((s) => s.slug))("%s — 강조 표시가 닫혀 있다", (slug) => {
    for (const card of cardSetBySlug(slug)!.cards) {
      const texts =
        card.kind === "list"
          ? card.items.map((i) => i.text)
          : card.kind === "note"
            ? [card.body]
            : [];
      for (const t of texts) {
        // 파싱 후 남은 원시 표시가 있으면 문법이 깨진 것이다.
        const rendered = parseMarkup(t)
          .map((tok) => tok.text)
          .join("");
        expect(rendered).not.toMatch(/\[\[|\]\]|\{\{|\}\}/);
      }
    }
  });
});

describe("카드가 지목하는 번호", () => {
  it("refNo 는 허브에 실제로 있는 번호다 — 없는 번호를 가리키면 독자가 길을 잃는다", () => {
    for (const set of cardSets) {
      for (const card of set.cards) {
        if (card.kind !== "cta" || card.refNo === undefined) continue;
        expect(entryByNo(card.refNo)).toBeDefined();
      }
    }
  });

  it("pension-2026 은 국민연금 보험료 글을 가리킨다", () => {
    const cta = cardSetBySlug("pension-2026")!.cards.find((c) => c.kind === "cta");
    if (cta?.kind !== "cta") throw new Error("cta 없음");
    expect(entryByNo(cta.refNo!)?.href).toBe("/guide/pension-premium-2026/");
  });
});
