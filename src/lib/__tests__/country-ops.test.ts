/**
 * 루틴 동시 실행 안전장치(2026-10-20) — 나라판 루틴 13개가 같은 파일을 동시에 고치다 충돌한 뒤 만든 것.
 * 내 파일 검사(scripts/country/paths.mjs)와 공용 잠금(scripts/country/lock.mjs).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
// @ts-expect-error — node 스크립트(.mjs)
import { classify, checkPaths, localeTable } from "../../../scripts/country/paths.mjs";
// @ts-expect-error — node 스크립트(.mjs)
import { tryAcquire, release, holder, locksDir, STALE_MIN } from "../../../scripts/country/lock.mjs";

describe("내 파일 검사", () => {
  it("판 표를 locales.ts 에서 읽는다", () => {
    const t = localeTable(process.cwd());
    expect(t.us).toBe("en-us");
    expect(t.jp).toBe("ja");
    expect(t.tw).toBe("zh-tw");
    expect(t.kr).toBe("ko");
    expect(Object.keys(t).length).toBe(14);
  });
  it("나라 파일은 own, 공유 산술 스크립트는 shared, 나머지는 forbidden", () => {
    expect(classify("us", "en-us", "src/pages/en-us/tools/percent/index.astro")).toBe("own");
    expect(classify("us", "en-us", "src/data/en-us/tools.ts")).toBe("own");
    expect(classify("us", "en-us", "src/rates/us/fica-2026.json")).toBe("own");
    expect(classify("us", "en-us", "src/lib/us/fica.ts")).toBe("own");
    expect(classify("us", "en-us", "src/lib/__tests__/us-fica.test.ts")).toBe("own");
    expect(classify("us", "en-us", "docs/countries/us.md")).toBe("own");
    expect(classify("us", "en-us", "keywords/us-percent-2026-10-20.csv")).toBe("own");
    expect(classify("jp", "ja", "keywords/ja-age-2026-10-19.csv")).toBe("own");
    expect(classify("us", "en-us", "src/scripts/percent.ts")).toBe("shared");
    expect(classify("us", "en-us", "src/lib/percent.ts")).toBe("shared");
    expect(classify("us", "en-us", "src/lib/__tests__/percent.test.ts")).toBe("shared");
    for (const f of [
      "src/pages/en-gb/tools/percent/index.astro",
      "src/pages/guide/vat/index.astro",
      "src/i18n/ui.ts",
      "src/components/SiteHeader.astro",
      "docs/country-matrix.md",
      "docs/countries/gb.md",
      "social/posted.json",
      ".claude/launch.json",
      "package.json",
      "src/rates/vat-2026.json",
    ]) expect(classify("us", "en-us", f), f).toBe("forbidden");
  });
  it("한국 루틴(kr)은 social·.claude·package 만 막는다", () => {
    expect(classify("kr", "ko", "src/i18n/ui.ts")).toBe("own");
    expect(classify("kr", "ko", "docs/country-matrix.md")).toBe("own");
    expect(classify("kr", "ko", "social/stats.json")).toBe("forbidden");
    expect(classify("kr", "ko", ".claude/agents/country-runner.md")).toBe("own");
    expect(classify("kr", "ko", ".claude/launch.json")).toBe("forbidden");
    expect(classify("us", "en-us", ".claude/agents/country-runner.md")).toBe("forbidden");
  });
  it("공유 파일은 잠금을 잡았을 때만 통과", () => {
    const files = ["src/pages/de/tools/percent/index.astro", "src/scripts/percent.ts"];
    expect(checkPaths("de", "de", files).ok).toBe(false);
    expect(checkPaths("de", "de", files, { allowShared: true })).toEqual({ ok: true, bad: [], shared: ["src/scripts/percent.ts"] });
  });
});

describe("공용 잠금", () => {
  let dir = "";
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cal-wt-"));
    process.env.CAL_WT = dir;
  });
  afterEach(() => {
    delete process.env.CAL_WT;
    rmSync(dir, { recursive: true, force: true });
  });
  it("한 번에 하나만 잡는다 · 같은 주인은 다시 잡아도 된다 · 남의 잠금은 못 푼다", () => {
    expect(locksDir()).toBe(join(dir, ".locks"));
    expect(tryAcquire("main", "us")).toBe(true);
    expect(tryAcquire("main", "gb")).toBe(false);
    expect(tryAcquire("main", "us")).toBe(true);
    expect(holder("main")).toMatch(/^us /);
    expect(release("main", "gb")).toBe(false);
    expect(release("main", "us")).toBe(true);
    expect(tryAcquire("main", "gb")).toBe(true);
  });
  it("주인 이름이 앞부분만 같아도 남이다(us ≠ us2)", () => {
    expect(tryAcquire("main", "us2")).toBe(true);
    expect(tryAcquire("main", "us")).toBe(false);
    expect(release("main", "us")).toBe(false);
  });
  it(`${STALE_MIN}분 넘게 묵은 잠금은 멈춘 회차로 보고 빼앗는다`, () => {
    expect(tryAcquire("main", "fr")).toBe(true);
    const old = new Date(Date.now() - (STALE_MIN + 5) * 60000);
    utimesSync(join(dir, ".locks", "main"), old, old);
    expect(tryAcquire("main", "es")).toBe(true);
    expect(holder("main")).toMatch(/^es /);
    expect(existsSync(join(dir, ".locks", "main"))).toBe(true);
  });
});

describe("나라 기록 파일 다이어트(2026-10-24)", () => {
  it("기록 메모는 300자 이내 — 긴 설명은 커밋 메시지·archive 로", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const bad: string[] = [];
    for (const f of readdirSync("docs/countries").filter((n) => n.endsWith(".md"))) {
      for (const l of readFileSync(join("docs/countries", f), "utf8").split("\n")) {
        if (!/^\| \d{4}-\d{2}-\d{2} /.test(l)) continue;
        const memo = l.trim().replace(/^\||\|$/g, "").split(" | ").slice(5).join(" | ");
        if (memo.length > 300) bad.push(`${f}: ${l.slice(0, 60)}… (${memo.length}자)`);
      }
    }
    expect(bad).toEqual([]);
  });
});
