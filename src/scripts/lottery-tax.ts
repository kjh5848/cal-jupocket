/**
 * 로또 세금 계산기 — /guide/lotto-tax-calculator/.
 * 계산은 src/lib/lottery-tax.ts lottoPage() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { lottoPage } from "../lib/lottery-tax";
import r from "../rates/lottery-2026.json";
import { eokwon } from "../lib/won";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("lotto-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("lt-amount");
const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;

function render() {
  const x = lottoPage(parseAmount(amount.value));
  const set = (id: string, v: number) => ($(id).textContent = formatWon(v));
  set("lt-hero", x.net);
  set("lt-total", x.total);
  $("lt-eff").textContent = `${x.effectiveRate}%`;
  set("lt-overamt", x.overAmount);
  set("lt-extra", x.overExtra);
  set("lt-base", x.baseTax);
  set("lt-over", x.overTax);
  set("lt-local", x.local);
  const low = pct(r.rate.base * (1 + r.local.ratio));
  const high = pct(r.rate.overRate * (1 + r.local.ratio));
  $("lt-note").textContent = !x.taxable
    ? `${eokwon(r.minimum.upTo)} 이하라 세금이 없습니다(소득세법 제84조 제2호).`
    : x.overAmount
      ? `${eokwon(r.rate.over)}까지 ${low}, 넘는 ${formatWon(x.overAmount)}에 ${high}를 뗐습니다.`
      : `${eokwon(r.rate.over)} 이하라 전체에 ${low}(소득세 ${pct(r.rate.base)} + 지방소득세)를 뗐습니다.`;
}

amount.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  amount.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(parseAmount(amount.value));
});
render();
