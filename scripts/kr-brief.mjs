/**
 * 한국 도구 루틴 회차 요약 — tool-backlog.md(3.7만 토큰)·keyword-research.md(11만 토큰)를 통째로 읽지 않게 한 화면으로.
 *
 *   node scripts/kr-brief.mjs
 *
 * 모드(새 도구/보강) · 진행 중 행 · 우선순위 순 다음 후보 · 백로그 현황 · keyword-research 다음 절 번호 · 보관 브랜치.
 * 근거가 더 필요하면 그 줄만 sed -n 'Np' 로 본다. 기록은 >> 로 덧붙이고, 파일을 다시 읽지 않는다.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const common = execSync("git rev-parse --git-common-dir", { encoding: "utf8" }).trim();
const WT = join(resolve(common, "..", ".."), "cal-wt");
const read = (p) => readFileSync(join(root, p), "utf8");
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const cells = (l) => l.trim().replace(/^\||\|$/g, "").split(" | ").map((x) => x.trim());

const mode = existsSync(join(WT, ".kr-mode")) ? readFileSync(join(WT, ".kr-mode"), "utf8").trim() || "new" : "new";
const bl = read("docs/tool-backlog.md").split("\n");
const now = bl.find((l) => l.startsWith("현재:")) ?? "";
const next = bl.find((l) => l.startsWith("다음:")) ?? "";
const rows = bl.map((l, i) => ({ l, i: i + 1 })).filter((x) => /^\| \d+ \|/.test(x.l)).map((x) => {
  const c = cells(x.l);
  return { line: x.i, no: c[0], type: c[1], url: c[3], tool: c[4], state: c[5], ours: c[6] };
});
const progress = rows.filter((r) => r.state === "진행 중");
// 2단계 우선순위(v54 검색량 순) — 도구 이름에 이 말이 들어간 '할 일' 을 먼저
const PRI = ["퇴직금", "대출", "이자", "예금", "적금", "시급", "DSR", "중개보수", "통상임금", "야근", "일용직", "실수령"];
const todo = rows.filter((r) => r.state === "할 일");
const ranked = [...todo].sort((a, b) => {
  const pa = PRI.findIndex((k) => a.tool.includes(k));
  const pb = PRI.findIndex((k) => b.tool.includes(k));
  return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.line - b.line;
});
const kr = read("docs/keyword-research.md").split("\n").filter((l) => l.startsWith("## "));
let wips = [];
try { wips = execSync('git branch --list "wip/kr-*"', { cwd: root, encoding: "utf8" }).split("\n").map((s) => s.replace("*", "").trim()).filter(Boolean); } catch {}

const L = (s) => console.log(s);
L(`# 한국 루틴 — 이번 모드: ${mode}${mode === "improve" ? " (보강 회차 — 새 페이지 없음)" : " (새 도구 회차)"}`);
L(cut(now, 200));
L(cut(next, 300));
if (wips.length) L(`▶ 보관 브랜치: ${wips.join(" ")} — 이것부터 올린다`);
if (progress.length) L(`▶ 진행 중: ${progress.map((r) => `L${r.line} #${r.no} ${r.tool}`).join(" · ")}`);
L(`\n## 다음 후보(우선순위 순, backlog 줄 번호)`);
for (const r of ranked.slice(0, 6)) L(`- L${r.line} #${r.no} ${cut(r.tool, 30)} · ${r.type} · ${r.url}`);
L(`\n## keyword-research.md 마지막 절: ${cut(kr.at(-1) ?? "", 90)}`);
L(`→ 새 절은 cat >> docs/keyword-research.md 로 덧붙인다(파일을 열어 읽지 않는다)`);
L(`\n큰 파일(tool-backlog·keyword-research·calc-benchmark·country-matrix)은 통째로 cat 하지 않는다 — grep -n 이나 sed -n 'Np'.`);
