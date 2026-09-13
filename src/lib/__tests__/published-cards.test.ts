/**
 * 갤러리가 실제 발행본을 찾는지 지킨다.
 *
 * 세트 페이지가 오랫동안 카드 JPEG 대신 축소 아트보드만 보여주고 있었다.
 * 경로를 import.meta.url 로 잡았는데 빌드하면 페이지가 chunks/ 로 번들되어
 * ../ 개수가 어긋났기 때문이다. 빌드해야만 드러나는 종류라 눈에 안 띄었다.
 *
 * 여기서 막는다 — 이미지가 있는데 못 찾으면 실패한다.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { publishedShots, cardImagePath } from "../published-cards";
import { cardSets } from "../../data/cards";

describe("발행된 카드 찾기", () => {
  it("없는 세트는 빈 배열", () => {
    expect(publishedShots("존재하지-않는-세트", 4)).toEqual([]);
  });

  it("경로가 프로젝트 안을 가리킨다 — 리포 바깥으로 새지 않는다", () => {
    const p = cardImagePath("vat-filing", 1);
    expect(p).toContain("public");
    expect(p).toContain("cards");
    expect(p.includes("..")).toBe(false);
  });

  it.each(cardSets.map((s) => s.slug))(
    "%s — 파일이 있으면 반드시 찾아낸다",
    (slug) => {
      const set = cardSets.find((s) => s.slug === slug)!;
      const onDisk = set.cards
        .map((_, i) => i + 1)
        .filter((n) => existsSync(cardImagePath(slug, n)));
      expect(publishedShots(slug, set.cards.length)).toEqual(onDisk);
    },
  );

  it("이미지를 뽑아둔 세트가 하나라도 있다 — 전부 0이면 경로가 틀린 것이다", () => {
    const found = cardSets.map((s) => publishedShots(s.slug, s.cards.length));
    expect(found.some((shots) => shots.length > 0)).toBe(true);
  });
});
