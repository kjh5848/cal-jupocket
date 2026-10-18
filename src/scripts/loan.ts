/**
 * 대출 이자 계산기 — /guide/loan-calculator/.
 * 계산은 src/lib/loan.ts loanSchedule()·compareMethods() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { loanSchedule, compareMethods, type LoanMethod } from "../lib/loan";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("loan");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const principal = $<HTMLInputElement>("ln-principal");
const months = $<HTMLInputElement>("ln-months");
const rate = $<HTMLInputElement>("ln-rate");
const method = $<HTMLSelectElement>("ln-method");
const grace = $<HTMLInputElement>("ln-grace");
const NAME: Record<LoanMethod, string> = { level: "원리금균등", principal: "원금균등", bullet: "만기일시" };

function cell(tag: "th" | "td", text: string) {
  const el = document.createElement(tag);
  if (tag === "th") el.scope = "row";
  el.textContent = text;
  return el;
}
function fill(tbody: HTMLElement, rows: string[][]) {
  tbody.replaceChildren(
    ...rows.map((r) => {
      const tr = document.createElement("tr");
      r.forEach((t, i) => tr.append(cell(i === 0 ? "th" : "td", t)));
      return tr;
    }),
  );
}

function render() {
  const P = parseAmount(principal.value);
  const n = Math.min(600, Math.max(1, Math.floor(Number(months.value) || 1)));
  const pct = Math.min(30, Math.max(0, Number(rate.value) || 0));
  const g = Math.max(0, Math.floor(Number(grace.value) || 0));
  const m = method.value as LoanMethod;
  const x = loanSchedule({ principal: P, months: n, ratePct: pct, method: m, graceMonths: g });

  $("ln-hero-label").textContent = m === "bullet" ? "매달 내는 이자" : m === "principal" ? "첫 달 내는 돈(거치 뒤)" : "매달 내는 돈";
  $("ln-hero").textContent = formatWon(x.firstPayment);
  const gNote = m !== "bullet" && x.gracePayment > 0 ? ` · 처음 ${n - x.repayMonths}회는 이자 ${formatWon(x.gracePayment)}만` : "";
  $("ln-note").textContent =
    m === "level"
      ? `${NAME.level} — ${x.repayMonths}번 같은 금액, 마지막 회차 ${formatWon(x.lastPayment)}(남은 끝수 정산)${gNote}`
      : m === "principal"
        ? `${NAME.principal} — 매달 원금이 같고 이자가 줄어 마지막 회차 ${formatWon(x.lastPayment)}${gNote}`
        : `${NAME.bullet} — 마지막 회차에 원금까지 ${formatWon(x.lastPayment)}`;
  $("ln-int").textContent = formatWon(x.totalInterest);
  $("ln-int2").textContent = formatWon(x.totalInterest);
  $("ln-ratio").textContent = P > 0 ? `${((x.totalInterest / P) * 100).toFixed(2)}%` : "—";
  $("ln-grace-pay").textContent = x.gracePayment > 0 ? formatWon(x.gracePayment) : "—";
  $("ln-repay").textContent = `${x.repayMonths}회`;
  $("ln-last").textContent = formatWon(x.lastPayment);
  $("ln-p").textContent = formatWon(P);

  fill(
    $("ln-compare"),
    compareMethods({ principal: P, months: n, ratePct: pct, graceMonths: g }).map((c) => [NAME[c.method], formatWon(c.firstPayment), formatWon(c.lastPayment), formatWon(c.totalInterest)]),
  );
  const shown = x.rows.filter((v) => n <= 24 || v.no <= 12 || v.no % 12 === 0 || v.no === n);
  $("ln-table-note").textContent = n <= 24 ? `(전체 ${n}회)` : "(처음 12회 · 그 뒤 1년마다 · 마지막 회차)";
  fill($("ln-rows"), shown.map((v) => [String(v.no), formatWon(v.payment), formatWon(v.principal), formatWon(v.interest), formatWon(v.balance)]));
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
for (const el of [months, rate, grace]) el.addEventListener("input", onUserInput);
method.addEventListener("change", onUserInput);
render();
