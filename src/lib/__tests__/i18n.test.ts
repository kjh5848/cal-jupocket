/**
 * 일본어판(/ja/) 기초 — 언어는 주소로 정하고, 같은 계산을 하는 페이지끼리만 짝(hreflang)을 맺는다.
 * 짝이 한쪽만 있거나 없는 파일을 가리키면 검색엔진이 hreflang 을 통째로 버린다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { localeOf, UI } from "../../i18n/ui";
import { PAIRS, alternatesFor } from "../../i18n/alternates";
import { jaTools } from "../../data/ja/tools";

const pageFile = (path: string) => join(process.cwd(), "src/pages", path, "index.astro");

function astroFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? astroFiles(p) : n.endsWith(".astro") ? [p] : [];
  });
}

describe("언어는 주소로 정한다", () => {
  it("/ja/ 아래만 일본어", () => {
    expect(localeOf("/ja/")).toBe("ja");
    expect(localeOf("/ja/tools/percent/")).toBe("ja");
    expect(localeOf("/")).toBe("ko");
    expect(localeOf("/japan-tax/")).toBe("ko");
  });
  it("두 사전의 열쇠가 같다(한쪽에만 있는 말이 없게)", () => {
    expect(Object.keys(UI.ja).sort()).toEqual(Object.keys(UI.ko).sort());
  });
});

describe("hreflang 짝", () => {
  it("짝마다 한국어판·일본어판 파일이 다 있다", () => {
    for (const p of PAIRS) {
      expect(existsSync(pageFile(p.ko)), p.ko).toBe(true);
      expect(existsSync(pageFile(p.ja)), p.ja).toBe(true);
      expect(localeOf(p.ja)).toBe("ja");
      expect(localeOf(p.ko)).toBe("ko");
    }
  });
  it("양쪽 어디서 찾아도 같은 짝이 나온다", () => {
    for (const p of PAIRS) {
      expect(alternatesFor(p.ko)).toEqual(alternatesFor(p.ja));
    }
  });
  it("한 주소는 한 짝에만", () => {
    const all = PAIRS.flatMap((p) => [p.ko, p.ja]);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("일본어판 페이지", () => {
  const files = astroFiles(join(process.cwd(), "src/pages/ja"));
  it("모두 <html lang=\"ja\">", () => {
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(readFileSync(f, "utf8"), f).toContain('<html lang="ja">');
  });
  it("한국어 문장이 새지 않는다(주석·코드 밖 본문)", () => {
    for (const f of files) {
      const body = readFileSync(f, "utf8").replace(/^---[\s\S]*?---/, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(body.match(/[가-힣]+/g), f).toBeNull();
    }
  });
  it("도구 목록의 주소가 실제 페이지다", () => {
    for (const t of jaTools) expect(existsSync(pageFile(t.href)), t.href).toBe(true);
  });
});
