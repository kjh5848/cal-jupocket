/**
 * 야근수당 계산기 — /guide/overtime-pay-calculator/.
 * 계산은 src/lib/overtime.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { overtimePay, ordinaryHourly, splitHoliday } from "../lib/overtime";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import { minWage } from "../lib/labor";
import labor from "../rates/labor-2026.json";

const reportUse = trackCalculatorUse("overtime-pay");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const mode = $<HTMLSelectElement>("ot-mode");
const wage = $<HTMLInputElement>("ot-wage");
const week = $<HTMLInputElement>("ot-week");
const scale = $<HTMLSelectElement>("ot-scale");
const ot = $<HTMLInputElement>("ot-ot");
const night = $<HTMLInputElement>("ot-night");
const hol = $<HTMLInputElement>("ot-hol");
const hold = $<HTMLInputElement>("ot-hold");

function render() {
  const monthly = mode.value === "monthly";
  $("ot-wage-label").textContent = monthly ? "월급" : "시급";
  $("ot-week-wrap").hidden = !monthly;
  const hourly = ordinaryHourly({ mode: monthly ? "monthly" : "hourly", wage: parseAmount(wage.value), weeklyHours: Number(week.value) || 0 });
  const h = splitHoliday(Number(hol.value) || 0, Number(hold.value) || 0);
  const small = scale.value === "small";
  const x = overtimePay({ hourly, overtime: Number(ot.value) || 0, night: Number(night.value) || 0, holidayWithin: h.within, holidayOver: h.over, small });
  $("ot-hero").textContent = formatWon(x.total);
  $("ot-note").textContent = small ? `상시 4명 이하 — 가산 없음 · 통상시급 ${formatWon(x.hourly)}` : `가산수당 ${formatWon(x.premiumTotal)} · 통상시급 ${formatWon(x.hourly)}`;
  $("ot-hourly").textContent = formatWon(x.hourly);
  $("ot-base").textContent = formatWon(x.basePay);
  $("ot-p-ot").textContent = formatWon(x.premium.overtime);
  $("ot-p-night").textContent = formatWon(x.premium.night);
  $("ot-hw-label").textContent = `휴일 8시간 이내 50% (${h.within}시간)`;
  $("ot-p-hw").textContent = formatWon(x.premium.holidayWithin);
  $("ot-ho-label").textContent = `휴일 8시간 초과 100% (${h.over}시간)`;
  $("ot-p-ho").textContent = formatWon(x.premium.holidayOver);
  $("ot-prem").textContent = formatWon(x.premiumTotal);
  const notes: string[] = [];
  if (small) notes.push("상시 4명 이하 사업장은 근로기준법 제56조가 적용되지 않아 가산 없이 일한 시간 임금만 계산했습니다(시행령 별표 1).");
  if (x.overWeeklyLimit) notes.push("1주 기준이라면 연장근로는 합의해도 12시간까지입니다(제53조 제1항). 한 달 합계라면 이 안내는 무시하세요.");
  const warn = $("ot-warn");
  warn.hidden = notes.length === 0;
  warn.textContent = notes.join(" ");
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
for (const el of [week, scale, ot, night, hol, hold]) el.addEventListener("input", onUserInput);
// 기준을 바꾸면 금액도 그 기준의 2026 최저(시급 / 고시 월 환산액)로 — 시급 10,320원을 월급으로 읽지 않게
mode.addEventListener("input", () => {
  wage.value = formatAmountInput(mode.value === "monthly" ? labor.minWage["2026"].monthly : minWage(2026));
  onUserInput();
});
document.querySelectorAll<HTMLButtonElement>("[data-ot-wage]").forEach((b) =>
  b.addEventListener("click", () => {
    mode.value = "hourly";
    mode.dispatchEvent(new Event("change", { bubbles: true }));
    wage.value = formatAmountInput(Number(b.dataset.otWage));
    onUserInput();
  }),
);
render();
