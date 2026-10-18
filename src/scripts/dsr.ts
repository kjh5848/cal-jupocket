/**
 * DSR 계산기 — /guide/dsr-calculator/.
 * 계산은 src/lib/dsr.ts dsr() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { dsr, type DsrLoan } from "../lib/dsr";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("dsr");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const income = $<HTMLInputElement>("dsr-income");
const kind = $<HTMLSelectElement>("dsr-kind");
const method = $<HTMLSelectElement>("dsr-method");
const amount = $<HTMLInputElement>("dsr-amount");
const rate = $<HTMLInputElement>("dsr-rate");
const years = $<HTMLInputElement>("dsr-years");
const stress = $<HTMLInputElement>("dsr-stress");
const oKind = $<HTMLSelectElement>("dsr-o-kind");
const oAmount = $<HTMLInputElement>("dsr-o-amount");
const oRate = $<HTMLInputElement>("dsr-o-rate");
const oYears = $<HTMLInputElement>("dsr-o-years");

function render() {
  const others: DsrLoan[] = [];
  if (oKind.value !== "none") {
    const [k, m] = oKind.value.split("-") as [DsrLoan["kind"], DsrLoan["method"]];
    others.push({ kind: k, method: m, amount: parseAmount(oAmount.value), ratePct: Number(oRate.value) || 0, years: Number(oYears.value) || 0 });
  }
  const x = dsr({
    income: parseAmount(income.value),
    newLoan: {
      kind: kind.value === "credit" ? "credit" : "mortgage",
      method: (method.value as DsrLoan["method"]) || "level",
      amount: parseAmount(amount.value),
      ratePct: Number(rate.value) || 0,
      years: Number(years.value) || 0,
    },
    stressPct: Number(stress.value) || 0,
    others,
  });
  const ok = Number.isFinite(x.dsr);
  $("dsr-hero").textContent = ok ? `${x.dsr}%` : "—";
  const within = ok && x.dsr <= x.limitPct;
  $("dsr-note").textContent = ok
    ? `은행 ${x.limitPct}% ${within ? "이내" : "초과"} · 총대출 ${formatWon(x.totalLoan)}${x.regulated ? "으로 1억원 초과라 규제 대상" : "이라 1억원 이하(40% 규제 대상 아님)"}`
    : "연소득을 넣으면 DSR이 나옵니다";
  $("dsr-np").textContent = formatWon(x.newAnnual.principal);
  $("dsr-ni").textContent = formatWon(x.newAnnual.interest);
  $("dsr-new").textContent = formatWon(x.newAnnual.total);
  $("dsr-term").textContent = `${x.newAnnual.termYears}년`;
  $("dsr-other").textContent = formatWon(x.otherAnnual);
  $("dsr-total").textContent = formatWon(x.totalAnnual);
  $("dsr-max").textContent = formatWon(x.maxNewLoan);
  const cap = $("dsr-cap");
  const y = Number(years.value) || 0;
  const notes: string[] = [];
  if (x.appliedRatePct !== (Number(rate.value) || 0)) notes.push(`스트레스 금리를 더한 연 ${Math.round(x.appliedRatePct * 100) / 100}%로 DSR을 계산했습니다(실제 이자는 그대로).`);
  if (kind.value === "mortgage" && y > 40) notes.push("DSR 계산 만기는 40년까지라 40년으로 셌습니다(세칙 별표 18 제12-2호 사목).");
  cap.hidden = notes.length === 0;
  cap.textContent = notes.join(" ");
}

function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

for (const el of [income, amount, oAmount]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : el === oAmount ? "0" : "";
    onUserInput();
  });
}
for (const el of [kind, method, rate, years, stress, oKind, oRate, oYears]) el.addEventListener("input", onUserInput);
for (const el of [kind, method, oKind]) el.addEventListener("change", onUserInput);
render();
