import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allSeries } from "../../data/series";

/**
 * AI 요약·스니펫용 구조 — 자동완성 키워드 시리즈 글마다 대조한다.
 *
 *  1. 제목(<h1>)에 메인 키워드가 들어 있다
 *  2. 제목 바로 아래에 "한 줄 답"(AnswerBox)이 있고 220자를 넘지 않는다
 *  3. FAQPage 구조화 데이터가 있고 질문이 3개 이상이다
 *  4. FAQ 의 질문이 본문 <h2> 로 그대로 있고, 그 바로 아래 <p class="qa-lead"> 가
 *     FAQ 의 답과 같다 — 구조화 데이터에만 있고 화면에 없는 답은 정책 위반이다
 *  5. 첫 답은 40~220자. 너무 짧으면 답이 안 되고, 길면 스니펫이 자른다
 */
const pages = allSeries.flatMap((s) => [s.hub, ...(s.existing ?? []), ...s.items]);
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const text = (h: string) =>
  h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

for (const p of pages) {
  const file = join(process.cwd(), "dist/guide", p.slug, "index.html");
  const built = existsSync(file);
  const html = built ? readFileSync(file, "utf-8") : "";

  describe.skipIf(!built)(`${p.keyword} (/guide/${p.slug}/)`, () => {
    it("제목에 메인 키워드가 있다", () => {
      const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
      expect(norm(h1)).toContain(norm(p.keyword.replace(/,/g, "")));
    });

    it("한 줄 답이 있고 220자 이내다", () => {
      const a = text(html.match(/<p class="answer-text"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
      expect(a.length).toBeGreaterThan(30);
      expect(a.length).toBeLessThanOrEqual(220);
    });

    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]))
      .find((x) => x["@type"] === "FAQPage");

    it("FAQ 구조화 데이터에 질문이 3개 이상이다", () => {
      expect(ld, "FAQPage 없음").toBeTruthy();
      expect(ld.mainEntity.length).toBeGreaterThanOrEqual(3);
    });

    it("FAQ 질문이 <h2> 로, 답이 바로 아래 qa-lead 로 보인다", () => {
      // 소제목과 그 바로 다음 qa-lead 단락을 짝으로 뽑는다(사이에 다른 요소가 있으면 짝이 안 된다).
      // 소제목 안에 다른 <h2> 가 끼지 않게 막는다 — 답 없는 소제목 뒤에서 게으른 매치가 다음 소제목까지 삼키던 버그(2026-10-13).
      const pairs = [...html.matchAll(/<h2[^>]*>((?:(?!<\/?h2)[\s\S])*?)<\/h2>\s*<p class="qa-lead"[^>]*>([\s\S]*?)<\/p>/g)].map(
        (m) => [text(m[1]), text(m[2])] as const,
      );
      for (const q of ld?.mainEntity ?? []) {
        const pair = pairs.find(([h]) => h === q.name);
        expect(pair, `소제목 바로 아래 답이 없다: ${q.name}`).toBeTruthy();
        expect(pair![1]).toBe(q.acceptedAnswer.text);
      }
    });

    it("첫 답은 40~220자다", () => {
      for (const q of ld?.mainEntity ?? []) {
        const n = q.acceptedAnswer.text.length;
        expect(n, q.name).toBeGreaterThanOrEqual(40);
        expect(n, q.name).toBeLessThanOrEqual(220);
      }
    });
  });
}
