/**
 * 디자인 토큰 가드.
 *
 * 오늘 두 번 터진 걸 막으려고 둔다. 허브에서 존재하지 않는 변수(--card,
 * --surface-2)를 써서 다크모드에 흰 카드 + 밝은 글씨가 나왔고, 모서리는
 * 28곳에 12가지 값이 흩어져 있었다. 둘 다 사람 눈으로는 안 잡힌다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

/** 1080×1350 아트보드는 웹 스케일과 좌표계가 다르다 — 자체 값을 쓴다. */
const EXEMPT = ["src/components/CardArtboard.astro"];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out);
    else if (/[.](css|astro)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * 블록 주석을 걷어낸다. 주석에 적어둔 규칙 설명("transition: all 은 쓰지
 * 않는다")이 위반으로 잡히면 안 된다. 정규식 대신 문자열 탐색을 쓴다.
 */
function stripComments(s: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const start = s.indexOf("/*", i);
    if (start === -1) return out + s.slice(i);
    out += s.slice(i, start);
    const end = s.indexOf("*/", start + 2);
    if (end === -1) return out;
    i = end + 2;
  }
}

const files = walk("src");
const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
/**
 * 검사 대상을 CSS 로 좁힌다.
 *
 * .astro 는 마크업과 본문 텍스트가 섞여 있어서 파일 전체를 훑으면
 * 규칙을 설명하는 글("transition: all 금지")이나 토큰을 동적으로 넘기는
 * 인라인 스타일(style={`border-radius:var(${r})`})까지 위반으로 잡힌다.
 * 실제로 참조 페이지가 그렇게 걸렸다. <style> 블록만 본다.
 */
function cssOf(file: string, src: string): string {
  if (file.endsWith(".css")) return src;
  const blocks: string[] = [];
  for (const m of src.matchAll(/<style[^>]*>([^]*?)<[/]style>/g)) {
    blocks.push(m[1]);
  }
  return blocks.join(String.fromCharCode(10));
}

const css = new Map(
  [...sources].map(([f, s]) => [f, stripComments(cssOf(f, s))]),
);
const all = [...sources.values()].join(String.fromCharCode(10));

describe("stripComments", () => {
  it("블록 주석만 걷어낸다", () => {
    expect(stripComments("a /* b */ c")).toBe("a  c");
    expect(stripComments("a c")).toBe("a c");
  });
});

describe("CSS 변수", () => {
  it("쓰는 변수가 전부 어딘가에 정의돼 있다", () => {
    const defined = new Set<string>();
    for (const m of all.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
    // Astro 의 define:vars={{ key: ... }} 는 --key 로 나간다. 값 안에 } 가
    // 들어갈 수 있어(템플릿 리터럴) 마지막 }} 까지 게으르게 잡는다.
    for (const b of all.matchAll(/define:vars=\{\{([\s\S]*?)\}\}/g)) {
      for (const k of b[1].matchAll(/([a-zA-Z0-9_]+)\s*:/g)) defined.add(k[1]);
    }

    const missing: Record<string, string[]> = {};
    for (const [file, src] of css) {
      for (const m of src.matchAll(/var\(\s*--([a-zA-Z0-9-]+)/g)) {
        if (defined.has(m[1])) continue;
        missing[m[1]] ??= [];
        if (!missing[m[1]].includes(file)) missing[m[1]].push(file);
      }
    }
    expect(missing).toEqual({});
  });
});

/**
 * 퍼센트로만 쓴 값은 모서리 스케일이 아니라 형태 정의다.
 * 원(50%)이나 블롭(58% 42% 47% 53% / 46% ...)이 여기 해당한다.
 * px 는 스케일을 강제하고, % 는 형태라서 통과시킨다.
 */
function isShape(v: string): boolean {
  return /^[0-9%. /]+$/.test(v) && v.includes("%");
}

describe("모서리 스케일", () => {
  const ALLOWED = [
    "var(--r-xs)",
    "var(--r-sm)",
    "var(--r-md)",
    "var(--r-lg)",
    "var(--r-pill)",
    "0",
    "inherit",
  ];

  it("스케일 밖 값을 쓰지 않는다", () => {
    const offScale: string[] = [];
    for (const [file, src] of css) {
      if (EXEMPT.includes(file)) continue;
      for (const m of src.matchAll(/border-radius:\s*([^;}]+)[;}]/g)) {
        const v = m[1].trim();
        if (ALLOWED.includes(v) || isShape(v)) continue;
        offScale.push(`${file}: ${v}`);
      }
    }
    expect(offScale).toEqual([]);
  });

  it("스케일이 네 단계 + pill 로 유지된다", () => {
    const css = sources.get("src/styles/global.css")!;
    for (const t of ["--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-pill"]) {
      expect(css).toContain(`${t}:`);
    }
  });
});

describe("모션", () => {
  it("transition: all 을 쓰지 않는다 — 무엇이 움직이는지 적어야 한다", () => {
    const hits: string[] = [];
    for (const [file, src] of css) {
      if (/transition:\s*all\b/.test(src)) hits.push(file);
    }
    expect(hits).toEqual([]);
  });
});
