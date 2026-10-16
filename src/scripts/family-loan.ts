/**
 * 가족간 차용증 이자율 계산기 — /guide/family-loan-interest/.
 * 계산은 src/lib/family-loan.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/family-loan-2026.json";
import { loanGiftTax, noGiftPrincipal, giftTaxStartYear } from "../lib/family-loan";
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
  const start = giftTaxStartYear(p, x);
  $("fl-hero").textContent = formatWon(g.gain);
  $("fl-fair").textContent = formatWon(g.fair);
  $("fl-int").textContent = formatWon(g.interest);
  $("fl-max").textContent = Number.isFinite(max) ? `약 ${eokwon(Math.floor(max / 10_000) * 10_000)}` : "제한 없음";
  $("fl-start").textContent = Number.isFinite(start) ? `${start}년째` : "10년 안 없음";
  $("fl-note").textContent = !p
    ? "빌린 금액을 넣으세요."
    : g.taxable
      ? `1천만원 이상이라 증여재산가액이 됩니다. 첫해 증여세 ${formatWon(g.tax?.payable ?? 0)}` +
        (Number.isFinite(start) ? `, 이익이 10년 합산돼 ${start}년째부터 증여세가 생깁니다.` : `, 같은 조건이면 10년 안에 공제를 넘지 않습니다.`)
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
