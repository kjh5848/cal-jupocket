import { parseNumber, formatNumber, ratio, percentOf, change, adjust, original, toWari } from "../lib/percent";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pickLang } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("percent");

type Mode = "ratio" | "of" | "change" | "adjust" | "original";

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("mode") as HTMLSelectElement;
const dirSel = $("dir") as HTMLSelectElement;
const dirRow = $("dir-row");
const aIn = $("a") as HTMLInputElement;
const bIn = $("b") as HTMLInputElement;

/**
 * 화면 문구 — 한국어판(/tools/percent/)·일본어판(/ja/tools/percent/)·영어판(/en-us/tools/percent/ 등)이 같은 계산을 쓴다.
 * 계산은 산술이라 나라와 상관없고, 말만 다르다. 일본어판은 歩合(割·分·厘)을 같이 보인다.
 * 영어 사전(EN)은 영어 다섯 판이 같이 쓰므로 통화 기호 등 한 나라 표기를 넣지 않는다.
 * 번체 사전(ZH_HANT)은 대만판·홍콩판이 같이 쓰므로 한 곳에만 쓰는 말(打折 등)·통화 기호를 넣지 않는다.
 */
const KO = {
  labels: {
    ratio: { a: "기준값 A (전체)", b: "비교값 B (부분)", pct: false },
    of: { a: "전체값 A", b: "비율 B", pct: true },
    change: { a: "이전 값 A", b: "이후 값 B", pct: false },
    adjust: { a: "처음 값 A", b: "비율 B", pct: true },
    original: { a: "바뀐 뒤 값 A", b: "바뀐 비율 B", pct: true },
  } as Record<Mode, { a: string; b: string; pct: boolean }>,
  title: "퍼센트 계산 결과",
  nan: "숫자를 넣어 주세요",
  ratioZero: "기준값 A는 0이 아니어야 합니다",
  divZero: "0으로는 나눌 수 없습니다",
  ratioHero: "B는 A의",
  a: "기준값 A",
  b: "비교값 B",
  ofHero: (a: string, b: string) => `${a}의 ${b}%`,
  whole: "전체값 A",
  rate: "비율 B",
  changeZero: "이전 값 A는 0이 아니어야 합니다",
  changeZeroHint: "0에서 시작한 변화는 %로 셀 수 없습니다",
  diff: "변화량",
  up: "늘어난 비율",
  down: "줄어든 비율",
  beforeAfter: "이전 → 이후",
  adjHero: (b: string, up: boolean) => (up ? `${b}% 올린 값` : `${b}% 내린 값`),
  adjAmount: (up: boolean) => (up ? "늘어난 만큼" : "줄어든 만큼 (할인 금액)"),
  first: "처음 값 A",
  origNone: "100% 내린 값에서는 원래 값을 알 수 없습니다",
  origHero: "원래 값",
  origAmount: (up: boolean) => (up ? "올라서 붙은 만큼" : "내려서 빠진 만큼"),
  changed: "바뀐 뒤 값 A",
  wari: (_p: number) => "",
  share: "퍼센트 계산 결과 - jupocket.com",
};

const JA: typeof KO = {
  labels: {
    ratio: { a: "全体の値 A", b: "部分の値 B", pct: false },
    of: { a: "全体の値 A", b: "割合 B", pct: true },
    change: { a: "前の値 A", b: "後の値 B", pct: false },
    adjust: { a: "元の値 A", b: "割合 B", pct: true },
    original: { a: "変わった後の値 A", b: "変わった割合 B", pct: true },
  },
  title: "パーセント計算の結果",
  nan: "数字を入力してください",
  ratioZero: "A は 0 以外にしてください",
  divZero: "0 では割れません",
  ratioHero: "B は A の",
  a: "全体の値 A",
  b: "部分の値 B",
  ofHero: (a, b) => `${a} の ${b}%`,
  whole: "全体の値 A",
  rate: "割合 B",
  changeZero: "前の値 A は 0 以外にしてください",
  changeZeroHint: "0 からの変化は％で表せません",
  diff: "変化した量",
  up: "増加率",
  down: "減少率",
  beforeAfter: "前 → 後",
  adjHero: (b, up) => (up ? `${b}% 増やした値` : `${b}% 引いた値`),
  adjAmount: (up) => (up ? "増えた分" : "引かれた分（割引額）"),
  first: "元の値 A",
  origNone: "100% 引いた値からは元の値がわかりません",
  origHero: "元の値",
  origAmount: (up) => (up ? "上がって増えた分" : "引かれた分"),
  changed: "変わった後の値 A",
  wari: (p) => {
    const w = toWari(Math.abs(p));
    return w ? `（${w}）` : "";
  },
  share: "パーセント計算の結果 - jupocket.com",
};

