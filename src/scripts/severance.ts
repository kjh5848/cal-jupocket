/**
 * 퇴직금 세금 계산기 — /guide/severance-tax-calculator/.
 * 계산은 src/lib/severance.ts severanceTax() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { severanceTax, pensionReceiptRatio } from "../lib/severance";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("severance-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("sv-amount");
const years = $<HTMLInputElement>("sv-years");

function render() {
  const x = severanceTax(parseAmount(amount.value), Number(years.value) || 0);
  $("sv-hero").textContent = formatWon(x.total);
  $("sv-tax").textContent = formatWon(x.tax);
  $("sv-local").textContent = formatWon(x.local);
  $("sv-base").textContent = formatWon(x.base);
  $("sv-net").textContent = formatWon(x.net);
  $("sv-eff").textContent = `${(x.effective * 100).toFixed(2)}%`;
  $("sv-pension").textContent = formatWon(Math.floor(x.total * pensionReceiptRatio(1)));
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

amount.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  amount.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
years.addEventListener("input", onUserInput);
render();
