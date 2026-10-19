import { pyeong, rectM2, areaRatio, fmtArea, type AreaUnit, type AreaBasis } from "../lib/pyeong";
import { parseNumber, round2 } from "../lib/percent";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("pyeong");

const $ = (id: string) => document.getElementById(id)!;
const howSel = $("how") as HTMLSelectElement;
const unitSel = $("unit") as HTMLSelectElement;
const basisSel = $("basis") as HTMLSelectElement;
const areaIn = $("area") as HTMLInputElement;
const wIn = $("w") as HTMLInputElement;
const dIn = $("d") as HTMLInputElement;
const ratioIn = $("ratio") as HTMLInputElement;

const NAME: Record<AreaBasis, string> = { exclusive: "전용면적", supply: "공급면적" };
const OTHER: Record<AreaBasis, string> = { exclusive: "공급면적", supply: "전용면적" };

let lastLines: [string, string][] = [];
let lastTitle = "평수 계산";

function set(id: string, text: string) {
  $(id).textContent = text;
}

/** 계산할 수 없을 때 — 지난 결과가 남지 않게 칸을 비운다 */
function clear(note: string) {
  set("hero-value", "—");
  set("hero-sub", "");
  for (const id of ["v-m2", "v-ft2", "v-other", "v-other-m2"]) set(id, "—");
  set("note", note);
  lastLines = [];
}

function compute() {
  const rect = howSel.value === "rect";
  $("area-wrap").hidden = rect;
  $("rect-wrap").hidden = !rect;

  const basis = basisSel.value as AreaBasis;
  set("hero-label", NAME[basis]);
  set("l-other", `${OTHER[basis]} 추정`);
  set("l-other-m2", `${OTHER[basis]} 추정 ㎡`);

  let value: number;
  let unit: AreaUnit;
  if (rect) {
    const m2 = rectM2(parseNumber(wIn.value), parseNumber(dIn.value));
    if (m2 === null) return clear("가로·세로 길이를 m 단위로 넣어 주세요.");
    value = m2;
    unit = "m2";
  } else {
    value = parseNumber(areaIn.value);
    unit = unitSel.value as AreaUnit;
  }

  const ratio = parseNumber(ratioIn.value);
  const x = pyeong(value, unit, basis, ratio);
  if (!x) return clear("0보다 큰 면적을 넣어 주세요.");

  const g = x.given;
  // 평으로 넣었으면 ㎡ 를, 아니면 평을 크게
  const heroPyeong = unit !== "pyeong";
  set("hero-value", heroPyeong ? `${fmtArea(g.pyeong)}평` : `${fmtArea(g.m2)}㎡`);
  set("hero-sub", heroPyeong ? `${fmtArea(g.m2)}㎡ · ${fmtArea(g.ft2)}ft²` : `${fmtArea(g.pyeong)}평 · ${fmtArea(g.ft2)}ft²`);
  set("v-m2", `${fmtArea(g.m2)}㎡`);
  set("v-ft2", `${fmtArea(g.ft2)}ft²`);
  set("v-other", x.other ? `${fmtArea(x.other.pyeong)}평` : "—");
  set("v-other-m2", x.other ? `${fmtArea(x.other.m2)}㎡` : "—");

  const notes: string[] = [];
  if (rect) notes.push(`가로 × 세로 = ${fmtArea(value)}㎡.`);
  if (!x.other) notes.push("전용률은 0보다 크고 100 이하인 %로 넣어 주세요.");
  else notes.push(`${OTHER[basis]}은 전용률 ${ratio}%로 짐작한 값입니다.`);
  set("note", notes.join(" "));

  lastTitle = `${NAME[basis]} ${fmtArea(g.m2)}㎡`;
  lastLines = [
    ["평", `${fmtArea(g.pyeong)}평`],
    ["㎡ · ft²", `${fmtArea(g.m2)}㎡ · ${fmtArea(g.ft2)}ft²`],
  ];
  if (x.other) lastLines.push([`${OTHER[basis]} 추정 (전용률 ${ratio}%)`, `${fmtArea(x.other.pyeong)}평 · ${fmtArea(x.other.m2)}㎡`]);
}

for (const el of [areaIn, wIn, dIn, ratioIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}
for (const el of [howSel, unitSel, basisSel]) {
  el.addEventListener("change", () => {
    reportUse(1);
    compute();
  });
}

for (const b of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  b.addEventListener("click", () => {
    const [u, v] = (b.dataset.preset ?? "").split(":");
    howSel.value = "area";
    howSel.dispatchEvent(new Event("change"));
    unitSel.value = u;
    unitSel.dispatchEvent(new Event("change"));
    areaIn.value = v;
    // '전용 59㎡' 처럼 전용이라 적힌 버튼은 기준도 전용으로
    if (b.textContent?.startsWith("전용")) {
      basisSel.value = "exclusive";
      basisSel.dispatchEvent(new Event("change"));
    }
    reportUse(1);
    compute();
  });
}

// ── 둘째 칸: 두 면적(+분양가) → 전용률·공용면적·평당 분양가 ──
const rSupply = $("r-supply") as HTMLInputElement;
const rExcl = $("r-excl") as HTMLInputElement;
const rPrice = $("r-price") as HTMLInputElement;
const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;

function computeRatio() {
  const s = parseNumber(rSupply.value);
  const e = parseNumber(rExcl.value);
  const price = parseNumber(rPrice.value);
  const x = areaRatio(s, e, price);
  const ids = ["r-common", "r-pp-s", "r-m2-s", "r-pp-e"];
  if (!x) {
    set("r-hero", "—");
    set("r-hero-sub", "");
    for (const id of ids) set(id, "—");
    set("r-note", e > s && s > 0 ? "전용면적은 공급면적보다 클 수 없습니다. 두 칸이 바뀌지 않았는지 보세요." : "공급면적과 전용면적을 ㎡로 넣어 주세요.");
    return;
  }
  set("r-hero", `${round2(x.ratioPct).toFixed(2)}%`);
  set("r-hero-sub", `전용 ${fmtArea(x.exclusive.pyeong)}평 / 공급 ${fmtArea(x.supply.pyeong)}평`);
  set("r-common", `${fmtArea(x.common.m2)}㎡ · ${fmtArea(x.common.pyeong)}평`);
  set("r-pp-s", x.price ? won(x.price.perPyeongSupply) : "—");
  set("r-m2-s", x.price ? won(x.price.perM2Supply) : "—");
  set("r-pp-e", x.price ? won(x.price.perPyeongExclusive) : "—");
  set(
    "r-note",
    x.price
      ? `전용 기준 ㎡당 ${won(x.price.perM2Exclusive)}. 공급으로 나눈 값과 전용으로 나눈 값은 전용률만큼 차이가 납니다.`
      : "분양가를 넣으면 평당 값이 나옵니다. 어느 면적으로 나누느냐에 따라 값이 달라 두 기준을 함께 보여 줍니다.",
  );
}

for (const el of [rSupply, rExcl, rPrice]) {
  el.addEventListener("input", () => {
    reportUse(1);
    computeRatio();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "pyeong" });
  downloadCard(buildCard(), "pyeong-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "pyeong" });
  await shareCard(buildCard(), "평수 계산 결과 - jupocket.com");
});

compute();
computeRatio();
