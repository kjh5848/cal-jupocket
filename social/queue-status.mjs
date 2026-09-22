/**
 * 큐와 스케줄러 상태를 한 화면에 보여준다.
 *
 *   node social/queue-status.mjs
 *
 * 예약 발행은 사람 눈에 안 보이는 곳에서 돈다. 뭐가 언제 나갔고 다음이
 * 무엇인지 매번 posted.json 과 큐 파일을 열어 맞춰보게 되면 결국 안 보게
 * 되고, 그러면 빠진 것도 중복도 모르고 지나간다.
 *
 * 아무것도 게시하지 않는다 — 읽기만 한다.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  parsePost,
  parseAt,
  isDue,
  findBodyLink,
  textLength,
  DUE_GRACE_MIN,
  TEXT_TARGET,
} from "./parse.mjs";

/**
 * 답글 계측이 빠졌는지 본다.
 *
 * 전에는 "답글 링크가 /link/ 를 가리키는가" 를 봤다. 이제 링크는 손으로
 * 쓰지 않는다 — ref 를 보고 플랫폼마다 자동으로 붙는다(parse.mjs). 그래서
 * 검사할 것이 바뀌었다: ref 가 없으면 그 글은 계측 없이 나간다. 한 번
 * 나가면 소급해 붙일 수 없어서 그 기간 데이터가 통째로 사라진다.
 */
function replyProblem(meta) {
  if (typeof meta?.reply !== "string") return null;
  if (!meta.ref) return "ref: 없음 — 유입 계측이 빠진다";
  // 링크는 자동으로 붙는다. 손으로 쓴 링크가 남아 있으면 두 번 붙는다.
  const left = meta.reply.match(/jupocket\.com[^\s]*/g);
  return left ? `답글에 손으로 쓴 링크: ${left[0]}` : null;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const QUEUE_DIR = join(HERE, "queue");
const TASK = "jupocket-threads";

const read = (p, fb) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb);
const threads = read(join(HERE, "posted.json"), []);
const insta = read(join(HERE, "ig-posted.json"), []);
const stats = read(join(HERE, "stats.json"), []);

const postedT = new Map(threads.map((e) => [e.file, e]));
const postedI = new Set(insta.map((e) => e.file));

const now = new Date();
const mins = now.getHours() * 60 + now.getMinutes();
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 화면 폭 계산 — 한글은 두 칸을 먹는다. */
const wide = (s) => [...s].reduce((n, c) => n + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿　-〿＀-￯]/.test(c) ? 2 : 1), 0);
const pad = (s, n) => s + " ".repeat(Math.max(0, n - wide(s)));

// ── 스케줄러 ────────────────────────────────────────────────
// schtasks 는 한국어 Windows 에서 라벨을 cp949 로 낸다 — 라벨로 파싱하면
// 로케일에 따라 통째로 깨진다. PowerShell 로 값만 뽑으면 전부 ASCII 다.
const ps = (c) =>
  execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", c], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

/** 작업 종료 코드 — 0 이 아니면 왜 그런지 알려준다. */
function codeNote(code) {
  if (code === 0) return "정상";
  if (code === 267011) return "아직 실행 안 됨";
  if (code === 3221225786) return "중단됨 (Ctrl+C)";
  return `코드 ${code} — post-due.log 확인`;
}

let sched;
try {
  const state = ps(`(Get-ScheduledTask -TaskName '${TASK}').State`);
  const when = (f) =>
    ps(
      `$i=(Get-ScheduledTaskInfo -TaskName '${TASK}'); ` +
        `if($i.${f}){$i.${f}.ToString('MM-dd HH:mm')}else{'-'}`,
    );
  const code = Number(ps(`(Get-ScheduledTaskInfo -TaskName '${TASK}').LastTaskResult`));
  const mark =
    state === "Disabled" ? "⏸ 꺼짐" : state === "Running" ? "◆ 실행 중" : "▶ 켜짐";
  sched = `${mark}  ·  다음 ${when("NextRunTime")}  ·  마지막 ${when("LastRunTime")} (${codeNote(code)})`;
} catch {
  sched = "등록되지 않음 — scripts/README.md 참고";
}

console.log(`\n  스케줄러  ${sched}`);
console.log(`  지금      ${hhmm(mins)}  ·  유예 창 ${DUE_GRACE_MIN}분\n`);

