/**
 * 의료비 세액공제 계산기 — /guide/medical-credit-limit/.
 * 계산은 src/lib/special-credit.ts medicalCredit() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { medicalCredit } from "../lib/special-credit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("medical-credit");
const ids = ["mc-pay", "mc-general", "mc-special", "mc-premature", "mc-infertility"] as const;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const el = Object.fromEntries(ids.map((id) => [id, $<HTMLInputElement>(id)])) as Record<(typeof ids)[number], HTMLInputElement>;
const v = (id: (typeof ids)[number]) => parseAmount(el[id].value);

function render() {
  const r = medicalCredit({ pay: v("mc-pay"), general: v("mc-general"), special: v("mc-special"), premature: v("mc-premature"), infertility: v("mc-infertility") });
  $("mc-hero").textContent = formatWon(r.credit);
  $("mc-threshold").textContent = formatWon(r.threshold);
  $("mc-gbase").textContent = formatWon(r.gBase);
  $("mc-sbase").textContent = formatWon(r.sBase);
}

for (const id of ids) {
  el[id].addEventListener("input", () => {
    const n = parseAmount(el[id].value);
    el[id].value = n ? formatAmountInput(n) : "";
    render();
    reportUse(v("mc-pay")); // 사람이 값을 바꿨을 때만 센다
  });
}
render();
