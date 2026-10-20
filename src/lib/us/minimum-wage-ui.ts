/**
 * 미국판 최저임금 계산기(/en-us/minimum-wage/) 화면 — 계산은 lib/us/minimum-wage.ts(미국 연방 FLSA).
 * 한국어판 최저임금과 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { checkPay, checkTipped, FEDERAL_MIN, YOUTH_MIN, OT_HOURS, type Period } from "./minimum-wage";
import { parseUsd, usd } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-minimum-wage";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const payIn = $("mw-pay") as HTMLInputElement;
const periodSel = $("mw-period") as HTMLSelectElement;
const hoursIn = $("mw-hours") as HTMLInputElement;
const minSel = $("mw-min") as HTMLSelectElement;
const cashIn = $("tp-cash") as HTMLInputElement;
const tipsIn = $("tp-tips") as HTMLInputElement;
const tpHoursIn = $("tp-hours") as HTMLInputElement;

const PERIODS: Period[] = ["hourly", "weekly", "biweekly", "semimonthly", "monthly", "yearly"];
const PERIOD_NAME: Record<Period, string> = {
  hourly: "Hourly",
  weekly: "Weekly",
  biweekly: "Biweekly",
  semimonthly: "Semimonthly",
  monthly: "Monthly",
  yearly: "Yearly",
};

let lastLines: [string, string][] = [];

const hoursOf = (el: HTMLInputElement) => {
  const v = parseFloat(el.value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) && v > 0 ? Math.min(v, 168) : 0;
};

function compute() {
  const pay = parseUsd(payIn.value);
  const period = (PERIODS.includes(periodSel.value as Period) ? periodSel.value : "yearly") as Period;
  const hours = hoursOf(hoursIn);
  const youth = minSel.value === "youth";
  const minimum = youth ? YOUTH_MIN : FEDERAL_MIN;
  const c = checkPay(pay, period, hours, minimum);

  $("hero-value").textContent = usd(c.hourly);
  $("mw-hint").textContent =
    pay === 0 || hours === 0
      ? "Enter the pay and the hours worked in a week."
      : c.meets
        ? c.overtimeHours > 0 && period !== "hourly"
          ? `Covers the ${youth ? "youth" : "federal"} minimum-wage floor for ${hours} hours (${usd(minimum)}, 1.5× over 40) by ${usd(c.margin)} a week. Overtime at 1.5× your own rate is a separate check.`
          : `At or above the ${youth ? "youth" : "federal"} minimum of ${usd(minimum)} an hour — ${usd(c.margin)} a week to spare.`
        : `Below the ${youth ? "youth" : "federal"} minimum-wage floor for ${hours} hours${c.overtimeHours > 0 ? " (1.5× over 40)" : ""} — ${usd(-c.margin)} a week short.`;
  $("out-weekly").textContent = usd(c.weekly);
  $("out-floor").textContent = usd(c.floor);
  $("out-ot").textContent = c.overtimeHours > 0 ? `${c.overtimeHours} h at 1.5×` : "None";
  $("out-margin").textContent = (c.margin < 0 ? "−" : "") + usd(Math.abs(c.margin));

  lastLines = [
    [`${PERIOD_NAME[period]} pay`, usd(pay)],
    ["Hours per week", String(hours)],
    ["Hourly rate", usd(c.hourly)],
    [`Minimum for ${hours} h (${usd(minimum)}/h)`, usd(c.floor)],
    [c.meets ? "Meets the minimum" : "Short each week", usd(Math.abs(c.margin))],
  ];

  const t = checkTipped(parseUsd(cashIn.value), parseUsd(tipsIn.value), hoursOf(tpHoursIn));
  $("out-credit").textContent = usd(t.tipCredit);
  $("out-required").textContent = usd(t.required);
  $("out-received").textContent = usd(t.received);
  $("out-makeup").textContent = usd(t.makeUp);
  $("tp-hint").textContent = !t.cashOk
    ? "The cash wage is below $2.13 an hour, the lowest the FLSA allows for tipped employees."
    : hoursOf(tpHoursIn) > OT_HOURS
      ? "Only the first 40 hours are checked here; overtime for tipped employees is not calculated."
      : "";
}

for (const el of [payIn, hoursIn, cashIn, tipsIn, tpHoursIn]) {
  el.addEventListener("input", () => {
    reportUse(parseUsd(payIn.value));
    compute();
  });
}
periodSel.addEventListener("change", compute);
minSel.addEventListener("change", compute);

const buildCard = () => renderCard({ title: "Pay vs federal minimum wage", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "minimum-wage-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Minimum wage calculator result - jupocket.com");
});

compute();
