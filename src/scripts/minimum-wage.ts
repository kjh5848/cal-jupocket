/**
 * 최저임금 계산기 — /guide/minimum-wage-calculator/.
 * 계산은 src/lib/labor.ts checkMinWage()·minimumMonthly()·minimumWeekly() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { checkMinWage, minimumMonthly, minimumWeekly } from "../lib/labor";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("minimum-wage");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pay = $<HTMLInputElement>("mw-pay");
const hours = $<HTMLInputElement>("mw-hours");
const year = $<HTMLSelectElement>("mw-year");
const prob = $<HTMLSelectElement>("mw-prob");

function render() {
  const y = (Number(year.value) === 2027 ? 2027 : 2026) as 2026 | 2027;
  const h = Number(hours.value) || 0;
  const p = prob.value === "1";
  const m = parseAmount(pay.value);
  const x = checkMinWage(m, h, y, p);
  const need = minimumMonthly(y, h, p);
  $("mw-hero").textContent = formatWon(x.hourly);
  $("mw-h").textContent = `${x.hours}시간`;
  $("mw-min").textContent = formatWon(x.min);
  $("mw-week").textContent = formatWon(minimumWeekly(y, h, p));
  $("mw-over").textContent = formatWon(Math.max(0, m - need));
  $("mw-paid").textContent = formatWon(Math.min(m, need));
  $("mw-short").textContent = formatWon(x.shortfall);
  $("mw-note").textContent = x.ok
    ? `${y}년 기준 시급 ${formatWon(x.min)} 이상입니다.`
    : `${y}년 기준 시급 ${formatWon(x.min)}보다 낮습니다. 월 ${formatWon(x.shortfall)}이 모자랍니다.`;
}

function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

pay.addEventListener("input", () => {
  const n = parseAmount(pay.value);
  pay.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
for (const el of [hours, year, prob]) el.addEventListener("input", onUserInput);
render();
