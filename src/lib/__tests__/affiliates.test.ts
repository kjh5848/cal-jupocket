/**
 * 제휴 등록부 가드.
 *
 * 추적 링크는 만료되고 바뀐다. 만료된 링크가 글에 남아도 화면에서는 안
 * 보이니 아무도 모른다 — 그래서 만료 14일 전부터 이 테스트가 깨져서
 * 갱신할 때를 알린다. 글에 링크를 직접 박는 것도 여기서 막는다.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { affiliates, affiliateLink, todayKst } from "../../data/affiliates";

const DAY = 86_400_000;
const today = todayKst();

function daysUntil(ymd: string): number {
  return Math.round((Date.parse(ymd) - Date.parse(today)) / DAY);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p, out);
    else if (/[.](astro|md|mdx|ts|tsx|js|html)$/.test(e.name)) out.push(p);
  }
  return out;
}
const pages = walk("src/pages").map((f) => [f, readFileSync(f, "utf8")] as const);

describe("등록부", () => {
  it("id 가 겹치지 않는다", () => {
    const ids = affiliates.map((a) => a.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("켜진 항목은 https 링크와 발급일이 있다", () => {
    const bad = affiliates
      .filter((a) => a.active)
      .filter((a) => !/^https:\/\/\S+$/.test(a.url) || !/^\d{4}-\d{2}-\d{2}$/.test(a.issuedOn))
      .map((a) => a.id);
    expect(bad).toEqual([]);
  });

  it("만료된 항목이 켜져 있지 않다", () => {
    const expired = affiliates
      .filter((a) => a.active && a.expiresOn && a.expiresOn < today)
      .map((a) => `${a.id} (만료 ${a.expiresOn}) — 새 링크로 바꾸거나 active: false`);
    expect(expired).toEqual([]);
  });

  it("켜진 항목의 만료가 14일 안으로 다가오지 않았다", () => {
    const soon = affiliates
      .filter((a) => a.active && a.expiresOn && a.expiresOn >= today && daysUntil(a.expiresOn) <= 14)
      .map((a) => `${a.id} — ${a.expiresOn} 만료(${daysUntil(a.expiresOn!)}일 남음). 네트워크에서 새 링크를 받아 url·issuedOn·expiresOn 갱신`);
    expect(soon).toEqual([]);
  });
});

describe("affiliateLink", () => {
  it("없는 id 는 null", () => {
    expect(affiliateLink("no-such-id", "2026-01-01")).toBeNull();
  });

  it("꺼진 항목은 null", () => {
    for (const a of affiliates.filter((x) => !x.active)) {
      expect(affiliateLink(a.id, today)).toBeNull();
    }
  });

  it("만료일 당일까지는 살아 있고 다음 날 null", () => {
    const a = { ...affiliates[0], id: "__t", active: true, url: "https://example.com/x", issuedOn: "2026-01-01", expiresOn: "2026-02-01" };
    affiliates.push(a);
    try {
      expect(affiliateLink("__t", "2026-02-01")).toBe(a);
      expect(affiliateLink("__t", "2026-02-02")).toBeNull();
    } finally {
      affiliates.pop();
    }
  });
});

describe("글에서 쓰는 방식", () => {
  it("<AffiliateBox id=\"X\" 의 X 가 모두 등록부에 있다", () => {
    const ids = new Set(affiliates.map((a) => a.id));
    const missing: string[] = [];
    for (const [f, src] of pages) {
      for (const m of src.matchAll(/<AffiliateBox\s+id="([^"]*)"/g)) {
        if (!ids.has(m[1])) missing.push(`${f}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("글 본문에 제휴 네트워크 주소를 직접 쓰지 않는다", () => {
    const hits = pages
      .filter(([, src]) => /(dbdbdeep|adlix|dbsense)\.[a-z]/i.test(src))
      .map(([f]) => f);
    expect(hits).toEqual([]);
  });
});
