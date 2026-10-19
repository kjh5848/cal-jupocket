/**
 * 일본어판 割増賃金の基礎となる1時間あたりの賃金(/ja/hourly-wage-base/) — 계산은 lib/jp/hourly-wage-base.ts(일본 제도).
 * 한국어판 통상임금과는 제도가 달라 짝이 아니므로 화면 문구는 일본어만 둔다.
 */
import {
  monthlyAverageHours,
  annualWorkDays,
  hourlyFromMonthly,
  hourlyFromDaily,
  formatSen,
  formatHours,
} from "../lib/jp/hourly-wage-base";
import { formatYen, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("jp-hourly-wage-base");

const $ = (id: string) => document.getElementById(id)!;
const modeSel = $("hw-mode") as HTMLSelectElement;
const baseIn = $("hw-base") as HTMLInputElement;
const incIn = $("hw-included") as HTMLInputElement;
const excIn = $("hw-excluded") as HTMLInputElement;
const holIn = $("hw-holidays") as HTMLInputElement;
const yearSel = $("hw-year") as HTMLSelectElement;
const hoursIn = $("hw-hours") as HTMLInputElement;
const monthlyOnly = document.querySelectorAll<HTMLElement>("[data-monthly-only]");

let lastTitle = "";
let lastLines: [string, string][] = [];

/** 全角の数字・小数点も半角に直してから読む */
const toHalf = (s: string) =>
  s.replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const yen = (el: HTMLInputElement) => parseAmount(toHalf(el.value));
const dec = (el: HTMLInputElement) => {
  const v = Number(toHalf(el.value));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

function compute() {
  const daily = modeSel.value === "daily";
  for (const el of monthlyOnly) el.hidden = daily;
  const dailyHours = dec(hoursIn);

  $("hw-base-label").textContent = daily ? "日給" : "基本給（月額）";

  if (daily) {
    const r = hourlyFromDaily(yen(baseIn), dailyHours);
    $("hero-value").textContent = formatSen(r.hourly);
    $("hw-formula").textContent = `${formatYen(r.base)} ÷ ${formatHours(dailyHours)}（施行規則 第19条 第1項 二号）`;
    $("out-base-label").textContent = "基礎となる日給";
    $("out-base").textContent = formatYen(r.base);
    $("out-hours-label").textContent = "1日の所定労働時間";
    $("out-hours").textContent = formatHours(dailyHours);
    $("out-days").textContent = "—";
    $("out-excluded").textContent = "—";
    lastLines = [
      ["日給", formatYen(r.base)],
      ["1日の所定労働時間", formatHours(dailyHours)],
      ["1時間あたりの賃金", formatSen(r.hourly)],
    ];
  } else {
    const year = (yearSel.value === "366" ? 366 : 365) as 365 | 366;
    const days = annualWorkDays(year, dec(holIn));
    const hours = monthlyAverageHours(days, dailyHours);
    const r = hourlyFromMonthly({ basePay: yen(baseIn), includedAllowances: yen(incIn), excludedAllowances: yen(excIn), monthlyHours: hours });
    $("hero-value").textContent = formatSen(r.hourly);
    $("hw-formula").textContent = `${formatYen(r.base)} ÷ ${formatHours(hours)}（施行規則 第19条 第1項 四号）`;
    $("out-base-label").textContent = "基礎となる賃金（月額）";
    $("out-base").textContent = formatYen(r.base);
    $("out-hours-label").textContent = "月平均所定労働時間";
    $("out-hours").textContent = formatHours(hours);
    $("out-days").textContent = `${days}日`;
    $("out-excluded").textContent = formatYen(yen(excIn));
    lastLines = [
      ["基礎となる賃金（月額）", formatYen(r.base)],
      ["月平均所定労働時間", formatHours(hours)],
      ["1時間あたりの賃金", formatSen(r.hourly)],
    ];
  }
  lastTitle = "割増賃金の基礎となる1時間あたりの賃金";
}

for (const el of [modeSel, yearSel]) el.addEventListener("change", compute);
for (const el of [holIn, hoursIn]) el.addEventListener("input", compute);
for (const el of [baseIn, incIn, excIn]) {
  el.addEventListener("input", () => {
    const value = yen(el);
    if (el === baseIn) reportUse(value);
    el.value = value === 0 ? "" : value.toLocaleString("ja-JP");
    const end = el.value.length;
    el.setSelectionRange(end, end);
    compute();
  });
}

const buildCard = () => renderCard({ title: lastTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "jp-hourly-wage-base" });
  downloadCard(buildCard(), "hourly-wage-base-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "jp-hourly-wage-base" });
  await shareCard(buildCard(), "1時間あたりの賃金の計算結果 - jupocket.com");
});

compute();
