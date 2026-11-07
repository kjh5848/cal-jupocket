#!/usr/bin/env node
/**
 * 쪼갠 글 합치기 — 한 묶음의 하위 글을 허브 글의 섹션 부품으로 옮긴다(2026-11-07).
 *
 *   node scripts/merge/merge-group.mjs <허브 slug> <하위 slug> [<하위 slug> ...]
 *
 * 하는 일(하위 글마다):
 *   1. src/pages/guide/<sib>/index.astro → src/components/merged/<hub>/<Sib>.astro
 *      - GuideLayout·AnswerBox·AdSlot 를 걷어내고 본문만 남긴다(h1·한 줄 답·광고 칸·'이 글에 없는 것' 제거)
 *      - h2 → h3 (허브에서 섹션 제목 h2 아래에 들어간다)
 *      - 계산 코드(frontmatter)는 그대로 — 숫자를 새로 쓰지 않는다
 *   2. 원래 페이지 폴더를 지운다
 *   3. public/_redirects: /guide/<sib>/ → /guide/<hub>/#<sib> 301 추가, 옛 규칙의 도착지도 바꾼다
 *   4. src 전체의 링크 /guide/<sib>/ → /guide/<hub>/#<sib>
 *   5. clusters.ts: 하위 글 링크 줄과 목록 줄 삭제 / linkhub.ts: 번호는 두고 href 만 #섹션으로, 목록 줄 삭제
 *   6. series/*.ts: 그 slug 항목 줄 삭제
 *
 * 허브 글 본문에 섹션을 끼우는 일은 사람이(Claude가) 한다 — 순서·제목을 묶음마다 정해야 해서.
 * 끝나면 "허브에 넣을 import 와 섹션" 예시를 찍는다.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const [hub, ...sibs] = process.argv.slice(2);
if (!hub || !sibs.length) {
  console.error("사용: node scripts/merge/merge-group.mjs <허브 slug> <하위 slug> ...");
  process.exit(1);
}
const pascal = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("").replace(/^(\d)/, "N$1");
const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s);
const walk = (d, out = []) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p, out) : /\.(astro|ts|mjs)$/.test(f) && out.push(p);
  }
  return out;
};

const compDir = `src/components/merged/${hub}`;
mkdirSync(compDir, { recursive: true });
const made = [];

for (const sib of sibs) {
  const page = `src/pages/guide/${sib}/index.astro`;
  if (!existsSync(page)) throw new Error(`없음: ${page}`);
  let s = read(page);
  const [, fm, body] = s.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
  if (!fm) throw new Error(`frontmatter 못 읽음: ${page}`);

  let f = fm
    .replace(/^import GuideLayout .*\n/m, "")
    .replace(/^import AnswerBox .*\n/m, "")
    .replace(/^import AdSlot .*\n/m, "")
    .replace(/\.\.\/\.\.\/\.\.\//g, "../../../");
  // 부품은 src/components/merged/<hub>/ 에 있다 — 페이지와 같은 깊이(3단)라 상대 경로 그대로 맞는다
  f = `/* 합친 글 섹션 — 원래 /guide/${sib}/ (2026-11-07, scripts/merge/merge-group.mjs) */\n` + f;

  let b = body
    .replace(/^\s*<GuideLayout[^>]*>\s*\n/m, "")
    .replace(/\n?\s*<\/GuideLayout>\s*$/m, "\n")
    .replace(/^\s*<h1>[\s\S]*?<\/h1>\s*\n/m, "")
    .replace(/^\s*<AnswerBox[^>]*\/>\s*\n/m, "")
    .replace(/^\s*<AdSlot[^>]*\/>\s*\n/gm, "")
    .replace(/<h2([^>]*)>/g, "<h3$1>")
    .replace(/<\/h2>/g, "</h3>");
  // '이 글에 없는 것' 블록(그다음 h3 또는 끝까지)은 합친 글에선 뺀다
  b = b.replace(/\s*<h3>이 글에 없는 것<\/h3>[\s\S]*?(?=\n\s*<h3|\s*$)/, "\n");

  const name = pascal(sib);
  write(join(compDir, `${name}.astro`), `---\n${f}\n---\n${b.trimEnd()}\n`);
  rmSync(`src/pages/guide/${sib}`, { recursive: true });
  made.push({ sib, name });
}

/* 3. 리다이렉트 */
let red = read("public/_redirects");
for (const { sib } of made) {
  red = red.replaceAll(` /guide/${sib}/ `, ` /guide/${hub}/#${sib} `).replace(new RegExp(`(\\s)/guide/${sib}/(\\s+301)`, "g"), `$1/guide/${hub}/#${sib}$2`);
}
red = red.trimEnd() + `\n\n# 합치기 ${hub} (2026-11-07)\n` + made.map(({ sib }) => `/guide/${sib}/ /guide/${hub}/#${sib} 301`).join("\n") + "\n";
write("public/_redirects", red);

/* 4~6. 소스 전체 */
for (const p of walk("src")) {
  if (p.includes("__tests__")) continue;
  let s = read(p);
  const before = s;
  for (const { sib } of made) {
    const href = `/guide/${sib}/`;
    const to = `/guide/${hub}/#${sib}`;
    if (p.endsWith("clusters.ts")) {
      s = s.replace(new RegExp(`\\n\\s*\\{ href: "${href}"[^\\n]*`, "g"), "");
      s = s.replace(new RegExp(`\\n\\s*"${href}",`, "g"), "");
    } else if (p.endsWith("linkhub.ts")) {
      s = s.replaceAll(`href: "${href}"`, `href: "${to}"`);
      s = s.replace(new RegExp(`"/guide/${sib}/?",\\s?`, "g"), "");
      s = s.replace(new RegExp(`\\n\\s*"/guide/${sib}/?",?`, "g"), "");
    } else if (p.includes(`${join("data", "series")}`)) {
      s = s.replace(new RegExp(`\\n\\s*\\{ slug: "${sib}"[^\\n]*`, "g"), "");
    } else {
      s = s.replaceAll(`"${href}"`, `"${to}"`).replaceAll(`href="${href}"`, `href="${to}"`).replaceAll(href, to);
    }
  }
  if (s !== before) write(p, s);
}

console.log(`✓ ${made.length}편을 ${compDir}/ 로 옮김. 허브(src/pages/guide/${hub}/index.astro)에 넣을 것:\n`);
for (const { sib, name } of made) console.log(`import ${name} from "../../../components/merged/${hub}/${name}.astro";`);
console.log("");
for (const { sib, name } of made) console.log(`<section id="${sib}"><h2>…</h2><${name} /></section>`);
