/**
 * 영국판 Stamp Duty 계산기(/en-gb/stamp-duty/) 화면 — 계산은 lib/gb/stamp-duty.ts(영국 제도).
 * 한국어판 취득세와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { sdlt, gbp0, bandTax, money, FTB_MAX, HIGHER_MIN, SURCHARGE_MIN, type Table } from "./stamp-duty";
import { parsePence, poundsInput } from "./vat";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-stamp-duty";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const priceIn = $("sd-price") as HTMLInputElement;
const buyerSel = $("sd-buyer") as HTMLSelectElement;
const resSel = $("sd-resident") as HTMLSelectElement;

const TABLE_NAME: Record<Table, string> = {
  standard: "standard residential rates",
  higher: "higher rates for additional properties",
  firstTimeBuyer: "first-time buyer relief rates",
};

let lastTitle = "";
let lastLines: [string, string][] = [];

function compute() {
  const chosen: Table = buyerSel.value === "higher" ? "higher" : buyerSel.value === "ftb" ? "firstTimeBuyer" : "standard";
  const nonResident = resSel.value === "non";
  const price = parsePence(priceIn.value);
  const r = sdlt(price, chosen, nonResident);

  $("hero-value").textContent = gbp0(r.total);
  const rate = price > 0 ? ((r.total * 100) / (price / 100)).toFixed(2) : "0.00";
  $("sd-effective").textContent = `Effective rate ${rate}% of ${money(price)} — ${TABLE_NAME[r.table]}${r.surcharge ? " + 2% non-resident surcharge" : ""}`;

  const list = $("sd-bands");
  list.textContent = "";
  for (const l of r.lines) {
    const li = document.createElement("li");
    const range = l.upTo === null ? `above ${gbp0(l.from)}` : l.from === 0 ? `up to ${gbp0(l.upTo)}` : `${gbp0(l.from)} to ${gbp0(l.upTo)}`;
    li.textContent = `${l.pct}% on ${money(l.portion)} (${range}) = ${bandTax(l.taxCentiPence)}`;
    list.appendChild(li);
  }

  const notes: string[] = [];
  if (r.ftbOverLimit) notes.push(`First-time buyer relief cannot be claimed above ${gbp0(FTB_MAX)}, so the standard rates are used.`);
  if (r.higherBelowMin) notes.push(`The higher rates only apply when the price is ${gbp0(HIGHER_MIN)} or more, so the standard rates are used.`);
  if (r.surchargeBelowMin) notes.push(`The 2% non-resident surcharge only applies when the price is ${gbp0(SURCHARGE_MIN)} or more.`);
  notes.push("Total rounded down to the nearest pound.");
  $("sd-note").textContent = notes.join(" ");

  lastTitle = "UK Stamp Duty (SDLT), England and NI";
  lastLines = [
    ["Price", money(price)],
    ["Rates", TABLE_NAME[r.table] + (r.surcharge ? " + 2%" : "")],
    ["SDLT", gbp0(r.total)],
  ];
}

for (const el of [buyerSel, resSel]) el.addEventListener("change", compute);
priceIn.addEventListener("input", () => {
  reportUse(parsePence(priceIn.value) / 100);
  compute();
});
priceIn.addEventListener("blur", () => {
  const v = parsePence(priceIn.value);
  priceIn.value = v === 0 ? "" : poundsInput(v).replace(/\.00$/, "");
});

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "uk-stamp-duty-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "UK Stamp Duty calculation - jupocket.com");
});

compute();
