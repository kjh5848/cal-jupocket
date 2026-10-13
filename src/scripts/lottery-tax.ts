/**
 * 로또 세금 계산기 — /guide/lotto-tax-calculator/.
 * 계산은 src/lib/lottery-tax.ts lotteryTax() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { lotteryTax } from "../lib/lottery-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("lotto-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("lt-amount");

function render() {
  const x = lotteryTax(parseAmount(amount.value));
  $("lt-hero").textContent = formatWon(x.net);
  $("lt-total").textContent = formatWon(x.total);
  $("lt-tax").textContent = formatWon(x.tax);
  $("lt-local").textContent = formatWon(x.local);
  $("lt-eff").textContent = `${(x.effective * 100).toFixed(2)}%`;
  $("lt-note").textContent = x.taxable ? "" : "200만원 이하라 세금이 없습니다(소득세법 제84조).";
}

function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

amount.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  amount.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
document.querySelectorAll<HTMLButtonElement>("[data-lt]").forEach((b) =>
  b.addEventListener("click", () => {
    amount.value = formatAmountInput(Number(b.dataset.lt));
    onUserInput();
  }),
);
render();
