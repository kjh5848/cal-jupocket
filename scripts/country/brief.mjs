/**
 * 나라판 회차 요약 — 에이전트가 큰 문서(조사표 4만 토큰·기록 파일 1.5만 토큰)를 통째로 읽지 않게 한 화면으로 준다.
 *
 *   node scripts/country/brief.mjs <code>          설정 · 한 일 · 다음 후보 · 보관 브랜치 · 내 파일
 *   node scripts/country/brief.mjs <code> --next   다음 할 일 종류만 한 줄(JSON) — 배차 루틴이 모델을 고를 때
 *
 * 왜(2026-10-24): 나라 에이전트 100회를 재 보니 기록 파일 131만 자·조사표 98만 자·절차 문서 74만 자를 읽었고,
 * 턴마다 그 문맥을 다시 읽었다. 이 요약 하나로 대신한다. 근거가 더 필요할 때만 그 행을 grep 한다.
 *
 * 다음 할 일 종류(country-routine 1단계 순서):
 *   resume   내 보관 브랜치(wip/<code>-*) 이어 올리기      → opus
 *   progress 기록에 '진행 중' 행                          → 그 행 판정에 따라
 *   page     ① 같음·단위인데 아직 안 한 도구                → sonnet (산술 도구 페이지)
 *   law      ② 검증 끝난 rates 초안이 있고 lib 가 아직 없음  → opus (그 나라 제도 페이지)
 *   draft    ③ 제도 — 초안 보강                            → sonnet
 *   judge    ④ 미확인 — 판정                               → sonnet
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { localeTable } from "./paths.mjs";

const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const cells = (line) => line.trim().replace(/^\||\|$/g, "").split(" | ").map((x) => x.trim());
const status = (cell) => (cell.match(/^(같음|단위|제도|없음|미확인)/) ?? [, "?"])[1];
// 같은 도구를 조사표와 기록이 다르게 적는다("근로장려금(가구별…)" ↔ "근로장려금 → Earned…", "퍼센트" ↔ "퍼센트(…, #211)").
// #번호들과 첫 낱말을 모두 열쇠로 쓴다
const keys = (s) => [...(s.match(/#\d+/g) ?? []), s.split(/[\s(→—·,]/)[0]].filter(Boolean);

export function brief(root, code) {
  const locale = localeTable(root)[code];
  if (!locale) throw new Error(`모르는 나라 코드: ${code}`);
  const md = readFileSync(join(root, "docs/countries", `${code}.md`), "utf8");
  const settings = md.slice(md.indexOf("## 설정"), md.indexOf("## 기록")).trim();
  const column = (settings.match(/조사표 칸 \| ([^|]+) \|/) ?? [, ""])[1].trim();
  const rows = md
    .slice(md.indexOf("## 기록"))
    .split("\n")
    .filter((l) => /^\| \d{4}-\d{2}-\d{2} /.test(l))
    .map((l) => {
      const c = cells(l);
      return { date: c[0], tool: c[1], verdict: c[2], state: c[3], addr: c[4] };
    });
  // 발행·판정·보류로 끝난 도구는 다시 고르지 않는다. 보강만 한 제도 도구는 ③에 남는다(초안을 더 채우거나 페이지로)
  const finished = rows.filter((r) => /^(발행|판정|보류|있음)/.test(r.state));
  const doneKeys = new Set(finished.flatMap((r) => keys(r.tool)));
  // 산술 도구는 주소 꼬리가 같다(/tools/date-diff/ ↔ /en-us/tools/date-diff/)
  const doneTails = new Set(finished.map((r) => (r.addr.match(/\/tools\/[^/\s]+\//) ?? [])[0]).filter(Boolean));
  const draftedKeys = new Set(rows.filter((r) => /^보강/.test(r.state)).flatMap((r) => keys(r.tool)));
  const isDone = (tool, ko) => keys(tool).some((k) => doneKeys.has(k)) || doneTails.has((ko.match(/\/tools\/[^/\s]+\//) ?? [])[0]);
  const progress = rows.find((r) => /^진행 중/.test(r.state));

  const mx = readFileSync(join(root, "docs/country-matrix.md"), "utf8").split("\n");
  const head = cells(mx.find((l) => l.startsWith("| 도구")));
  const ci = head.indexOf(column);
  const cand = { page: [], draft: [], judge: [] };
  mx.forEach((l, i) => {
    if (!l.startsWith("| ") || l.startsWith("| 도구") || l.startsWith("|---")) return;
    const c = cells(l);
    if (c.length <= ci) return;
    const st = status(c[ci]);
    const item = { line: i + 1, tool: cut(c[0], 40), ko: c[1], st, drafted: keys(c[0]).some((k) => draftedKeys.has(k)) };
    if (isDone(c[0], c[1])) return;
    // 한국어판이 글 안의 절(#…)이면 hreflang 짝·스크립트 공유가 안 된다 — 나라마다 '보류(짝 없음)'을 반복했다
    if ((st === "같음" || st === "단위") && c[1].includes("#")) return;
    if (st === "같음" || st === "단위") cand.page.push(item);
    else if (st === "제도") cand.draft.push(item);
    else if (st === "미확인") cand.judge.push(item);
  });

  // 검증 끝난(draft 아님·notVerified 비어 있음) rates 중 아직 어느 lib 도 안 쓰는 것 → 제도 페이지 후보
  const ratesDir = join(root, "src/rates", code);
  const libDir = join(root, "src/lib", code);
  const libSrc = existsSync(libDir) ? readdirSync(libDir).map((f) => readFileSync(join(libDir, f), "utf8")).join("\n") : "";
  const law = [];
  for (const f of existsSync(ratesDir) ? readdirSync(ratesDir) : []) {
    try {
      const j = JSON.parse(readFileSync(join(ratesDir, f), "utf8"));
      const nv = Array.isArray(j.notVerified) ? j.notVerified.length : j.notVerified ? 1 : 0;
      if (j.draft !== true && nv === 0 && !libSrc.includes(f)) law.push(f);
    } catch { /* 깨진 json 은 에이전트가 볼 일 */ }
  }

  let wips = [];
  try {
    wips = execSync(`git branch --list "wip/${code}-*"`, { cwd: root, encoding: "utf8" }).split("\n").map((s) => s.replace("*", "").trim()).filter(Boolean);
  } catch { /* 저장소 밖 */ }

  let next;
  if (wips.length) next = { kind: "resume", model: "opus", what: wips[0] };
  else if (progress) next = { kind: "progress", model: /제도/.test(progress.verdict) && /발행|페이지/.test(progress.state + progress.addr) ? "opus" : "sonnet", what: progress.tool };
  else if (cand.page.length) next = { kind: "page", model: "sonnet", what: cand.page[0].tool };
  else if (law.length) next = { kind: "law", model: "opus", what: law[0] };
  else if (cand.draft.length) next = { kind: "draft", model: "sonnet", what: cand.draft[0].tool };
  else if (cand.judge.length) next = { kind: "judge", model: "sonnet", what: cand.judge[0].tool };
  else next = { kind: "none", model: "sonnet", what: "" };

  return { code, locale, column, settings, rows, progress, cand, law, wips, next };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const code = process.argv[2];
  const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  const b = brief(root, code);
  if (process.argv.includes("--next")) {
    console.log(JSON.stringify({ code, ...b.next }));
    process.exit(0);
  }
  const L = (s) => console.log(s);
  L(`# ${code} (${b.locale}) — 조사표 칸 '${b.column}'`);
  L(b.settings.replace(/^## 설정\s*/, ""));
  L(`\n## 한 일 ${b.rows.length}건 (최근 8건, 메모 생략 — 자세한 건 grep)`);
  for (const r of b.rows.slice(-8)) L(`- ${r.date} ${cut(r.tool, 30)} · ${r.verdict} · ${r.state} · ${r.addr}`);
  if (b.progress) L(`\n▶ 진행 중: ${b.progress.tool} (${b.progress.verdict})`);
  if (b.wips.length) L(`\n▶ 보관 브랜치: ${b.wips.join(" ")} — 이것부터`);
  const show = (t, list) => {
    L(`\n## ${t} ${list.length}건${list.length ? " (위에서부터, 조사표 줄 번호)" : ""}`);
    for (const x of list.slice(0, 6)) L(`- L${x.line} ${x.tool} · 한국어판 ${x.ko} · ${x.st}${x.drafted ? " · 보강한 적 있음" : ""}`);
  };
  show("① 같음·단위 — 페이지", b.cand.page);
  L(`\n## ② 검증 끝난 rates 초안(아직 lib 없음) ${b.law.length}건${b.law.length ? ": " + b.law.join(", ") : ""}`);
  show("③ 제도 — 초안 보강/판정 보강", b.cand.draft);
  show("④ 미확인 — 판정", b.cand.judge);
  L(`\n▶ 다음: ${b.next.kind} — ${b.next.what} (모델 ${b.next.model})`);
  L(`\n내 파일: src/pages/${b.locale}/ · src/data/${b.locale}/ · src/rates/${code}/ · src/lib/${code}/ · src/lib/__tests__/${code}-* · docs/countries/${code}.md · keywords/${code}-*`);
  L(`조사표 행 근거가 필요하면: sed -n '<줄번호>p' docs/country-matrix.md | cut -c1-1500 (통째로 cat 하지 않는다)`);
}
