/**
 * 프랑스판 TVA HT ↔ TTC 계산기(/fr/tva/) 화면 — 계산은 lib/fr/tva.ts(정수 센트).
 * 한국어판 부가세(/vat/)와 세율이 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 프랑스어만 둔다.
 * calc-ui 의 data-presets·data-group(천 단위 쉼표 전제)은 쓰지 않는다 — "5,5" 가 깨진다.
 */
import { fromHT, fromTTC, parseFixed, eur, eurosInput, pct } from "./tva";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "fr-tva";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("tv-mode") as HTMLSelectElement;
const rateSel = $("tv-rate") as HTMLSelectElement;
const otherWrap = $("tv-other-wrap");
const otherIn = $("tv-other") as HTMLInputElement;
const amountIn = $("tv-amount") as HTMLInputElement;

let lastTitle = "";
let lastLines: [string, string][] = [];

function currentRate(): number {
  if (rateSel.value === "autre") return parseFixed(otherIn.value, 10000);
  return parseInt(rateSel.value, 10);
}

function compute() {
  const fromTtc = modeSel.value === "ttc";
  otherWrap.hidden = rateSel.value !== "autre";
  $("tv-input-label").textContent = fromTtc ? "Prix TTC (€)" : "Prix HT (€)";
  $("hero-label").textContent = fromTtc ? "Prix HT" : "Prix TTC";

  const rate = currentRate();
  const v = parseFixed(amountIn.value);
  if (Number.isNaN(rate) || Number.isNaN(v)) {
    $("hero-value").textContent = "—";
    $("tv-formula").textContent = Number.isNaN(rate)
      ? "Saisissez un taux entre 0 et 100 %, par exemple 5,5."
      : "Saisissez un montant en euros, par exemple 1 234,56.";
    for (const id of ["out-ht", "out-tva", "out-ttc"]) $(id).textContent = "—";
    return;
  }

  const r = fromTtc ? fromTTC(v, rate) : fromHT(v, rate);
  $("hero-value").textContent = eur(fromTtc ? r.ht : r.ttc);
  $("tv-formula").textContent = fromTtc
    ? `HT = ${eur(v)} ÷ (1 + ${pct(rate)}), arrondi au centime`
    : `TVA = ${eur(v)} × ${pct(rate)}, arrondie au centime`;
  $("out-ht").textContent = eur(r.ht);
  $("tva-label").textContent = `TVA (${pct(rate)})`;
  $("out-tva").textContent = eur(r.tva);
  $("out-ttc").textContent = eur(r.ttc);

  lastTitle = `TVA à ${pct(rate)}`;
  lastLines = [
    ["Prix HT", eur(r.ht)],
    [`TVA (${pct(rate)})`, eur(r.tva)],
    ["Prix TTC", eur(r.ttc)],
  ];
}

for (const el of [modeSel, rateSel]) el.addEventListener("change", compute);
otherIn.addEventListener("input", compute);
amountIn.addEventListener("input", () => {
  const v = parseFixed(amountIn.value);
  if (!Number.isNaN(v)) reportUse(v / 100);
  compute();
});
amountIn.addEventListener("blur", () => {
  const v = parseFixed(amountIn.value);
  if (!Number.isNaN(v)) amountIn.value = eurosInput(v);
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "tva-ht-ttc.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Calcul TVA HT TTC - jupocket.com");
});

compute();
