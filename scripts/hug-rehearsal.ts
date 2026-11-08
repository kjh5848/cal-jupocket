/**
 * HUG 전세 상담 리허설 도구(vite-node 로 실행).
 *
 *   npx vite-node scripts/hug-rehearsal.ts bundle <폴더>   모델에게 줄 system·대화 묶음을 쓴다(녹화용)
 *   npx vite-node scripts/hug-rehearsal.ts report           녹화본으로 hugChat 을 돌려 docs/hug-chat-rehearsal.md 를 쓴다
 *
 * 녹화본: workers/api/src/__tests__/fixtures/hug-recorded.json — { meta, answers: { [case id]: 모델 JSON | [첫 답, 다시 시킨 답] } }
 */
import fs from "node:fs";
import path from "node:path";
import { CASES, historyOf, systemOf, replay, shown, kindOf } from "../workers/api/src/__tests__/hug-rehearsal";
import { SYSTEM } from "../src/lib/hug-chat-core";

const [mode, out] = process.argv.slice(2);
const REC = "workers/api/src/__tests__/fixtures/hug-recorded.json";

if (mode === "bundle") {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "system.txt"), SYSTEM);
  const items = CASES.map((c) => ({ id: c.id, extraSystem: systemOf(c).slice(SYSTEM.length).trim() || null, messages: historyOf(c) }));
  fs.writeFileSync(path.join(out, "cases.json"), JSON.stringify(items, null, 2));
  console.log(`${items.length} cases → ${out}`);
} else if (mode === "report") {
  const rec = JSON.parse(fs.readFileSync(REC, "utf8"));
  const parts = [
    "# HUG 전세 상담 리허설",
    "",
    `모델 답: ${rec.meta.model} (${rec.meta.recordedOn}). 아래 '답'은 그 모델 답이 서버 검사(숫자 검사·계산·다시 시키기)를 거친 뒤 독자에게 실제로 보일 글이다.`,
    "다시 만들기: `npx vite-node scripts/hug-rehearsal.ts report`",
    "",
  ];
  for (const c of CASES) {
    const r = await replay(c, rec.answers[c.id]);
    const q = historyOf(c).filter((m) => m.role === "user").map((m) => m.content);
    parts.push(`## ${c.id} — 기대 ${c.expect.kind} · 결과 ${kindOf(r.body)}${r.calls > 1 ? " (다시 시킴)" : ""}`, "");
    parts.push(...q.map((x) => `> 👤 ${x}`), "", "🤖 " + shown(r.body).replace(/\n/g, "  \n"), "");
    if (r.body.sources?.length) parts.push(`출처: ${r.body.sources.map((s) => s.name).join(", ")}`, "");
  }
  fs.writeFileSync("docs/hug-chat-rehearsal.md", parts.join("\n"));
  console.log("docs/hug-chat-rehearsal.md");
} else {
  console.log("usage: bundle <dir> | report");
}
