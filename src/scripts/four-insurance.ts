/**
 * 4대보험 계산기 — /guide/four-insurance-calculator/.
 * 계산은 src/lib/four-insurance.ts payroll() 이 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { payroll } from "../lib/four-insurance";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("four-insurance");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pay = $<HTMLInputElement>("fi-pay");
const tier = $<HTMLSelectElement>("fi-tier");
const over65 = $<HTMLInputElement>("fi-65");
const after = $<HTMLInputElement>("fi-1127");

function render() {
  const x = payroll(parseAmount(pay.value), {
    stabilityTier: Number(tier.value) as 0 | 1 | 2 | 3,
    over65New: over65.checked,
    onDate: after.checked ? "2026-11-27" : "2026-10-13",
  });
  $("fi-hero").textContent = formatWon(x.total);
  $("fi-pension").textContent = formatWon(x.pension);
  $("fi-health").textContent = formatWon(x.health);
  $("fi-care").textContent = formatWon(x.care);
  $("fi-emp").textContent = formatWon(x.employment);
  $("fi-net").textContent = formatWon(x.pay - x.total);
  $("fi-employer").textContent = formatWon(x.employer.total);
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

pay.addEventListener("input", () => {
  const n = parseAmount(pay.value);
  pay.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
for (const el of [tier, over65, after]) el.addEventListener("change", onUserInput);
render();
