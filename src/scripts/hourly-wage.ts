/**
 * 시급 계산기 — /guide/hourly-wage-calculator/.
 * 계산은 src/lib/labor.ts hourlyWagePay() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { hourlyWagePay } from "../lib/labor";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("hourly-wage");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const wage = $<HTMLInputElement>("hw-wage");
const daily = $<HTMLInputElement>("hw-daily");
const days = $<HTMLInputElement>("hw-days");
const holiday = $<HTMLSelectElement>("hw-holiday");
const year = $<HTMLSelectElement>("hw-year");

function render() {
  const y = (year.value === "2027" ? 2027 : 2026) as 2026 | 2027;
  const x = hourlyWagePay(parseAmount(wage.value), Number(daily.value) || 0, Number(days.value) || 0, holiday.value === "1", y);
  $("hw-hero").textContent = formatWon(x.monthly);
  $("hw-note").textContent = `${y}년 최저시급 ${formatWon(x.minWage)} ${x.meetsMin ? "이상" : "미만"} · 연봉 ${formatWon(x.annual)}`;
  $("hw-day").textContent = formatWon(x.daily);
  $("hw-hh").textContent = `${x.holidayHours}시간`;
  $("hw-base").textContent = formatWon(x.weekBase);
  $("hw-hol").textContent = formatWon(x.weekHoliday);
  $("hw-week").textContent = formatWon(x.weekTotal);
  $("hw-mh").textContent = `${x.monthHours}시간`;
  $("hw-annual").textContent = formatWon(x.annual);
  const over = $("hw-over");
  over.hidden = x.overHours <= 0;
  over.textContent = `하루 8시간·주 40시간을 넘는 주 ${x.overHours}시간은 연장근로라 위 금액에 넣지 않았습니다(근로기준법 제50조).`;
}

function onUserInput() {
  render();
  reportUse(parseAmount(wage.value));
}

wage.addEventListener("input", () => {
  const n = parseAmount(wage.value);
  wage.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
for (const el of [daily, days, holiday, year]) el.addEventListener("input", onUserInput);
document.querySelectorAll<HTMLButtonElement>("[data-hw-wage]").forEach((b) =>
  b.addEventListener("click", () => {
    wage.value = formatAmountInput(Number(b.dataset.hwWage));
    year.value = b.dataset.hwYear === "2027" ? "2027" : "2026";
    year.dispatchEvent(new Event("change", { bubbles: true }));
    onUserInput();
  }),
);
render();
