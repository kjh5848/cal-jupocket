/**
 * AI에게 물어보기 — 모델 비교. 질문 100개(src/lib/__tests__/loan-parse.cases.ts)를 모델에만 넣어
 * 뽑은 값(LoanQuery)이 기대값과 같은지 센다. 해석기가 없을 때 모델 혼자 얼마나 맞히나를 본다.
 *
 *   node scripts/chat-eval.mjs [모델…]        (.env 의 EVAL_KEY 필요, api.jupocket.com/api/chat/eval)
 *   node scripts/chat-eval.mjs --chat "질문"  실제 /api/chat 응답 보기
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const API = "https://api.jupocket.com";
const args = process.argv.slice(2);

if (args[0] === "--chat") {
  for (const q of args.slice(1)) {
    const r = await fetch(`${API}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://jupocket.com" }, body: JSON.stringify({ q, page: "eval" }) });
    console.log(q, "\n ", r.status, JSON.stringify(await r.json()));
  }
  process.exit(0);
}

// 채점표를 TS 에서 읽는다(형식이 단순해서 정규식으로 충분하다)
const src = readFileSync(new URL("../src/lib/__tests__/loan-parse.cases.ts", import.meta.url), "utf8");
const 억 = 1e8, 만 = 1e4;
const cases = [...src.matchAll(/\{ q: "([^"]+)", want: (\{[^}]*\})(?:, scope: "(\w+)")? \}/g)].map((m) => ({
  q: m[1],
  want: Function("억", "만", `return (${m[2]})`)(억, 만),
  scope: m[3] ?? "calc",
}));
const KEYS = ["principal", "ratePct", "months", "method", "graceMonths"];
const same = (a, b) => KEYS.every((k) => (a?.[k] ?? undefined) === (b?.[k] ?? undefined));

const models = args.length
  ? args
  : ["@cf/qwen/qwen3-30b-a3b-fp8", "@cf/google/gemma-4-26b-a4b-it", "@cf/zai-org/glm-4.7-flash", "@cf/openai/gpt-oss-20b", "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/mistralai/mistral-small-3.1-24b-instruct"];

const calc = cases.filter((c) => c.scope === "calc");
const report = [];
for (const model of models) {
  let ok = 0, err = 0, ms = [];
  const misses = [];
  // 4개씩 동시에
  for (let i = 0; i < calc.length; i += 4) {
    const batch = calc.slice(i, i + 4);
    const res = await Promise.all(
      batch.map((c) =>
        fetch(`${API}/api/chat/eval`, { method: "POST", headers: { "Content-Type": "application/json", "X-Eval-Key": env.EVAL_KEY }, body: JSON.stringify({ q: c.q, model }) })
          .then((r) => r.json())
          .catch((e) => ({ ok: false, error: String(e) })),
      ),
    );
    res.forEach((r, j) => {
      if (!r.ok) err++;
      else {
        ms.push(r.ms);
        if (same(r.query, batch[j].want)) ok++;
        else misses.push({ q: batch[j].q, got: r.query, want: batch[j].want });
      }
    });
  }
  ms.sort((a, b) => a - b);
  const row = { model, correct: ok, of: calc.length, errors: err, p50ms: ms[Math.floor(ms.length / 2)] ?? null, p90ms: ms[Math.floor(ms.length * 0.9)] ?? null };
  console.log(JSON.stringify(row));
  report.push({ ...row, misses: misses.slice(0, 15) });
}
mkdirSync(new URL("../keywords/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../keywords/chat-eval-${new Date().toISOString().slice(0, 10)}.json`, import.meta.url), JSON.stringify(report, null, 2));
