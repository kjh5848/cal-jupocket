/**
 * 적금 이자 계산기 — /guide/installment-savings-calculator/.
 * 계산은 src/lib/installment-savings.ts installmentSavings() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { installmentSavings, type SavingsMethod } from "../lib/installment-savings";
import type { DepositTax } from "../lib/deposit";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("installment-savings");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const monthly = $<HTMLInputElement>("is-monthly");
const rate = $<HTMLInputElement>("is-rate");
const months = $<HTMLInputElement>("is-months");
const method = $<HTMLSelectElement>("is-method");
const tax = $<HTMLSelectElement>("is-tax");
const p2 = (v: number) => `${(v * 100).toFixed(2)}%`;

function render() {
  const M = parseAmount(monthly.value);
  const pct = Math.min(30, Math.max(0, Number(rate.value) || 0));
  const n = Math.min(600, Math.max(1, Math.floor(Number(months.value) || 1)));
  const x = installmentSavings({ monthly: M, ratePct: pct, months: n, method: method.value as SavingsMethod, tax: tax.value as DepositTax });

  $("is-hero").textContent = formatWon(x.maturity);
  $("is-note").textContent = `세후 이자 ${formatWon(x.netInterest)} · 넣은 돈 대비 ${p2(x.netReturn)} · 예금으로 치면 세후 연 ${p2(x.depositEquivRate)}`;
  $("is-gross").textContent = formatWon(x.grossInterest);
  $("is-itax").textContent = `−${formatWon(x.incomeTax)}`;
  $("is-ltax").textContent = `−${formatWon(x.localTax)}`;
  $("is-net").textContent = formatWon(x.netInterest);
  $("is-p").textContent = formatWon(x.principal);
  $("is-net2").textContent = formatWon(x.netInterest);
  const diff = x.monthlyInterest - x.simpleInterest;
  $("is-compare").textContent =
    method.value === "monthly"
      ? `같은 조건 단리면 세전 이자 ${formatWon(x.simpleInterest)}(월복리가 ${formatWon(diff)} 많음)`
      : `같은 조건 월복리면 세전 이자 ${formatWon(x.monthlyInterest)}(단리보다 ${formatWon(diff)} 많음)`;
  $("is-threshold").hidden = !x.overThreshold;
  $("is-rows").replaceChildren(
    ...x.rows.map((v) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = `${v.round}회`;
      const left = document.createElement("td");
      left.textContent = `${v.monthsLeft}개월`;
      const td = document.createElement("td");
      td.textContent = formatWon(v.interest);
      tr.append(th, left, td);
      return tr;
    }),
  );
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(monthly.value));
}

monthly.addEventListener("input", () => {
  const v = parseAmount(monthly.value);
  monthly.value = v ? formatAmountInput(v) : monthly.value.trim() === "" ? "" : "0";
  onUserInput();
});
for (const el of [rate, months]) el.addEventListener("input", onUserInput);
for (const el of [method, tax]) el.addEventListener("change", onUserInput);
render();
