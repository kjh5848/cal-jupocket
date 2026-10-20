/**
 * 영국판 법정 유급휴가 계산기(/en-gb/holiday-entitlement/) 화면 — 계산은 lib/gb/holiday.ts(영국 제도).
 * 한국어판 연차와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 * 카드 넷: 1년 휴가 · 첫해 발생 · 퇴사 · irregular hours(GB).
 */
import { annualDays, annualHours, firstYearAccrued, leaving, irregularAccrued, fmt } from "./holiday";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "gb-holiday-entitlement";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const val = (id: string) => ($(id) as HTMLInputElement).value;
const num = (id: string) => {
  const n = Number(val(id).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const days = (n: number) => `${fmt(n)} ${n === 1 ? "day" : "days"}`;
const hours = (n: number) => `${fmt(n)} ${n === 1 ? "hour" : "hours"}`;

let lastTitle = "";
let lastLines: [string, string][] = [];

function computeAnnual() {
  const d = num("he-days");
  const h = num("he-hours");
  const r = annualDays(d);
  $("he-value").textContent = days(r.days);
  $("he-formula").textContent = r.capped
    ? `${fmt(d)} × 5.6 = ${fmt(r.uncapped)}, but statutory leave is capped at 28 days`
    : `${fmt(d)} days a week × 5.6 weeks = ${fmt(r.days)} days`;
  $("he-weeks").textContent = "5.6 weeks";
  const hr = annualHours(d, h);
  $("he-in-hours").textContent = hr === null ? "Not worked out (over 5 days a week)" : h > 0 ? hours(hr) : "—";
  lastTitle = "UK statutory holiday entitlement";
  lastLines = [
    ["Days worked a week", fmt(d)],
    ["Statutory leave a year", days(r.days)],
    ...(hr !== null && h > 0 ? ([["In hours", hours(hr)]] as [string, string][]) : []),
  ];
}

function computeFirstYear() {
  const d = num("fy-days");
  const m = Math.floor(num("fy-months"));
  const taken = num("fy-taken");
  const acc = firstYearAccrued(d, m);
  const raw = (annualDays(d).days * Math.max(0, Math.min(12, m))) / 12;
  $("fy-value").textContent = days(acc);
  $("fy-formula").textContent = `${fmt(annualDays(d).days)} ÷ 12 × ${Math.max(0, Math.min(12, m))} = ${fmt(raw)}, rounded up to the next half day`;
  const left = acc - taken;
  $("fy-left").textContent = left >= 0 ? days(left) : "None — more taken than accrued";
}

function computeLeaving() {
  const r = leaving(num("lv-days"), val("lv-start"), val("lv-end"), num("lv-taken"));
  if (!r) {
    $("lv-value").textContent = "—";
    $("lv-formula").textContent = "Enter a leaving date inside the leave year that starts on the first date.";
    $("lv-a").textContent = "—";
    $("lv-b").textContent = "—";
    return;
  }
  $("lv-a").textContent = days(r.a);
  $("lv-b").textContent = `${r.elapsedDays} of ${r.yearDays} days (${fmt(r.b * 100, 1)}%)`;
  $("lv-formula").textContent = `(${fmt(r.a)} × ${r.elapsedDays}/${r.yearDays}) − ${fmt(num("lv-taken"))} = ${fmt(r.owed)}`;
  $("lv-value").textContent = r.owed >= 0 ? days(r.owed) : `${days(-r.owed)} more taken than accrued`;
}

function computeIrregular() {
  const h = num("ir-hours");
  const r = irregularAccrued(h);
  $("ir-value").textContent = hours(r.hours);
  $("ir-formula").textContent = `${fmt(h)} hours × 12.07% = ${fmt(r.raw, 3)} hours, rounded to the nearest hour`;
}

const groups: [string[], () => void][] = [
  [["he-days", "he-hours"], computeAnnual],
  [["fy-days", "fy-months", "fy-taken"], computeFirstYear],
  [["lv-days", "lv-start", "lv-end", "lv-taken"], computeLeaving],
  [["ir-hours"], computeIrregular],
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

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "uk-holiday-entitlement.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "UK holiday entitlement - jupocket.com");
});

computeFirstYear();
computeIrregular();
computeLeaving();
computeAnnual();
