/**
 * 가족간 차용증 이자율 계산기 — /guide/family-loan-interest/.
 * 계산은 src/lib/family-loan.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/family-loan-2026.json";
import { loanGiftTax, noGiftPrincipal, giftTaxStartYear, minNoGiftRate, interestWithholding } from "../lib/family-loan";
import type { Relation } from "../lib/gift";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { eokwon } from "../lib/won";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("family-loan");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("fl-amount");
const rate = $<HTMLInputElement>("fl-rate");
const rel = $<HTMLSelectElement>("fl-rel");
const L = r.loanGift;
const pct = (v: number) => `${Number((v * 100).toFixed(2))}%`;
const eok = (n: number) => eokwon(Math.floor(n / 10_000) * 10_000);

function render() {
  const p = parseAmount(amount.value);
  const x = Math.max(0, Number(rate.value) || 0) / 100;
  const relation = rel.value as Relation;
  const g = loanGiftTax(p, x, relation);
  const max = noGiftPrincipal(x);
  const start = giftTaxStartYear(p, x, relation);
  const m = minNoGiftRate(p);
  const w = interestWithholding(g.interest);
  $("fl-hero").textContent = formatWon(g.gain);
  $("fl-gain").textContent = formatWon(g.gain);
  $("fl-int").textContent = formatWon(g.interest);
  $("fl-tax").textContent = g.taxable ? formatWon(g.tax?.payable ?? 0) : "대상 아님";
  $("fl-minrate").textContent = !p ? "—" : m.rate ? `연 ${pct(m.rate)} 이상` : "무이자도 해당 없음";
  $("fl-max").textContent = Number.isFinite(max) ? `약 ${eok(max)}` : "제한 없음";
  $("fl-start").textContent = !g.taxable ? "없음" : Number.isFinite(start) ? `${start}년째` : "10년 안 없음";
  $("fl-wtax").textContent = formatWon(w.tax);
  $("fl-wlocal").textContent = formatWon(w.localTax);
  $("fl-wnet").textContent = formatWon(w.net);
  // 소계 줄(틀이 만든 .ux-sub) — 이자율이 4.6% 이상이면 실제 이자가 적정 이자보다 많아 합이 적정 이자가 아니다
  const sub = $("fl-int").closest(".stat-chip")?.previousElementSibling;
  if (sub?.classList.contains("ux-sub")) sub.firstElementChild!.textContent = g.interest > g.fair ? "실제 이자 (적정 이자보다 많음)" : `적정 이자 (${pct(L.rate)})`;
  $("fl-note").textContent = !p
    ? "빌린 금액을 넣으세요."
    : g.taxable
      ? `1천만원 이상이라 증여재산가액이 됩니다. 첫해 증여세 ${formatWon(g.tax?.payable ?? 0)}` +
        (Number.isFinite(start) ? `, 이익이 10년 합산돼 ${start}년째부터 증여세가 생깁니다.` : `, 같은 조건이면 10년 안에 공제를 넘지 않습니다.`)
      : `1년 이익이 ${formatWon(L.threshold)} 미만이라 증여재산가액에서 빠집니다.`;
  $("fl-formula").textContent = !p
    ? ""
    : `${formatWon(p)} × ${pct(L.rate)} = ${formatWon(g.fair)} − 실제 이자 ${formatWon(g.interest)} = ${formatWon(g.gain)}` +
      (g.taxable ? ` ≥ ${formatWon(L.threshold)} → 전액 증여재산가액` : ` < ${formatWon(L.threshold)} → 제외`) +
      (m.rate ? ` · 1년 이자 ${formatWon(m.minInterest)} 이상이면 제외` : "");
}

amount.addEventListener("input", () => {
  const n = parseAmount(amount.value);
  amount.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
for (const el of [rate, rel]) {
  el.addEventListener("input", () => { render(); reportUse(parseAmount(amount.value)); });
  el.addEventListener("change", render);
}
render();
