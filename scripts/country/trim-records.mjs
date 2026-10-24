/**
 * 나라 기록 파일 다이어트 — docs/countries/<code>.md 의 긴 메모를 보관 파일로 옮기고 본문은 짧게 남긴다.
 *
 *   node scripts/country/trim-records.mjs [--max 160]
 *
 * 기록 메모가 한 줄 500~1,500자라 파일이 나라당 1.5만 토큰까지 커졌고, 에이전트가 회차마다 그것을 읽었다(2026-10-24 측정).
 * 원문 메모는 docs/countries/archive/<code>.md 에 그대로 덧붙여 잃지 않는다. 이후 메모는 200자 이내로 쓴다(i18n 테스트가 300자에서 막는다).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const max = Number(process.argv[process.argv.indexOf("--max") + 1]) || 160;
const dir = "docs/countries";
mkdirSync(join(dir, "archive"), { recursive: true });
for (const f of readdirSync(dir).filter((n) => n.endsWith(".md"))) {
  const p = join(dir, f);
  const lines = readFileSync(p, "utf8").split("\n");
  const moved = [];
  const out = lines.map((l) => {
    if (!/^\| \d{4}-\d{2}-\d{2} /.test(l)) return l;
    const c = l.trim().replace(/^\||\|$/g, "").split(" | ");
    const memo = c.slice(5).join(" | ").trim();
    if (memo.length <= max) return l;
    moved.push(l);
    c.splice(5, c.length - 5, memo.slice(0, max - 12).trimEnd() + " …(보관)");
    return `| ${c.map((x) => x.trim()).join(" | ")} |`;
  });
  if (!moved.length) continue;
  const arch = join(dir, "archive", f);
  if (!existsSync(arch)) writeFileSync(arch, `# ${f.replace(".md", "")} 기록 원문 보관\n\n본 기록(\`docs/countries/${f}\`)에서 줄인 메모의 원문. 날짜·도구로 찾는다.\n\n| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |\n|---|---|---|---|---|---|\n`);
  appendFileSync(arch, moved.join("\n") + "\n");
  writeFileSync(p, out.join("\n"));
  console.log(`${f}: ${moved.length}줄 줄임`);
}
