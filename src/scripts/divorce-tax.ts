/**
 * 재산분할 취득세 계산기 — /guide/divorce-acquisition-tax/.
 * 계산은 src/lib/divorce-tax.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/divorce-2026.json";
import { divisionAcqTax, plainGiftAcqTax } from "../lib/divorce-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("divorce-acquisition");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const base = $<HTMLInputElement>("dv-base");

function render() {
  const b = parseAmount(base.value);
  const x = divisionAcqTax(b);
  const p = plainGiftAcqTax(b);
  $("dv-hero").textContent = formatWon(x.total);
  $("dv-acq").textContent = formatWon(x.acq);
  $("dv-edu").textContent = formatWon(x.edu);
  $("dv-note").textContent = b
    ? `특례 없는 무상취득(${Number((r.acquisition.baseRate * 100).toFixed(1))}%)이면 ${formatWon(p.total)}, ${formatWon(p.total - x.total)} 차이입니다.`
    : "과세표준을 넣으세요.";
}

base.addEventListener("input", () => {
  const n = parseAmount(base.value);
  base.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
render();
