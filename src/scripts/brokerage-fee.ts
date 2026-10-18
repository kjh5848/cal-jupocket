/**
 * 중개보수 계산기 — /guide/brokerage-fee-calculator/.
 * 계산은 src/lib/brokerage-fee.ts brokerageFee() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { brokerageFee, type BrokerProperty, type BrokerDeal } from "../lib/brokerage-fee";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("brokerage-fee");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const prop = $<HTMLSelectElement>("bf-prop");
const deal = $<HTMLSelectElement>("bf-deal");
const amount = $<HTMLInputElement>("bf-amount");
const deposit = $<HTMLInputElement>("bf-deposit");
const rent = $<HTMLInputElement>("bf-rent");
const agreed = $<HTMLInputElement>("bf-agreed");

const pct = (n: number) => `${Number(n.toFixed(3))}%`;

function render() {
  const d = deal.value as BrokerDeal;
  const monthly = d === "monthly";
  $("bf-amount-wrap").hidden = monthly;
  $("bf-deposit-wrap").hidden = !monthly;
  $("bf-rent-wrap").hidden = !monthly;
  $("bf-amount-label").textContent = d === "jeonse" ? "전세 보증금" : "거래금액";

  const a = agreed.value.trim() === "" ? undefined : Number(agreed.value);
  const x = brokerageFee({
    property: prop.value as BrokerProperty,
    deal: d,
    amount: parseAmount(amount.value),
    deposit: parseAmount(deposit.value),
    monthlyRent: parseAmount(rent.value),
    agreedPct: a,
  });
  $("bf-hero").textContent = formatWon(x.feeWithVat);
  $("bf-note").textContent = `${x.agreedClamped || a === undefined ? "상한요율" : "협의 요율"} ${pct(x.appliedPct)} · 부가세 빼면 ${formatWon(x.fee)}`;
  $("bf-base").textContent = formatWon(x.base);
  $("bf-cap").textContent = pct(x.capPermille / 10);
  $("bf-limit").textContent = x.capAmount === null ? "없음" : formatWon(x.capAmount);
  $("bf-max").textContent = formatWon(x.maxFee);
  $("bf-fee").textContent = formatWon(x.fee);
  $("bf-vat").textContent = formatWon(x.vat);
  $("bf-both").textContent = formatWon(x.bothSides);

  const notes: string[] = [];
  if (monthly) notes.push(`월세 거래금액 = 보증금 + 월세 × ${x.multiplier}${x.multiplier === 70 ? "(× 100 합이 5천만원 미만이라 70배)" : ""}(시행규칙 제20조 ⑤ 1호).`);
  if (x.hitCap) notes.push(`요율로 계산하면 한도액 ${formatWon(x.capAmount!)}을 넘어 한도액까지만 받습니다.`);
  if (x.agreedClamped) notes.push(`협의 요율이 상한 ${pct(x.capPermille / 10)}보다 높아 상한으로 계산했습니다.`);
  const extra = $("bf-extra");
  extra.hidden = notes.length === 0;
  extra.textContent = notes.join(" ");
}

function onUserInput() {
  render();
  reportUse(deal.value === "monthly" ? parseAmount(deposit.value) : parseAmount(amount.value));
}

for (const el of [amount, deposit, rent]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
for (const el of [prop, deal, agreed]) el.addEventListener("input", onUserInput);
render();
