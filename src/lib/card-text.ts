/**
 * 카드 그림을 글자로 바꾼다.
 *
 * 카드뉴스 페이지는 JPEG 넉 장이 전부라, 검색엔진도 AI 크롤러도 읽을 게
 * 없었다. 그림 안에 있는 내용은 사람 눈에만 보인다.
 *
 * 두 가지를 만든다:
 *   altText()   — 한 줄 요약. img 의 alt 로 쓴다
 *   transcript() — 카드 전문. 페이지에 실제 텍스트로 싣는다
 *
 * alt 는 짧아야 한다(스크린리더가 통째로 읽는다). 그래서 alt 에 전문을
 * 밀어넣지 않고 본문에 따로 싣는다 — 접근성과 검색이 같은 방향이다.
 */
import type { Card, CardSet } from "../data/cards";

/** [[형광펜]] {{경고}} 표시를 걷어낸다 — 글자만 남긴다. */
export function stripMarkup(s: string): string {
  return s
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/\{\{([^}]*)\}\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** 카드 제목. 줄바꿈으로 디자인한 제목이 있어 한 줄로 편다. */
export function cardTitle(card: Card): string {
  return stripMarkup(card.title);
}

/** 카드가 말하는 핵심 몇 가지. transcript·alt 가 공유한다. */
function points(card: Card): string[] {
  switch (card.kind) {
    case "list":
      return card.items.map((i) =>
        [stripMarkup(i.text), stripMarkup(i.detail)].filter(Boolean).join(" — "),
      );
    case "table":
      return card.rows.map((r) => `${stripMarkup(r.label)} ${stripMarkup(r.value)}`);
    case "note":
      return card.body
        .split("\n")
        .map(stripMarkup)
        .filter(Boolean);
    case "cta":
      return [stripMarkup(card.sub)];
  }
}

const ALT_MAX = 150;

/**
 * img alt — 제목 + 핵심 몇 개. 길어지면 자른다.
 *
 * 카드는 그림이 곧 내용이라 alt 가 "카드 1/4" 면 아무 정보가 없다.
 * 그렇다고 전문을 넣으면 스크린리더가 한 장에 20초를 읽는다.
 */
export function altText(card: Card, index: number, total: number): string {
  const head = cardTitle(card);
  const tail = points(card).join(", ");
  const body = tail ? `${head}: ${tail}` : head;
  const cut =
    body.length > ALT_MAX ? body.slice(0, ALT_MAX - 1).trimEnd() + "…" : body;
  return `${cut} (카드 ${index + 1}/${total})`;
}

export interface TranscriptCard {
  title: string;
  points: string[];
  footnote: string;
}

/** 페이지에 실제 텍스트로 실을 카드 전문. */
export function transcript(set: CardSet): TranscriptCard[] {
  return set.cards.map((card) => ({
    title: cardTitle(card),
    points: points(card),
    footnote: card.kind === "cta" ? "" : stripMarkup(card.footnote),
  }));
}

/** 세트 한 벌을 한 문단으로 — meta description·JSON-LD 에 쓴다. */
export function setSummary(set: CardSet, max = 155): string {
  const s = set.cards
    .filter((c) => c.kind !== "cta")
    .map((c) => `${cardTitle(c)}: ${points(c).slice(0, 2).join(", ")}`)
    .join(" · ");
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}
