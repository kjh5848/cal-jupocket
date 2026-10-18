import { parseNumber, formatNumber, ratio, percentOf, change, adjust, original } from "../lib/percent";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("percent");

type Mode = "ratio" | "of" | "change" | "adjust" | "original";

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("mode") as HTMLSelectElement;
const dirSel = $("dir") as HTMLSelectElement;
const dirRow = $("dir-row");
const aIn = $("a") as HTMLInputElement;
const bIn = $("b") as HTMLInputElement;

/** 모드별 칸 이름 — B 가 % 인 모드는 단위 % 를 보인다 */
const LABELS: Record<Mode, { a: string; b: string; pct: boolean }> = {
  ratio: { a: "기준값 A (전체)", b: "비교값 B (부분)", pct: false },
  of: { a: "전체값 A", b: "비율 B", pct: true },
  change: { a: "이전 값 A", b: "이후 값 B", pct: false },
  adjust: { a: "처음 값 A", b: "비율 B", pct: true },
  original: { a: "바뀐 뒤 값 A", b: "바뀐 비율 B", pct: true },
};

let lastTitle = "";
let lastLines: [string, string][] = [];

function show(hero: string, value: string, formula: string, chips: [string, string][]) {
  $("hero-label").textContent = hero;
  $("hero-value").textContent = value;
  $("formula").textContent = formula;
  const ids = [["l1", "v1"], ["l2", "v2"]];
  ids.forEach(([l, v], i) => {
    $(l).textContent = chips[i]?.[0] ?? "";
    $(v).textContent = chips[i]?.[1] ?? "";
  });
  lastLines = [[hero, value], ...chips];
}

const sign = (x: number) => (x > 0 ? "+" : "");

function compute() {
  const mode = modeSel.value as Mode;
  const dir = dirSel.value === "up" ? "up" : "down";
  const a = parseNumber(aIn.value);
  const b = parseNumber(bIn.value);
  const f = formatNumber;
  lastTitle = "퍼센트 계산 결과";
  if (Number.isNaN(a) || Number.isNaN(b)) {
    show("숫자를 넣어 주세요", "—", "", []);
    return;
  }
  if (mode === "ratio") {
    const r = ratio(a, b);
    if (r === null) return show("기준값 A는 0이 아니어야 합니다", "—", "0으로는 나눌 수 없습니다", []);
    show("B는 A의", `${f(r)}%`, `${f(b)} ÷ ${f(a)} × 100`, [["기준값 A", f(a)], ["비교값 B", f(b)]]);
  } else if (mode === "of") {
    show(`${f(a)}의 ${f(b)}%`, f(percentOf(a, b)), `${f(a)} × ${f(b)} ÷ 100`, [["전체값 A", f(a)], ["비율 B", `${f(b)}%`]]);
  } else if (mode === "change") {
    const r = change(a, b);
    if (r === null) return show("이전 값 A는 0이 아니어야 합니다", "—", "0에서 시작한 변화는 %로 셀 수 없습니다", [["변화량", `${sign(b - a)}${f(b - a)}`]]);
    show(r.rate >= 0 ? "늘어난 비율" : "줄어든 비율", `${sign(r.rate)}${f(r.rate)}%`, `(${f(b)} − ${f(a)}) ÷ ${f(Math.abs(a))} × 100`, [["변화량", `${sign(r.diff)}${f(r.diff)}`], ["이전 → 이후", `${f(a)} → ${f(b)}`]]);
  } else if (mode === "adjust") {
    const r = adjust(a, b, dir);
    const up = dir === "up";
    show(up ? `${f(b)}% 올린 값` : `${f(b)}% 내린 값`, f(r.result), `${f(a)} ${up ? "+" : "−"} (${f(a)} × ${f(b)}%)`, [[up ? "늘어난 만큼" : "줄어든 만큼 (할인 금액)", f(r.amount)], ["처음 값 A", f(a)]]);
  } else {
    const r = original(a, b, dir);
    if (r === null) return show("100% 내린 값에서는 원래 값을 알 수 없습니다", "—", "", []);
    const up = dir === "up";
    show("원래 값", f(r.base), `${f(a)} ÷ (1 ${up ? "+" : "−"} ${f(b)}%)`, [[up ? "올라서 붙은 만큼" : "내려서 빠진 만큼", f(Math.abs(r.amount))], ["바뀐 뒤 값 A", f(a)]]);
  }
}

function setMode() {
  const mode = modeSel.value as Mode;
  const L = LABELS[mode];
  $("a-label").textContent = L.a;
  $("b-label").textContent = L.b;
  $("b-unit").hidden = !L.pct;
  dirRow.hidden = !(mode === "adjust" || mode === "original");
  compute();
}

modeSel.addEventListener("change", setMode);
dirSel.addEventListener("change", compute);
for (const el of [aIn, bIn]) {
  el.addEventListener("input", () => {
    reportUse(Math.abs(parseNumber(aIn.value)) || 1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "percent" });
  downloadCard(buildCard(), "percent-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "percent" });
  await shareCard(buildCard(), "퍼센트 계산 결과 - jupocket.com");
});

setMode();
