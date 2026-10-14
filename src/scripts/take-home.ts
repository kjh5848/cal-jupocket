/**
 * 연봉·월급 실수령액 계산기 — /guide/take-home-calculator/.
 * 계산은 src/lib/take-home.ts takeHome() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { takeHome } from "../lib/take-home";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("take-home");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const mode = $<HTMLSelectElement>("th-mode");
const amount = $<HTMLInputElement>("th-amount");
const nontax = $<HTMLInputElement>("th-nontax");
const family = $<HTMLInputElement>("th-family");
const kids = $<HTMLInputElement>("th-kids");

function render() {
  const a = parseAmount(amount.value);
  const monthly = mode.value === "monthly" ? a : Math.floor(a / 12);
  const x = takeHome(monthly, {
    nonTaxable: parseAmount(nontax.value),
    family: Number(family.value) || 1,
    kids: Number(kids.value) || 0,
  });
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
