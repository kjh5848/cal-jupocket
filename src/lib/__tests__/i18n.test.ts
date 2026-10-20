/**
 * 나라판(/ja/, /en-us/ …) 기초 — 언어는 주소로 정하고, 같은 계산을 하는 페이지끼리만 짝(hreflang)을 맺는다.
 * 짝이 한쪽만 있거나 없는 파일을 가리키면 검색엔진이 hreflang 을 통째로 버린다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { localeOf, UI, formatMoney } from "../../i18n/ui";
import { LOCALE_META, LOCALES, meta, localeOfHtmlLang } from "../../i18n/locales";
import { alternatesFor } from "../../i18n/alternates";
import { toolsByLocale, toolsOf, openLocales } from "../../i18n/registry";

const pageFile = (path: string) => join(process.cwd(), "src/pages", path, "index.astro");

function astroFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? astroFiles(p) : n.endsWith(".astro") ? [p] : [];
  });
}

const foreign = LOCALE_META.filter((m) => m.locale !== "ko");

describe("언어는 주소로 정한다", () => {
  it("판 접두어로 갈린다", () => {
    expect(localeOf("/ja/")).toBe("ja");
    expect(localeOf("/ja/tools/percent/")).toBe("ja");
    expect(localeOf("/en-us/tools/percent/")).toBe("en-us");
    expect(localeOf("/zh-hk/")).toBe("zh-hk");
    expect(localeOf("/de")).toBe("de");
    expect(localeOf("/")).toBe("ko");
    expect(localeOf("/japan-tax/")).toBe("ko");
    expect(localeOf("/guide/de-minimis/")).toBe("ko");
  });
  it("접두어·<html lang>·hreflang·조사표 칸이 판마다 하나씩", () => {
    for (const k of ["prefix", "htmlLang", "hreflang", "column", "code"] as const) {
      const v = LOCALE_META.map((m) => m[k]);
      expect(new Set(v).size, k).toBe(v.length);
    }
    for (const m of LOCALE_META) expect(localeOfHtmlLang(m.htmlLang)).toBe(m.locale);
  });
  it("조사표 칸 이름이 docs/country-matrix.md 머리줄에 있다", () => {
    const head = readFileSync(join(process.cwd(), "docs/country-matrix.md"), "utf8").split("\n").find((l) => l.startsWith("| 도구"))!;
    for (const m of foreign) expect(head, m.column).toContain(` ${m.column} `);
  });
  it("모든 판의 사전 열쇠가 같고 빈 말이 없다(메뉴 '읽을거리'·'카드뉴스'는 한국어판만)", () => {
    const keys = Object.keys(UI.ko).sort();
    for (const l of LOCALES) {
      expect(Object.keys(UI[l]).sort(), l).toEqual(keys);
      if (l === "ko") continue;
      for (const k of ["brand", "navTools", "langName", "footerNote", "homeTitle", "homeH1", "homeLede", "toolsHeading", "copy", "reset"] as const) {
        expect(String(UI[l][k]).trim(), `${l}.${k}`).not.toBe("");
      }
      expect(JSON.stringify(UI[l]), l).not.toMatch(/[가-힣]/);
    }
  });
  it("금액 표기 — 원·円 은 뒤에 단위, 나머지는 그 나라 통화 형식", () => {
    expect(formatMoney("ko", 1234567)).toBe("1,234,567원");
    expect(formatMoney("ja", 1234567)).toBe("1,234,567円");
    expect(formatMoney("en-us", 1234.5)).toBe("$1,234.50");
    expect(formatMoney("en-gb", 1234.5)).toBe("£1,234.50");
  });
});

describe("나라판 도구 목록", () => {
  it("목록 폴더 이름이 판 이름이다", () => {
    const dirs = readdirSync(join(process.cwd(), "src/data"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(process.cwd(), "src/data", d.name, "tools.ts")))
      .map((d) => d.name);
    for (const d of dirs) expect(LOCALES, d).toContain(d);
    expect(Object.keys(toolsByLocale).sort()).toEqual(dirs.sort());
  });
  it("각 도구 주소는 그 판 접두어 아래의 실제 페이지", () => {
    for (const l of LOCALES) {
      for (const t of toolsOf(l)) {
        expect(localeOf(t.href), t.href).toBe(l);
        expect(existsSync(pageFile(t.href)), t.href).toBe(true);
        if (t.ko) expect(existsSync(pageFile(t.ko)), t.ko).toBe(true);
      }
    }
  });
  it("도구가 있는 판만 홈이 있다(빈 홈도, 홈 없는 도구도 없게)", () => {
    for (const m of foreign) {
      const hasHome = existsSync(pageFile(m.prefix));
      expect(hasHome, `${m.prefix} 홈`).toBe(toolsOf(m.locale).length > 0);
      expect(openLocales.includes(m.locale)).toBe(hasHome);
    }
  });
  it("한 판 안에서 같은 한국어판에 둘을 잇지 않는다", () => {
    for (const l of LOCALES) {
      const kos = toolsOf(l).flatMap((t) => (t.ko ? [t.ko] : []));
      expect(new Set(kos).size, l).toBe(kos.length);
    }
  });
});

describe("hreflang 짝", () => {
  it("짝에 든 어느 주소에서 찾아도 같은 짝이 나온다(양방향)", () => {
    for (const l of LOCALES) {
      for (const t of toolsOf(l).filter((x) => x.ko)) {
        const a = alternatesFor(t.href);
        expect(a.ko).toBe(t.ko);
        expect(a[l]).toBe(t.href);
        for (const p of Object.values(a)) expect(alternatesFor(p!)).toEqual(a);
      }
    }
  });
  it("홈끼리 짝 — 열린 판 전부", () => {
    if (openLocales.length < 2) return;
    const a = alternatesFor("/");
    expect(Object.keys(a).sort()).toEqual([...openLocales].sort());
    for (const l of openLocales) expect(alternatesFor(meta(l).prefix)).toEqual(a);
  });
  it("제도 도구(basis law)는 짝이 없다", () => {
    for (const l of LOCALES) for (const t of toolsOf(l).filter((x) => x.basis === "law")) expect(t.ko, t.href).toBeUndefined();
  });
});

describe("나라판 페이지", () => {
  for (const m of foreign) {
    const files = astroFiles(join(process.cwd(), "src/pages", m.prefix));
    if (!files.length) continue;
    it(`${m.prefix} — 모두 <html lang="${m.htmlLang}"> 이거나 LocaleHome`, () => {
      for (const f of files) {
        const s = readFileSync(f, "utf8");
        expect(s.includes(`<html lang="${m.htmlLang}">`) || s.includes(`<LocaleHome locale="${m.locale}"`), f).toBe(true);
      }
    });
    it(`${m.prefix} — 한국어 문장이 새지 않는다(주석·코드 밖 본문)`, () => {
      for (const f of files) {
        const body = readFileSync(f, "utf8").replace(/^---[\s\S]*?---/, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
        expect(body.match(/[가-힣]+/g), f).toBeNull();
      }
    });
  }
});
