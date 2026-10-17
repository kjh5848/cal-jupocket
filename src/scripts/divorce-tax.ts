/**
 * 재산분할 취득세 계산기 — /guide/divorce-acquisition-tax/.
 * 계산은 src/lib/divorce-tax.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/divorce-2026.json";
import { divisionAcqPage } from "../lib/divorce-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("divorce-acquisition");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const base = $<HTMLInputElement>("dv-base");
const small = $<HTMLInputElement>("dv-small");
const basePct = `${Number((r.acquisition.baseRate * 100).toFixed(1))}%`;

function render() {
  const b = parseAmount(base.value);
  const x = divisionAcqPage(b, small.checked);
  $("dv-hero").textContent = formatWon(x.total);
  $("dv-acq").textContent = formatWon(x.acq);
  $("dv-edu").textContent = formatWon(x.edu);
  $("dv-plain").textContent = formatWon(x.plainTotal);
  $("dv-saved").textContent = formatWon(x.saved);
  $("dv-rural").textContent = x.rural === null ? "—" : formatWon(x.rural);
  const rural = x.rural === null
    ? " 85㎡를 넘거나 주택이 아니면 농어촌특별세는 확인하지 못해 빼고 비교했습니다."
    : " 85㎡ 이하 주택이라 농어촌특별세는 없습니다.";
  $("dv-note").textContent = b
    ? `특례 없는 무상취득(${basePct})이면 ${formatWon(x.plainTotal)}, ${formatWon(x.saved)} 차이입니다.${rural}`
    : "과세표준을 넣으세요.";
}

base.addEventListener("input", () => {
  const n = parseAmount(base.value);
  base.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
small.addEventListener("change", render);
render();
