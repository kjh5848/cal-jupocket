/**
 * 영국판 Council Tax 계산기(/en-gb/council-tax/) 화면 — 계산은 lib/gb/council-tax.ts(잉글랜드 제도).
 * 한국어판 재산세와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { fromBandD, applyDiscount, instalments, gbp, ratioOf, D_RATIO, type Band, type Discount } from "./council-tax";
import { parsePence, poundsInput } from "./vat";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-council-tax";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("ct-mode") as HTMLSelectElement;
const bandSel = $("ct-band") as HTMLSelectElement;
const amountIn = $("ct-amount") as HTMLInputElement;
const discSel = $("ct-discount") as HTMLSelectElement;
const countSel = $("ct-count") as HTMLSelectElement;

let lastTitle = "";
let lastLines: [string, string][] = [];

function compute() {
  const fromD = modeSel.value === "bandD";
  const band = bandSel.value as Band;
  const pct = Number(discSel.value) as Discount;
  const count = countSel.value === "12" ? 12 : 10;
  const entered = parsePence(amountIn.value);
  const annual = fromD ? fromBandD(entered, band) : entered;
  const { discount, payable } = applyDiscount(annual, pct);
  const s = instalments(payable, count);

  $("ct-amount-label").textContent = fromD ? "Band D charge for the year (£)" : `Your Band ${band} charge for the year (£)`;
  $("hero-label").textContent = `Council Tax to pay, Band ${band}`;
  $("hero-value").textContent = gbp(payable);
  $("ct-formula").textContent = fromD
    ? `Band ${band} = ${gbp(entered)} × ${ratioOf(band)}/${D_RATIO} = ${gbp(annual)}${pct ? ` − ${pct}% discount` : ""}`
    : `Band ${band} charge ${gbp(annual)}${pct ? ` − ${pct}% discount` : ""}`;
  $("out-annual").textContent = gbp(annual);
  $("out-discount").textContent = pct ? `−${gbp(discount)}` : gbp(0);
  $("out-first").textContent = gbp(s.first);
  $("out-rest").textContent = gbp(s.rest);
  $("rest-label").textContent = `Instalments 2 to ${count}`;
  $("ct-small").hidden = !s.small || payable === 0;

  lastTitle = `Council Tax Band ${band} (England)`;
  lastLines = [
    [`Band ${band} for the year`, gbp(annual)],
    ...(pct ? ([[`${pct}% discount`, `−${gbp(discount)}`]] as [string, string][]) : []),
    ["To pay for the year", gbp(payable)],
    [`First of ${count} instalments`, gbp(s.first)],
    [`Then ${count - 1} ×`, gbp(s.rest)],
  ];
}

for (const el of [modeSel, bandSel, discSel, countSel]) el.addEventListener("change", compute);
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
  downloadCard(buildCard(), "uk-council-tax-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Council Tax calculation - jupocket.com");
});

compute();
