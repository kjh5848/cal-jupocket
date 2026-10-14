/**
 * 코인 세금 계산기 — /guide/crypto-tax-calculator/.
 * 계산은 src/lib/crypto-tax.ts cryptoTax() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { cryptoTax } from "../lib/crypto-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("crypto-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fields = ["ct-proceeds", "ct-cost", "ct-fv", "ct-fees"].map((id) => $<HTMLInputElement>(id));
const [proceeds, cost, fv, fees] = fields;

function render() {
  const x = cryptoTax({ proceeds: parseAmount(proceeds.value), cost: parseAmount(cost.value), fairValue2026: parseAmount(fv.value), fees: parseAmount(fees.value) });
  $("ct-hero").textContent = formatWon(x.total);
  $("ct-income").textContent = formatWon(x.income);
  $("ct-tax").textContent = formatWon(x.tax);
  $("ct-local").textContent = formatWon(x.local);
}

for (const el of fields)
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    render();
    reportUse(parseAmount(proceeds.value));
  });
render();
