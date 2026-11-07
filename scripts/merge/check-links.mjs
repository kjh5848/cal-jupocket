#!/usr/bin/env node
/**
 * 빌드 결과(dist)에서 /guide/<slug>/ 로 가는 링크 중 페이지가 없는 것을 찾는다(2026-11-07 합치기 점검).
 *   npm run build && node scripts/merge/check-links.mjs
 */
import { readdirSync, statSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && files.push(p);
  }
})("dist");

const bad = {};
for (const f of files) {
  const h = readFileSync(f, "utf8");
  for (const m of h.matchAll(/href="(\/guide\/[a-z0-9-]+\/)(#[^"]*)?"/g)) {
    if (!existsSync(join("dist", m[1], "index.html"))) (bad[m[1]] ??= new Set()).add(relative("dist", f).replaceAll("\\", "/"));
  }
}
const keys = Object.keys(bad);
if (!keys.length) console.log("✓ 내부 링크 끊김 없음");
else {
  for (const k of keys) console.log(`✖ ${k} ← ${[...bad[k]].slice(0, 3).join(", ")}`);
  process.exitCode = 1;
}
