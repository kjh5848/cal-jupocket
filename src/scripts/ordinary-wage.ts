/**
 * 통상임금 계산기 — /guide/ordinary-wage-calculator/.
 * 계산은 src/lib/ordinary-wage.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { ordinaryWage, type WageItem, type WagePeriod } from "../lib/ordinary-wage";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("ordinary-wage");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amounts = [...document.querySelectorAll<HTMLInputElement>("[data-ow-amount]")];
const ids = amounts.map((a) => a.dataset.owAmount!);
const week = $<HTMLInputElement>("ow-week");
const day = $<HTMLInputElement>("ow-day");
const extra = $<HTMLInputElement>("ow-extra");
const hrs = (v: number) => `${Math.round(v * 100) / 100}시간`;

function items(): WageItem[] {
  return ids.map((id) => ({
    label: id,
    amount: parseAmount($<HTMLInputElement>(`ow-${id}`).value),
    period: $<HTMLSelectElement>(`ow-${id}-p`).value as WagePeriod,
    include: $<HTMLSelectElement>(`ow-${id}-i`).value === "1",
  }));
}

function render() {
  const x = ordinaryWage(items(), { weeklyHours: Number(week.value) || 0, dailyHours: Number(day.value) || 0, extraPaidWeekly: Number(extra.value) || 0 });
  const base = x.rows[0].include ? x.rows[0].monthly : 0;
  $("ow-hero").textContent = formatWon(x.hourly);
  $("ow-note").textContent = `1일 통상임금 ${formatWon(x.daily)} · 월 ${formatWon(x.monthly)} ÷ ${hrs(x.basis.monthly)}`;
  $("ow-daily").textContent = formatWon(x.daily);
  $("ow-monthly").textContent = formatWon(x.monthly);
  $("ow-m-base").textContent = formatWon(base);
  $("ow-m-extra").textContent = formatWon(Math.max(0, x.monthly - base));
  $("ow-m-out").textContent = formatWon(x.excludedMonthly);
  $("ow-h-week").textContent = hrs(x.basis.weekly);
  $("ow-h-month").textContent = hrs(x.basis.monthly);
  const notes: string[] = [];
  if (Number(week.value) > 40) notes.push("1주 소정근로시간은 40시간을 넘을 수 없어 40시간으로 계산했습니다(근로기준법 제50조). 넘는 시간은 연장근로입니다.");
  if (x.basis.holiday === 0 && x.basis.week > 0) notes.push("1주 15시간 미만이면 주휴시간이 없어 소정근로시간만으로 나눴습니다(근로기준법 제18조 제3항).");
  if (x.rows.some((r) => r.period === "day" && r.amount > 0) && !(Number(day.value) > 0)) notes.push("일급 항목은 1일 소정근로시간이 있어야 나눌 수 있습니다.");
  const warn = $("ow-warn");
  warn.hidden = notes.length === 0;
  warn.textContent = notes.join(" ");
}

function onUserInput() {
  render();
  reportUse(parseAmount(amounts[0].value));
}

for (const a of amounts)
  a.addEventListener("input", () => {
    const n = parseAmount(a.value);
    a.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
document.querySelectorAll<HTMLSelectElement>("[data-ow-period], [data-ow-include]").forEach((s) => s.addEventListener("input", onUserInput));
for (const el of [week, day, extra]) el.addEventListener("input", onUserInput);
render();
