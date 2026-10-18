/**
 * 예금 이자 계산기 — /guide/deposit-interest-calculator/.
 * 계산은 src/lib/deposit.ts depositInterest() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { depositInterest, type DepositMethod, type DepositTax } from "../lib/deposit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("deposit");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const principal = $<HTMLInputElement>("dp-principal");
const rate = $<HTMLInputElement>("dp-rate");
const months = $<HTMLInputElement>("dp-months");
const method = $<HTMLSelectElement>("dp-method");
const tax = $<HTMLSelectElement>("dp-tax");

function render() {
  const P = parseAmount(principal.value);
  const pct = Math.min(30, Math.max(0, Number(rate.value) || 0));
  const n = Math.min(600, Math.max(1, Math.floor(Number(months.value) || 1)));
  const x = depositInterest({ principal: P, ratePct: pct, months: n, method: method.value as DepositMethod, tax: tax.value as DepositTax });

  $("dp-hero").textContent = formatWon(x.maturity);
  $("dp-note").textContent = `세후 이자 ${formatWon(x.netInterest)} · 세후 연 ${(x.netAnnualRate * 100).toFixed(2)}%`;
  $("dp-gross").textContent = formatWon(x.grossInterest);
  $("dp-itax").textContent = `−${formatWon(x.incomeTax)}`;
  $("dp-ltax").textContent = `−${formatWon(x.localTax)}`;
  $("dp-net").textContent = formatWon(x.netInterest);
  $("dp-p").textContent = formatWon(x.principal);
  $("dp-net2").textContent = formatWon(x.netInterest);
  const diff = x.monthlyInterest - x.simpleInterest;
  $("dp-compare").textContent =
    method.value === "monthly"
      ? `같은 조건 단리면 세전 이자 ${formatWon(x.simpleInterest)}(월복리가 ${formatWon(diff)} 많음)`
      : `같은 조건 월복리면 세전 이자 ${formatWon(x.monthlyInterest)}(단리보다 ${formatWon(diff)} 많음)`;
  $("dp-threshold").hidden = !x.overThreshold;
  $("dp-rows").replaceChildren(
    ...x.rows.map((v) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = String(v.month);
      const td = document.createElement("td");
      td.textContent = formatWon(v.interest);
      tr.append(th, td);
      return tr;
    }),
  );
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(principal.value));
}

principal.addEventListener("input", () => {
  const v = parseAmount(principal.value);
  principal.value = v ? formatAmountInput(v) : principal.value.trim() === "" ? "" : "0";
  onUserInput();
});
for (const el of [rate, months]) el.addEventListener("input", onUserInput);
for (const el of [method, tax]) el.addEventListener("change", onUserInput);
render();
