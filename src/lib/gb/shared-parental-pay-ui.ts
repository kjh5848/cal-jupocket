/**
 * 영국판 ShPP 계산기(/en-gb/shared-parental-pay/) 화면 — 계산은 lib/gb/shared-parental-pay.ts(영국 제도).
 * 한국어판 육아휴직 급여와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 * 카드 셋: 주 지급액 · NWE 도우미(relevant period 소득) · 남은 주 수와 합계.
 */
import { weeklyRate, nweWeekly, nweMonthly, nweDays, nwePence, weeksLeft, type WeeklyRate } from "./shared-parental-pay";
import { parsePence, gbp } from "./vat";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-shared-parental-pay";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement | HTMLSelectElement).value;
const num = (id: string) => {
  const n = Number(val(id).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const weeksText = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;

let rate: WeeklyRate = weeklyRate(nweWeekly(0));
let lastLines: [string, string][] = [];

function computeRate() {
  const p = parsePence(val("sp-nwe"));
  rate = weeklyRate(nweWeekly(p));
  $("sp-value").textContent = `${gbp(rate.weekly)} a week`;
  $("sp-formula").textContent = rate.capped
    ? `90% of ${gbp(p)} is ${gbp(rate.ninety)}, so the £194.32 maximum applies`
    : `90% of ${gbp(p)} = ${gbp(rate.ninety)} (rounded up to the penny), below £194.32`;
  $("sp-daily").textContent = gbp(rate.daily);
  $("sp-rule").textContent = rate.capped ? "£194.32 flat rate" : "90% of earnings";
  computeWeeks();
}

function computeHelper() {
  const e = parsePence(val("nw-earn"));
  const monthly = val("nw-freq") === "monthly";
  const n = monthly ? nweMonthly(e, num("nw-count")) : nweDays(e, num("nw-count"));
  $("nw-count-label").textContent = monthly ? "Calendar months in the period" : "Days in the period";
  if (!n) {
    $("nw-value").textContent = "—";
    $("nw-formula").textContent = monthly ? "Enter at least 1 month." : "Enter at least 1 day.";
    $("nw-shpp").textContent = "—";
    return;
  }
  const w = nwePence(n);
  const months = Math.round(num("nw-count"));
  $("nw-value").textContent = `${gbp(Math.floor(w))}${w % 1 ? "…" : ""} a week`;
  $("nw-formula").textContent = monthly
    ? `${gbp(e)} ÷ ${months} × 12 ÷ 52`
    : `${gbp(e)} ÷ ${Math.floor(num("nw-count"))} days × 7`;
  $("nw-shpp").textContent = gbp(weeklyRate(n).weekly);
}

function computeWeeks() {
  const r = weeksLeft(num("wk-smp"), num("wk-partner"));
  $("wk-value").textContent = weeksText(r.weeks);
  $("wk-formula").textContent =
    `39 − ${r.smp} − ${r.partner} = ${r.weeks}` + (r.raisedToMin ? " (maternity pay counted as at least 2 weeks)" : "");
  const total = r.weeks * rate.weekly;
  $("wk-total").textContent = r.weeks > 0 ? `${gbp(total)}` : "—";
  $("wk-total-formula").textContent = r.weeks > 0 ? `${r.weeks} × ${gbp(rate.weekly)}` : "No ShPP weeks left";
  lastLines = [
    ["Weekly ShPP", gbp(rate.weekly)],
    ["Daily rate", gbp(rate.daily)],
    ["ShPP weeks left", weeksText(r.weeks)],
    ...(r.weeks > 0 ? ([["Total at this rate", gbp(total)]] as [string, string][]) : []),
  ];
}

const groups: [string[], () => void][] = [
  [["sp-nwe"], computeRate],
  [["nw-earn", "nw-freq", "nw-count"], computeHelper],
  [["wk-smp", "wk-partner"], computeWeeks],
];
for (const [ids, fn] of groups) {
  for (const id of ids) {
    const el = $(id);
    el.addEventListener("input", () => {
      reportUse(1);
      fn();
    });
    el.addEventListener("change", fn);
  }
}

const buildCard = () => renderCard({ title: "UK Statutory Shared Parental Pay", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "uk-shared-parental-pay.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "UK Shared Parental Pay - jupocket.com");
});

computeHelper();
computeRate();
