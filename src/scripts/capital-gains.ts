/**
 * 양도세 계산기 — /guide/capital-gains-calculator/.
 * 계산은 src/lib/capital-gains.ts capitalGains() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { capitalGains, type AssetKind } from "../lib/capital-gains";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("capital-gains");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const money = ["cg-sale", "cg-acq", "cg-exp"].map((id) => $<HTMLInputElement>(id));
const [sale, acq, exp] = money;
const kind = $<HTMLSelectElement>("cg-kind");
const hold = $<HTMLInputElement>("cg-hold");
const reside = $<HTMLInputElement>("cg-reside");
const one = $<HTMLInputElement>("cg-one");
const sur = $<HTMLSelectElement>("cg-sur");
const nbl = $<HTMLInputElement>("cg-nbl");

function render() {
  const x = capitalGains({
    kind: kind.value as AssetKind,
    sale: parseAmount(sale.value),
    acquisition: parseAmount(acq.value),
    expenses: parseAmount(exp.value),
    holdYears: Number(hold.value) || 0,
    residenceYears: Number(reside.value) || 0,
    oneHouseExempt: one.checked && kind.value === "house",
    surcharge: Number(sur.value) as 0 | 0.2 | 0.3,
    nonBusinessLand: nbl.checked && kind.value === "land",
  });
  $("cg-hero").textContent = formatWon(x.total);
  $("cg-gain").textContent = formatWon(x.taxableGain);
  $("cg-lt").textContent = formatWon(x.ltDeduction);
  $("cg-base").textContent = formatWon(x.base);
  $("cg-tax").textContent = formatWon(x.tax);
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(sale.value));
}

for (const el of money) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
for (const el of [hold, reside]) el.addEventListener("input", onUserInput);
for (const el of [kind, one, sur, nbl]) el.addEventListener("change", onUserInput);
render();