// ── 큐 ──────────────────────────────────────────────────────
const files = existsSync(QUEUE_DIR)
  ? readdirSync(QUEUE_DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

const rows = files.map((f) => {
  const { meta, text } = parsePost(readFileSync(join(QUEUE_DIR, f), "utf8"));
  const at = parseAt(meta.at);
  const t = postedT.get(f);
  const hasImages = Array.isArray(meta.images) && meta.images.length > 0;

  let state, when;
  if (t) {
    state = "✓ 게시";
    when = String(t.at ?? "").slice(5, 16).replace("T", " ");
  } else if (at === null) {
    state = "· 예약없음";
    when = "";
  } else if (isDue(meta.at, now)) {
    state = "→ 지금";
    when = "";
  } else if (mins < at) {
    state = "  대기";
    when = `${at - mins}분 뒤`;
  } else {
    state = "↷ 내일";
    when = `${mins - at}분 지남`;
  }

  return {
    f, at: meta.at ?? "—", state, when,
    len: textLength(text),
    link: findBodyLink(text),
    // 본문 링크를 일부러 켠 글. 실험 중인 글이 조용히 섞여 있으면
    // 나중에 결과를 해석할 수 없다.
    allowLink: String(meta.allow_body_link ?? "").toLowerCase() === "true",
    // 이미 나간 글은 고칠 수 없다. 경고해봤자 매일 보는 소음만 된다.
    reply: postedT.has(f) ? null : replyProblem(meta),
    ig: hasImages ? (postedI.has(f) ? "✓" : "대기") : "—",
  };
});

console.log(`  ${pad("큐", 34)}${pad("예약", 7)}${pad("상태", 11)}${pad("", 12)}${pad("길이", 7)}인스타`);
console.log("  " + "─".repeat(74));
for (const r of rows) {
  const warn = r.link && r.allowLink
    ? `  ⚑ 본문링크 실험중: ${r.link}`
    : r.link
    ? `  ✖ 본문링크: ${r.link}`
    : r.reply
      ? `  ✖ ${r.reply}`
      : r.len > 450
        ? `  ⚠ ${r.len}자 — 상한에 가깝다`
        : !postedT.has(r.f) && r.len > TEXT_TARGET
          ? `  · ${r.len}자 — 목표 ${TEXT_TARGET}자`
          : "";
  console.log(
    `  ${pad(r.f.replace(/\.md$/, ""), 34)}${pad(r.at, 7)}${pad(r.state, 11)}${pad(r.when, 12)}${pad(String(r.len) + "자", 7)}${r.ig}${warn}`,
  );
}

// ── 요약 ────────────────────────────────────────────────────
const pending = rows.filter((r) => r.state.includes("대기") || r.state.includes("지금"));
const tomorrow = rows.filter((r) => r.state.includes("내일"));
const problems = rows.filter((r) => r.link && !r.allowLink);
const experiments = rows.filter((r) => r.link && r.allowLink);

console.log("");
console.log(`  오늘 남은 것 ${pending.length}건${pending.length ? " — 다음 " + pending[0].f.replace(/\.md$/, "") + " (" + pending[0].at + ")" : ""}`);
if (tomorrow.length) console.log(`  내일로 넘어감 ${tomorrow.length}건 (유예 창을 지남)`);
if (problems.length) console.log(`  ✖ 본문에 링크가 있는 글 ${problems.length}건 — 게시되지 않습니다`);
if (experiments.length)
  console.log(
    `  ⚑ 본문링크를 켠 글 ${experiments.length}건 — 실험 중입니다 (docs/threads-findings.md 6절)`,
  );
const replyProblems = rows.filter((r) => r.reply);
if (replyProblems.length) {
  console.log(
    `  ✖ 답글 계측에 문제가 있는 글 ${replyProblems.length}건 — social/README.md 의 "ref 와 유입 계측" 참고`,
  );
}

// ── 성과 ────────────────────────────────────────────────────
if (stats.length) {
  const latest = new Map();
  for (const s of stats) latest.set(`${s.platform}/${s.file}`, s);
  const rowsS = [...latest.values()].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5);
  console.log(`\n  최근 성과 (npm run stats 로 갱신)`);
  for (const s of rowsS) {
    console.log(`    ${pad(s.platform, 11)}${pad(s.file.replace(/\.md$/, ""), 34)}조회 ${s.views ?? "·"}`);
  }
}
console.log("");
