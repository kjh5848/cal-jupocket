/**
 * 일본어판 消費税 계산기(/ja/consumption-tax/) — 계산은 lib/jp/consumption-tax.ts(일본 제도).
 * 한국어판 부가세(/vat/)와 짝이 아니라 화면 문구는 일본어만 둔다.
 */
import { fromExclusive, fromInclusive, type TaxRate, type Rounding } from "../lib/jp/consumption-tax";
import { formatYen, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("jp-consumption-tax");

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("ct-mode") as HTMLSelectElement;
const rateSel = $("ct-rate") as HTMLSelectElement;
const roundSel = $("ct-round") as HTMLSelectElement;
const amountIn = $("ct-amount") as HTMLInputElement;

const ROUND_LABEL: Record<Rounding, string> = { floor: "切り捨て", round: "四捨五入", ceil: "切り上げ" };

let lastTitle = "";
let lastLines: [string, string][] = [];

/** 全角の数字も半角に直してから読む */
const toHalf = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

function compute() {
  const inclusiveMode = modeSel.value === "inclusive";
  const rate = (rateSel.value === "8" ? 8 : 10) as TaxRate;
  const rounding = (["floor", "round", "ceil"].includes(roundSel.value) ? roundSel.value : "floor") as Rounding;
  const v = parseAmount(toHalf(amountIn.value));
  const r = inclusiveMode ? fromInclusive(v, rate, rounding) : fromExclusive(v, rate, rounding);

  $("ct-input-label").textContent = inclusiveMode ? "税込価格" : "税抜価格（本体価格）";
  $("hero-label").textContent = inclusiveMode ? "税抜価格" : "税込価格";
  $("hero-value").textContent = formatYen(inclusiveMode ? r.exclusive : r.inclusive);
  $("ct-formula").textContent = inclusiveMode
    ? `消費税 = ${formatYen(v)} × ${rate}/${100 + rate}（1円未満${ROUND_LABEL[rounding]}）`
    : `消費税 = ${formatYen(v)} × ${rate}%（1円未満${ROUND_LABEL[rounding]}）`;
  $("out-exclusive").textContent = formatYen(r.exclusive);
  $("tax-label").textContent = `消費税（${rate}%）`;
  $("out-tax").textContent = formatYen(r.tax);
  $("out-inclusive").textContent = formatYen(r.inclusive);

  lastTitle = `消費税 ${rate}% の計算結果`;
  lastLines = [
    ["税抜価格", formatYen(r.exclusive)],
    [`消費税（${rate}%）`, formatYen(r.tax)],
    ["税込価格", formatYen(r.inclusive)],
  ];
}

for (const el of [modeSel, rateSel, roundSel]) el.addEventListener("change", compute);
amountIn.addEventListener("input", () => {
  const value = parseAmount(toHalf(amountIn.value));
  reportUse(value);
  amountIn.value = value === 0 ? "" : value.toLocaleString("ja-JP");
  const end = amountIn.value.length;
  amountIn.setSelectionRange(end, end);
  compute();
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "jp-consumption-tax" });
  downloadCard(buildCard(), "consumption-tax-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "jp-consumption-tax" });
  await shareCard(buildCard(), "消費税の計算結果 - jupocket.com");
});

compute();
