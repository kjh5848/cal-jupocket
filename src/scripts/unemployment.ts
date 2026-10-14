/**
 * 실업급여 계산기 — /guide/unemployment-benefit-calculator/.
 * 계산은 src/lib/unemployment.ts unemploymentBenefit() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { unemploymentBenefit, daysInLastThreeMonths } from "../lib/unemployment";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("unemployment-benefit");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pay = $<HTMLInputElement>("ub-pay");
const leave = $<HTMLInputElement>("ub-leave");
const hours = $<HTMLInputElement>("ub-hours");
const years = $<HTMLSelectElement>("ub-years");
const age = $<HTMLSelectElement>("ub-age");

/** "YYYY-MM-DD" → 현지 날짜 */
const parse = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

function render() {
  const d = parse(leave.value) ?? new Date();
  // 2026. 1. 1. 전 이직자는 종전 상한(시행령 부칙), 2028. 1. 1.부터는 기초일액 산정 방식이 바뀐다(법 제45조 개정) — 계산하지 않는다
  if (d < new Date(2026, 0, 1) || d > new Date(2027, 11, 31)) {
    for (const id of ["ub-hero", "ub-daily", "ub-days", "ub-avg", "ub-which"]) $(id).textContent = "—";
    $("ub-note").textContent = "2026년 1월 1일~2027년 12월 31일 이직만 계산합니다. 그 전은 종전 상한, 2028년부터는 기초일액 산정 방식이 바뀝니다.";
    return;
  }
  const h = Number(hours.value) || 0;
  const x = unemploymentBenefit({
    wage3m: parseAmount(pay.value) * 3,
    days3m: daysInLastThreeMonths(d),
    weeklyHours: h,
    insuredYears: Number(years.value),
    over50: age.value === "1",
    year: d.getFullYear() >= 2027 ? 2027 : 2026,
  });
  $("ub-hero").textContent = formatWon(x.total);
  $("ub-daily").textContent = formatWon(x.daily);
  $("ub-days").textContent = `${x.days}일`;
  $("ub-avg").textContent = formatWon(x.average);
  $("ub-which").textContent = x.which;
  $("ub-note").textContent =
    h < 15 ? "주 15시간 미만(월 60시간 미만)이면 3개월 이상 계속 근로가 아닌 한 고용보험 적용 대상이 아닐 수 있습니다." : `하한 ${formatWon(x.minDaily)} · 상한 ${formatWon(x.maxDaily)} (1일 소정근로시간 ${x.hours}시간)`;
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
for (const el of [leave, hours, years, age]) el.addEventListener("input", onUserInput);
render();
