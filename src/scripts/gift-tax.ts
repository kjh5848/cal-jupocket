/**
 * 증여세 계산기 — /guide/gift-tax-calculator/.
 * 계산은 src/lib/gift.ts computeGift() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { computeGift, type Relation } from "../lib/gift";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import r from "../rates/gift-2026.json";

const reportUse = trackCalculatorUse("gift-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("gt-amount");
const used = $<HTMLInputElement>("gt-used");
const relation = $<HTMLSelectElement>("gt-relation");
const minor = $<HTMLInputElement>("gt-minor");
const mb = $<HTMLInputElement>("gt-mb");

function render() {
  const rel = relation.value as Relation;
  const g = computeGift({
    amount: parseAmount(amount.value),
    relation: rel,
    minor: minor.checked,
    usedWithin10y: parseAmount(used.value),
    marriageBirth: mb.checked && rel === "ascendant" ? r.marriageBirthDeduction.amount : 0,
  });
  $("gt-hero").textContent = formatWon(g.payable);
  $("gt-ded").textContent = formatWon(g.deductions.total);
  $("gt-base").textContent = formatWon(g.base);
  $("gt-computed").textContent = formatWon(g.computed);
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

for (const el of [amount, used]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
for (const el of [relation, minor, mb]) el.addEventListener("change", onUserInput);
render();
