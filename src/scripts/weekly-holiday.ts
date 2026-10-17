/**
 * 주휴수당 계산기 — /guide/weekly-holiday-pay-calculator/.
 * 계산은 src/lib/labor.ts weeklyHolidayPay() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { weeklyHolidayPay } from "../lib/labor";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("weekly-holiday-pay");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const wage = $<HTMLInputElement>("wh-wage");
const hours = $<HTMLInputElement>("wh-hours");
const attend = $<HTMLInputElement>("wh-attend");

function render() {
  const h = Number(hours.value) || 0;
  const x = weeklyHolidayPay(parseAmount(wage.value), h, attend.checked);
  $("wh-hero").textContent = formatWon(x.weekly);
  $("wh-h").textContent = `${x.hours}시간`;
  $("wh-incl").textContent = formatWon(x.hourlyWithHoliday);
  $("wh-base").textContent = formatWon(x.base);
  $("wh-holiday").textContent = formatWon(x.weekly);
  $("wh-mbase").textContent = formatWon(x.monthlyBase);
  $("wh-month").textContent = formatWon(x.monthly);
  $("wh-note").textContent =
    h > 0 && h < 15
      ? "4주 평균 주 15시간 미만이면 주휴수당이 없습니다(근로기준법 제18조 제3항)."
      : !attend.checked
        ? "소정근로일을 다 나오지 않은 주에는 유급휴일이 생기지 않습니다(시행령 제30조 제1항)."
        : h > 40
          ? "1주 소정근로시간은 40시간을 넘을 수 없어 40시간으로 계산했습니다."
          : "";
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
hours.addEventListener("input", onUserInput);
attend.addEventListener("change", onUserInput);
document.querySelectorAll<HTMLButtonElement>("[data-wh-wage]").forEach((b) =>
  b.addEventListener("click", () => {
    wage.value = formatAmountInput(Number(b.dataset.whWage));
    onUserInput();
  }),
);
render();