const EN: typeof KO = {
  labels: {
    ratio: { a: "Whole value A", b: "Part value B", pct: false },
    of: { a: "Whole value A", b: "Percent B", pct: true },
    change: { a: "Old value A", b: "New value B", pct: false },
    adjust: { a: "Starting value A", b: "Percent B", pct: true },
    original: { a: "Value after the change A", b: "Percent changed B", pct: true },
  },
  title: "Percentage calculator result",
  nan: "Enter a number",
  ratioZero: "A can't be 0",
  divZero: "You can't divide by 0",
  ratioHero: "B is this percent of A",
  a: "Whole value A",
  b: "Part value B",
  ofHero: (a, b) => `${b}% of ${a}`,
  whole: "Whole value A",
  rate: "Percent B",
  changeZero: "The old value A can't be 0",
  changeZeroHint: "A change that starts from 0 can't be shown as a percent",
  diff: "Difference",
  up: "Percent increase",
  down: "Percent decrease",
  beforeAfter: "Old → new",
  adjHero: (b, up) => (up ? `After a ${b}% increase` : `After ${b}% off`),
  adjAmount: (up) => (up ? "Amount added" : "Amount off (you save)"),
  first: "Starting value A",
  origNone: "After 100% off, the original value can't be found",
  origHero: "Original value",
  origAmount: (up) => (up ? "Amount added by the increase" : "Amount taken off"),
  changed: "Value after the change A",
  wari: (_p) => "",
  share: "Percentage calculator result - jupocket.com",
};

const ZH_HANT: typeof KO = {
  labels: {
    ratio: { a: "全部的數 A", b: "部分的數 B", pct: false },
    of: { a: "全部的數 A", b: "百分比 B", pct: true },
    change: { a: "原本的數 A", b: "後來的數 B", pct: false },
    adjust: { a: "原本的數 A", b: "百分比 B", pct: true },
    original: { a: "變動後的數 A", b: "變動的百分比 B", pct: true },
  },
  title: "百分比計算結果",
  nan: "請輸入數字",
  ratioZero: "A 不能是 0",
  divZero: "不能除以 0",
  ratioHero: "B 佔 A 的",
  a: "全部的數 A",
  b: "部分的數 B",
  ofHero: (a, b) => `${a} 的 ${b}%`,
  whole: "全部的數 A",
  rate: "百分比 B",
  changeZero: "原本的數 A 不能是 0",
  changeZeroHint: "從 0 開始的變化無法用百分比表示",
  diff: "變化量",
  up: "成長率（增加）",
  down: "減少率",
  beforeAfter: "原本 → 後來",
  adjHero: (b, up) => (up ? `增加 ${b}% 後` : `減少 ${b}% 後`),
  adjAmount: (up) => (up ? "增加的部分" : "減少的部分（折扣金額）"),
  first: "原本的數 A",
  origNone: "減少 100% 之後無法推回原本的數",
  origHero: "原本的數",
  origAmount: (up) => (up ? "增加的部分" : "減少的部分"),
  changed: "變動後的數 A",
  wari: (_p) => "",
  share: "百分比計算結果 - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN, "zh-Hant": ZH_HANT });

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
  lastTitle = S.title;
  if (Number.isNaN(a) || Number.isNaN(b)) {
    show(S.nan, "—", "", []);
    return;
  }
  if (mode === "ratio") {
    const r = ratio(a, b);
    if (r === null) return show(S.ratioZero, "—", S.divZero, []);
    show(S.ratioHero, `${f(r)}%`, `${f(b)} ÷ ${f(a)} × 100${S.wari(r)}`, [[S.a, f(a)], [S.b, f(b)]]);
  } else if (mode === "of") {
    show(S.ofHero(f(a), f(b)), f(percentOf(a, b)), `${f(a)} × ${f(b)} ÷ 100`, [[S.whole, f(a)], [S.rate, `${f(b)}%${S.wari(b)}`]]);
  } else if (mode === "change") {
    const r = change(a, b);
    if (r === null) return show(S.changeZero, "—", S.changeZeroHint, [[S.diff, `${sign(b - a)}${f(b - a)}`]]);
    show(r.rate >= 0 ? S.up : S.down, `${sign(r.rate)}${f(r.rate)}%`, `(${f(b)} − ${f(a)}) ÷ ${f(Math.abs(a))} × 100`, [[S.diff, `${sign(r.diff)}${f(r.diff)}`], [S.beforeAfter, `${f(a)} → ${f(b)}`]]);
  } else if (mode === "adjust") {
    const r = adjust(a, b, dir);
    const up = dir === "up";
    show(S.adjHero(f(b), up) + S.wari(b), f(r.result), `${f(a)} ${up ? "+" : "−"} (${f(a)} × ${f(b)}%)`, [[S.adjAmount(up), f(r.amount)], [S.first, f(a)]]);
  } else {
    const r = original(a, b, dir);
    if (r === null) return show(S.origNone, "—", "", []);
    const up = dir === "up";
    show(S.origHero, f(r.base), `${f(a)} ÷ (1 ${up ? "+" : "−"} ${f(b)}%)`, [[S.origAmount(up), f(Math.abs(r.amount))], [S.changed, f(a)]]);
  }
}

function setMode() {
  const mode = modeSel.value as Mode;
  const L = S.labels[mode];
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
  await shareCard(buildCard(), S.share);
});

setMode();
