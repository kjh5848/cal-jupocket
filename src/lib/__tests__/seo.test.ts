/**
 * 빌드 산출물의 SEO 불변식.
 *
 * 이 파일이 생긴 이유: 표지 카드(cover)를 도입한 뒤 두 세트 페이지의
 * <title> 과 <h1> 이 "late-filing-penalty" 처럼 slug 그대로 나갔다.
 * 검색결과에 그대로 보이는 자리인데, 소스를 읽어서는 안 보인다 —
 * heading 계산이 kind 를 가려내는 조건문 안에 있었기 때문이다.
 * 같은 이유로 h1 이 통째로 빠진 글도 한 편 있었다.
 *
 * 눈으로 보는 대신 산출물을 센다. dist 가 없으면 건너뛴다(빌드 전에
 * npm test 를 돌리는 흐름을 막지 않는다).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");

/** 색인 대상 페이지의 HTML. 아트보드는 noindex 라 제외한다. */
function indexablePages(): { path: string; html: string }[] {
  if (!existsSync(DIST)) return [];
  const out: { path: string; html: string }[] = [];
  const walk = (dir: string, rel: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full, `${rel}${name}/`);
      } else if (name === "index.html") {
        out.push({ path: rel, html: readFileSync(full, "utf8") });
      }
    }
  };
  walk(DIST, "/");
  return out.filter(
    (p) =>
      // /cards/<세트>/<번호>/ 는 인스타용 아트보드
      !/^\/cards\/[a-z0-9-]+\/\d+\/$/.test(p.path) &&
      // robots.txt 로 막아둔 곳 — 크롤러가 오지 않는다
      !p.path.startsWith("/oauth/") &&
      !p.path.startsWith("/design/") &&
      !p.path.startsWith("/link/"),
  );
}

const pages = indexablePages();
const has = pages.length > 0;
const one = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? null;

describe.skipIf(!has)("빌드 산출물 SEO 불변식", () => {
  it("모든 페이지에 title 이 있고 slug 가 새어나오지 않는다", () => {
    const bad: string[] = [];
    for (const p of pages) {
      const t = one(p.html, /<title>(.*?)<\/title>/s);
      if (!t) {
        bad.push(`${p.path} — title 없음`);
        continue;
      }
      // slug 는 영소문자와 하이픈뿐이다. 제목에 그 꼴의 낱말이 통째로
      // 들어 있으면 사람이 쓴 제목이 아니라 식별자가 샌 것이다.
      const leaked = t.match(/(?:^|\s)([a-z0-9]+(?:-[a-z0-9]+){1,})(?:\s|$)/);
      if (leaked) bad.push(`${p.path} — slug 누출: ${leaked[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it("title 이 서로 다르다", () => {
    const seen = new Map<string, string[]>();
    for (const p of pages) {
      const t = one(p.html, /<title>(.*?)<\/title>/s) ?? "";
      seen.set(t, [...(seen.get(t) ?? []), p.path]);
    }
    const dups = [...seen].filter(([, v]) => v.length > 1);
    expect(dups).toEqual([]);
  });

  it("description 이 있고 160자를 넘지 않는다", () => {
    // 넘으면 검색결과에서 잘린다. 잘리는 자리가 하필 출처 표기였다.
    const bad = pages
      .map((p) => ({ p, d: one(p.html, /<meta name="description" content="(.*?)"/s) }))
      .filter(({ d }) => !d || d.length > 160)
      .map(({ p, d }) => `${p.path} — ${d ? `${d.length}자` : "없음"}`);
    expect(bad).toEqual([]);
  });

  it("페이지마다 h1 이 정확히 하나다", () => {
    const bad = pages
      .map((p) => ({ path: p.path, n: (p.html.match(/<h1[\s>]/g) ?? []).length }))
      .filter((x) => x.n !== 1)
      .map((x) => `${x.path} — h1 ${x.n}개`);
    expect(bad).toEqual([]);
  });

  it("canonical 이 자기 주소를 가리킨다", () => {
    const bad: string[] = [];
    for (const p of pages) {
      const c = one(p.html, /<link rel="canonical" href="(.*?)"/);
      if (!c) bad.push(`${p.path} — canonical 없음`);
      else if (new URL(c).pathname !== p.path) {
        bad.push(`${p.path} — canonical 이 ${new URL(c).pathname}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("내용을 담은 이미지에 alt 가 있다", () => {
    // alt="" 는 장식용 이미지의 정답이라 통과시킨다. alt 속성 자체가
    // 없는 것만 잡는다 — 그건 스크린리더가 파일명을 읽는다.
    const bad: string[] = [];
    for (const p of pages) {
      for (const tag of p.html.match(/<img\b[^>]*>/g) ?? []) {
        if (!/\balt=/.test(tag)) bad.push(`${p.path} — ${tag.slice(0, 70)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
