/**
 * 연봉·월급 실수령액 계산기 — /guide/take-home-calculator/.
 * 계산은 src/lib/take-home.ts takeHome() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { takeHome } from "../lib/take-home";
import { payPerDay, workTimeFor, type WorkPattern } from "../lib/pay-per-day";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("take-home");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const mode = $<HTMLSelectElement>("th-mode");
const amount = $<HTMLInputElement>("th-amount");
const nontax = $<HTMLInputElement>("th-nontax");
const family = $<HTMLInputElement>("th-family");
const kids = $<HTMLInputElement>("th-kids");

let lastNet = 0;

function render() {
  const a = parseAmount(amount.value);
  const monthly = mode.value === "monthly" ? a : Math.floor(a / 12);
  const x = takeHome(monthly, {
    nonTaxable: parseAmount(nontax.value),
    family: Number(family.value) || 1,
    kids: Number(kids.value) || 0,
  });
  lastNet = x.net;
  $("th-hero").textContent = formatWon(x.net);
  $("th-note").textContent = `세전 월급 ${formatWon(x.gross)}에서 ${formatWon(x.deductions)}이 빠집니다.`;
  $("th-pension").textContent = formatWon(x.pension);
  $("th-health").textContent = formatWon(x.health);
  $("th-care").textContent = formatWon(x.care);
  $("th-emp").textContent = formatWon(x.employment);
  $("th-tax").textContent = formatWon(x.incomeTax);
  $("th-local").textContent = formatWon(x.localTax);
}

function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

for (const el of [amount, nontax]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
mode.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  if (mode.value === "monthly" && n >= 12_000_000) amount.value = formatAmountInput(Math.floor(n / 12));
  if (mode.value === "annual" && n && n < 12_000_000) amount.value = formatAmountInput(n * 12);
  onUserInput();
});
for (const el of [family, kids]) el.addEventListener("input", onUserInput);
render();

// 하루·시간 나누기 — 위 실수령액을 기준 월에 일한 날·근무시간으로 나눈다(src/lib/pay-per-day.ts)
const pdMonth = $<HTMLInputElement>("pd-month");
const pdPattern = $<HTMLSelectElement>("pd-pattern");
const pdDays = $<HTMLInputElement>("pd-days");
const pdHours = $<HTMLInputElement>("pd-hours");
const pdBreak = $<HTMLInputElement>("pd-break");
const pdPrice = $<HTMLInputElement>("pd-price");
const pad2 = (n: number) => String(n).padStart(2, "0");
{
  const d = new Date();
  pdMonth.value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function renderPerDay() {
  const [y, m] = (pdMonth.value || "").split("-").map(Number);
  const d = new Date();
  const year = y || d.getFullYear();
  const month = m || d.getMonth() + 1;
  const pattern = pdPattern.value as WorkPattern;
  $("pd-days-wrap").hidden = pattern !== "custom";
  const r = payPerDay({
    monthly: lastNet,
    year,
    month,
    pattern,
    customDays: Number(pdDays.value) || 0,
    hours: Number(pdHours.value) || 0,
    breakHours: Number(pdBreak.value) || 0,
  });
  $("pd-day").textContent = formatWon(r.perDay);
  $("pd-note").textContent = `${year}년 ${month}월 일한 날 ${r.days}일(달력 ${r.monthDays}일)로 나눴습니다.`;
  $("pd-hour").textContent = formatWon(r.perWorkHour);
  $("pd-work").textContent = `${r.workHours}시간`;
  $("pd-count").textContent = `${r.days}일`;
  // 물건 가격 → 그 돈을 벌려면 일할 시간(근무시간당 금액으로 나눔)
  const need = workTimeFor(parseAmount(pdPrice.value), r.monthly, r.days, r.workHours);
  $("pd-need").textContent = `${need.hours}시간 ${need.mins}분`;
  $("pd-need-days").textContent = `${need.workDays}일`;
}
pdPrice.addEventListener("input", () => {
  const n = parseAmount(pdPrice.value);
  pdPrice.value = n ? formatAmountInput(n) : "";
  renderPerDay();
});
for (const el of [pdMonth, pdPattern, pdDays, pdHours, pdBreak]) el.addEventListener("input", renderPerDay);
pdPattern.addEventListener("change", renderPerDay);
for (const el of [mode, amount, nontax, family, kids]) el.addEventListener("input", renderPerDay);
renderPerDay();
