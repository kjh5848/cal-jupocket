/**
 * 글 slug → 그 글의 소스 파일(2026-11-07 쪼갠 글 합치기).
 *
 * 합친 글은 src/pages/guide/<slug>/ 에서 src/components/merged/<허브>/<부품>.astro 로 옮겨졌다.
 * 부품 맨 위에 "원래 /guide/<slug>/" 주석이 있어(scripts/merge/merge-group.mjs) 그것으로 찾는다.
 * 제목·설명·숫자 검사는 부품 파일에서 그대로 돈다 — 숫자는 옮기면서 바꾸지 않았다.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

let index: Map<string, string> | null = null;

function mergedIndex(): Map<string, string> {
  if (index) return index;
  index = new Map();
  const root = "src/components/merged";
  if (!existsSync(root)) return index;
  for (const hub of readdirSync(root)) {
    for (const f of readdirSync(join(root, hub))) {
      const p = join(root, hub, f);
      // "원래 /guide/<slug>/" 또는 링크 치환을 거친 "원래 /guide/<허브>/#<slug>"
      const t = readFileSync(p, "utf-8");
      const m = t.match(/원래 \/guide\/[^/\s]+\/#([a-z0-9-]+)/) ?? t.match(/원래 \/guide\/([^/\s#]+)\//) ?? t.match(/원래 주소 guide\/([a-z0-9-]+)/);
      if (m) index.set(m[1], p);
    }
  }
  return index;
}

export function guideSource(slug: string): string {
  const page = `src/pages/guide/${slug}/index.astro`;
  if (existsSync(page)) return page;
  return mergedIndex().get(slug) ?? page;
}
