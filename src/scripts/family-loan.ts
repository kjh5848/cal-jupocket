/**
 * 가족간 차용증 이자율 계산기 — /guide/family-loan-interest/.
 * 계산은 src/lib/family-loan.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/family-loan-2026.json";
import { loanGiftTax, noGiftPrincipal } from "../lib/family-loan";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { eokwon } from "../lib/won";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("family-loan");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("fl-amount");
const rate = $<HTMLInputElement>("fl-rate");

function render() {
  const p = parseAmount(amount.value);
  const x = Math.max(0, Number(rate.value) || 0) / 100;
  const g = loanGiftTax(p, x);
  const max = noGiftPrincipal(x);
  $("fl-hero").textContent = formatWon(g.gain);
  $("fl-fair").textContent = formatWon(g.fair);
  $("fl-int").textContent = formatWon(g.interest);
  $("fl-max").textContent = Number.isFinite(max) ? `약 ${eokwon(Math.floor(max / 10_000) * 10_000)}` : "제한 없음";
  $("fl-note").textContent = !p
    ? "빌린 금액을 넣으세요."
    : g.taxable
      ? `1천만원 이상이라 증여재산가액이 됩니다. 성년 자녀 공제 안이면 증여세 ${formatWon(g.tax?.payable ?? 0)}.`
      : `1년 이익이 ${formatWon(r.loanGift.threshold)} 미만이라 증여재산가액에서 빠집니다.`;
}

amount.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  amount.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
rate.addEventListener("input", () => { render(); reportUse(parseAmount(amount.value)); });
render();
