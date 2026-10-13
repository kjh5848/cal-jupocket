/**
 * 연말정산 계산기 — /guide/year-end-calculator/.
 * 계산은 src/lib/year-end-calc.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { yearEnd, type BirthOrder } from "../lib/year-end-calc";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("year-end");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ids = ["ye-pay", "ye-pension", "ye-social", "ye-savings", "ye-irp", "ye-prepaid"] as const;
const inputs = Object.fromEntries(ids.map((id) => [id, $<HTMLInputElement>(id)])) as Record<(typeof ids)[number], HTMLInputElement>;
const persons = $<HTMLInputElement>("ye-persons");
const standard = $<HTMLInputElement>("ye-standard");
const children = $<HTMLInputElement>("ye-children");
const birth = $<HTMLSelectElement>("ye-birth");
const v = (id: (typeof ids)[number]) => parseAmount(inputs[id].value);

function render() {
  const r = yearEnd({
    pay: v("ye-pay"),
    persons: Math.max(1, Number(persons.value) || 1),
    pensionInsurance: v("ye-pension"),
    socialInsurance: v("ye-social"),
    pensionSavings: v("ye-savings"),
    irp: v("ye-irp"),
    standard: standard.checked,
    children: Math.max(0, Number(children.value) || 0),
    births: birth.value === "0" ? [] : [Number(birth.value) as BirthOrder],
    prepaid: v("ye-prepaid"),
  });
  $("ye-hero-label").textContent = r.diff <= 0 ? "돌려받는 소득세(어림)" : "더 내는 소득세(어림)";
  $("ye-hero").textContent = formatWon(Math.abs(r.diff));
  $("ye-base").textContent = formatWon(r.base);
  $("ye-computed").textContent = formatWon(r.computedTax);
  $("ye-decided").textContent = formatWon(r.decided);
  $("ye-child").textContent = formatWon(r.child);
  $("ye-child-warn").hidden = !r.childClamped;
  reportUse(v("ye-pay"));
}

for (const id of ids) {
  inputs[id].addEventListener("input", () => {
    const n = parseAmount(inputs[id].value);
    inputs[id].value = n ? formatAmountInput(n) : "";
    render();
  });
}
persons.addEventListener("input", render);
children.addEventListener("input", render);
birth.addEventListener("change", render);
standard.addEventListener("change", render);
render();
