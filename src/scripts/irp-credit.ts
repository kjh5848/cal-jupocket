/**
 * IRP 세액공제 계산기 — /guide/irp-tax-credit-calculator/.
 * 계산은 전부 src/lib/pension-credit.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { pensionCredit, cappedByTax, withLocalTax } from "../lib/pension-credit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("irp-credit");

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const savings = $<HTMLInputElement>("irp-savings");
const irp = $<HTMLInputElement>("irp-irp");
const isa = $<HTMLInputElement>("irp-isa");
const tax = $<HTMLInputElement>("irp-tax");
const rateLow = $<HTMLInputElement>("irp-rate-low");

const out = {
  hero: $("irp-hero"),
  eligible: $("irp-eligible"),
  incomeTax: $("irp-income-tax"),
  capNote: $("irp-cap-note"),
};

function render() {
  const c = pensionCredit(
    { savings: parseAmount(savings.value), irp: parseAmount(irp.value), isaTransfer: parseAmount(isa.value) },
    rateLow.checked,
  );
  out.eligible.textContent = formatWon(c.eligible);
  out.incomeTax.textContent = formatWon(c.incomeTax);

  const t = parseAmount(tax.value);
  if (t > 0 && c.incomeTax > t) {
    const k = cappedByTax(c.incomeTax, t);
    const usedWithLocal = withLocalTax(k.used);
    out.hero.textContent = formatWon(usedWithLocal);
    out.capNote.hidden = false;
    out.capNote.textContent =
      `산출세액이 ${formatWon(t)}이라 공제 ${formatWon(c.incomeTax)} 중 ${formatWon(k.used)}만 쓰입니다. ` +
      `나머지는 공제받지 않은 것으로 봅니다(소득세법 제61조).`;
  } else {
    out.hero.textContent = formatWon(c.withLocal);
    out.capNote.hidden = true;
  }
  reportUse();
}

for (const el of [savings, irp, isa, tax]) {
  el.addEventListener("input", () => {
    const v = parseAmount(el.value);
    el.value = v ? formatAmountInput(v) : "";
    render();
  });
}
for (const el of document.querySelectorAll<HTMLInputElement>('input[name="irp-rate"]')) {
  el.addEventListener("change", render);
}
render();
