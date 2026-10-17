/**
 * IRP 세액공제 계산기 — /guide/irp-tax-credit-calculator/.
 * 계산은 전부 src/lib/pension-credit.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { pensionCredit, cappedByTax, withLocalTax, roomToCap } from "../lib/pension-credit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("irp-credit");

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const savings = $<HTMLInputElement>("irp-savings");
const irp = $<HTMLInputElement>("irp-irp");
const isa = $<HTMLInputElement>("irp-isa");
const tax = $<HTMLInputElement>("irp-tax");
const rate = $<HTMLSelectElement>("irp-rate");

const out = {
  hero: $("irp-hero"),
  eligible: $("irp-eligible"),
  over: $("irp-over"),
  room: $("irp-room"),
  extra: $("irp-extra"),
  incomeTax: $("irp-income-tax"),
  local: $("irp-local"),
  capNote: $("irp-cap-note"),
};

function render() {
  const input = { savings: parseAmount(savings.value), irp: parseAmount(irp.value), isaTransfer: parseAmount(isa.value) };
  const low = rate.value === "low";
  const c = pensionCredit(input, low);
  const t = parseAmount(tax.value);
  const r = roomToCap(input, low, t);
  out.eligible.textContent = formatWon(c.eligible);
  out.over.textContent = formatWon(r.over);
  out.room.textContent = formatWon(r.room);
  out.extra.textContent = formatWon(r.extraWithLocal);

  // 산출세액 한도(제61조)에 걸리면 소득세·지방소득세 칩도 실제로 쓰이는 금액으로 — 소계와 큰 숫자가 맞게
  const used = t > 0 && c.incomeTax > t ? cappedByTax(c.incomeTax, t).used : c.incomeTax;
  const total = withLocalTax(used);
  out.hero.textContent = formatWon(total);
  out.incomeTax.textContent = formatWon(used);
  out.local.textContent = formatWon(total - used);
  out.capNote.hidden = used === c.incomeTax;
  if (!out.capNote.hidden) {
    out.capNote.textContent =
      `산출세액이 ${formatWon(t)}이라 공제 ${formatWon(c.incomeTax)} 중 ${formatWon(used)}만 쓰입니다. ` +
      `나머지는 공제받지 않은 것으로 봅니다(소득세법 제61조). 더 넣어도 이번 해 세금은 더 줄지 않습니다.`;
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
rate.addEventListener("change", render);
render();
