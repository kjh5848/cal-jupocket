/**
 * 영국판 Vehicle Tax 계산기(/en-gb/vehicle-tax/) 화면 — 계산은 lib/gb/vehicle-tax.ts(VERA 1994 Sch 1, GOV.UK 표).
 * 한국어판 자동차세와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { vehicleTax, eraOf, gbpP, gbp0, type Fuel, type Payment } from "./vehicle-tax";
import { parsePence } from "./vat";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-vehicle-tax";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const regIn = $("vt-registered") as HTMLInputElement;
const fromIn = $("vt-from") as HTMLInputElement;
const fuelSel = $("vt-fuel") as HTMLSelectElement;
const co2In = $("vt-co2") as HTMLInputElement;
const ccIn = $("vt-cc") as HTMLInputElement;
const priceIn = $("vt-price") as HTMLInputElement;
const paySel = $("vt-payment") as HTMLSelectElement;

const show = (id: string, on: boolean) => {
  ($(id) as HTMLElement).hidden = !on;
};
const intOf = (s: string) => {
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

let lastTitle = "";
let lastLines: [string, string][] = [];

function compute() {
  const registered = isDate(regIn.value) ? regIn.value : "2021-05-01";
  const taxFrom = isDate(fromIn.value) ? fromIn.value : registered;
  const fuel = fuelSel.value as Fuel;
  const era = eraOf(registered);
  const payment = (era === "post2017" ? paySel.value : "later") as Payment;

  show("wrap-payment", era === "post2017");
  show("wrap-price", era === "post2017" && payment === "later");
  show("wrap-cc", era === "pre2001");
  show("wrap-co2", era !== "pre2001" && fuel !== "electric");

  const r = vehicleTax({
    registered, taxFrom, fuel, payment,
    co2: intOf(co2In.value), engineCc: intOf(ccIn.value), listPrice: Math.floor(parsePence(priceIn.value) / 100),
  });

  $("hero-label").textContent = r.pay ? "Vehicle tax for 12 months" : "First tax payment (covers 12 months)";
  $("hero-value").textContent = gbp0(r.annualPounds);
  $("vt-rule").textContent = r.rule;
  const na = "N/A";
  const first = "—";
  $("out-dd12").textContent = r.pay ? gbpP(r.pay.monthlyDirectDebitTotal) : first;
  $("out-six").textContent = r.pay ? (r.pay.sixMonths === null ? na : gbpP(r.pay.sixMonths)) : first;
  $("out-six-dd").textContent = r.pay ? (r.pay.sixMonthsDirectDebit === null ? na : gbpP(r.pay.sixMonthsDirectDebit)) : first;
  show("vt-first-note", !r.pay);
  show("vt-before", r.beforeRates);
  show("vt-expensive", r.expensive);

  lastTitle = "UK vehicle tax (VED)";
  lastLines = [
    ["Rule", r.rule],
    [r.pay ? "12 months" : "First payment, 12 months", gbp0(r.annualPounds)],
    ...(r.pay
      ? ([
          ["12 monthly Direct Debits, total", gbpP(r.pay.monthlyDirectDebitTotal)],
          ["6 months", r.pay.sixMonths === null ? na : gbpP(r.pay.sixMonths)],
          ["6 months by Direct Debit", r.pay.sixMonthsDirectDebit === null ? na : gbpP(r.pay.sixMonthsDirectDebit)],
        ] as [string, string][])
      : []),
  ];
}

for (const el of [regIn, fromIn, fuelSel, paySel]) el.addEventListener("change", compute);
for (const el of [co2In, ccIn, priceIn]) {
  el.addEventListener("input", () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "uk-vehicle-tax-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "UK vehicle tax calculation - jupocket.com");
});

compute();
