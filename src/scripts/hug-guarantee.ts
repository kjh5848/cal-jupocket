/**
 * HUG 전세보증 가능 여부 계산기 — /guide/hug-jeonse-guarantee-calculator/.
 * 계산은 src/lib/hug-jeonse.ts hugGuarantee() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { hugGuarantee, type HouseType, type PriceBasis } from "../lib/hug-jeonse";
import { formatWon, parseAmount } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import r from "../rates/hug-jeonse-2026.json";

const reportUse = trackCalculatorUse("hug-jeonse-guarantee");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const type = $<HTMLSelectElement>("hg-type");
const region = $<HTMLSelectElement>("hg-region");
const basis = $<HTMLSelectElement>("hg-basis");
const price = $<HTMLInputElement>("hg-price");
const deposit = $<HTMLInputElement>("hg-deposit");
const senior = $<HTMLInputElement>("hg-senior");
const others = $<HTMLInputElement>("hg-others");
const G = r.guarantee;

function render() {
  const multi = type.value === "multi";
  $("hg-others-wrap").hidden = !multi;
  const D = parseAmount(deposit.value);
  const x = hugGuarantee({
    type: type.value as HouseType,
    capital: region.value === "capital",
    deposit: D,
    senior: parseAmount(senior.value),
    otherDeposits: multi ? parseAmount(others.value) : 0,
    basis: basis.value as PriceBasis,
    price: parseAmount(price.value),
  });
  $("hg-hero").textContent = x.ok ? "가입 가능" : "어려움";
  $("hg-note").textContent = x.ok
    ? `보증한도 ${formatWon(x.guaranteeLimit)} · 보증금이 이 금액 안이어야 합니다`
    : x.maxDeposit > 0
      ? `이 집에서 보증되는 보증금은 최대 ${formatWon(x.maxDeposit)}입니다`
      : "선순위가 많아 보증이 어렵습니다";
  $("hg-house").textContent = formatWon(x.housePrice);
  $("hg-ltv").textContent = formatWon(x.ltvLine);
  $("hg-limit").textContent = formatWon(x.guaranteeLimit);
  $("hg-max").textContent = formatWon(x.maxDeposit);
  $("hg-senior-line").textContent = formatWon(x.seniorLine);
  $("hg-cap").textContent = formatWon(x.depositCap);

  const checks: [boolean, string][] = [
    [x.depositOk, `보증금 ${formatWon(D)} ${x.depositOk ? "≤" : ">"} 상한 ${formatWon(x.depositCap)}`],
    [x.ltvOk, `보증금 + 선순위 ${formatWon(D + x.seniorTotal)} ${x.ltvOk ? "≤" : ">"} ${G.ltvLimitPct}% 선 ${formatWon(x.ltvLine)}`],
    [x.seniorOk, `선순위 ${formatWon(x.seniorTotal)} ${x.seniorOk ? "≤" : ">"} 한도 ${formatWon(x.seniorLine)}(주택가격의 ${multi ? G.seniorLimitMultiFamilyPct : G.seniorLimitPct}%)`],
  ];
  const ul = $("hg-checks");
  ul.replaceChildren(
    ...checks.map(([ok, text]) => {
      const li = document.createElement("li");
      li.textContent = `${ok ? "✓" : "✗"} ${text}`;
      return li;
    }),
  );
}

function onUserInput() {
  render();
  reportUse(parseAmount(deposit.value));
}

for (const el of [type, region, basis, price, deposit, senior, others]) {
  el.addEventListener("input", onUserInput);
  el.addEventListener("change", onUserInput);
}
render();
