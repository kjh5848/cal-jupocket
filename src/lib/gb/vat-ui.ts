/**
 * 영국판 VAT 계산기(/en-gb/vat/) 화면 — 계산은 lib/gb/vat.ts(영국 제도).
 * 한국어판 부가세(/vat/)와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { fromNet, fromGross, parsePence, gbp, poundsInput, type VatRate, type Rounding } from "./vat";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-vat";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("vt-mode") as HTMLSelectElement;
const rateSel = $("vt-rate") as HTMLSelectElement;
const roundSel = $("vt-round") as HTMLSelectElement;
const amountIn = $("vt-amount") as HTMLInputElement;

let lastTitle = "";
let lastLines: [string, string][] = [];

function compute() {
  const removing = modeSel.value === "remove";
  const rate: VatRate = rateSel.value === "5" ? 5 : 20;
  const rounding: Rounding = roundSel.value === "down" ? "down" : "nearest";
  const v = parsePence(amountIn.value);
  const r = removing ? fromGross(v, rate, rounding) : fromNet(v, rate, rounding);
  const roundText = rounding === "down" ? "rounded down to a whole penny" : "rounded to the nearest penny";

  $("vt-input-label").textContent = removing ? "Price including VAT (£)" : "Price excluding VAT (£)";
  $("hero-label").textContent = removing ? "Price excluding VAT" : "Price including VAT";
  $("hero-value").textContent = gbp(removing ? r.net : r.gross);
  $("vt-formula").textContent = removing
    ? `VAT = ${gbp(v)} × ${rate}/${100 + rate} (${roundText})`
    : `VAT = ${gbp(v)} × ${rate}% (${roundText})`;
  $("out-net").textContent = gbp(r.net);
  $("vat-label").textContent = `VAT (${rate}%)`;
  $("out-vat").textContent = gbp(r.vat);
  $("out-gross").textContent = gbp(r.gross);

  lastTitle = `UK VAT at ${rate}%`;
  lastLines = [
    ["Excluding VAT", gbp(r.net)],
    [`VAT (${rate}%)`, gbp(r.vat)],
    ["Including VAT", gbp(r.gross)],
  ];
}

for (const el of [modeSel, rateSel, roundSel]) el.addEventListener("change", compute);
amountIn.addEventListener("input", () => {
  reportUse(parsePence(amountIn.value) / 100);
  compute();
});
amountIn.addEventListener("blur", () => {
  const v = parsePence(amountIn.value);
  amountIn.value = v === 0 ? "" : poundsInput(v);
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "uk-vat-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "UK VAT calculation - jupocket.com");
});

compute();
