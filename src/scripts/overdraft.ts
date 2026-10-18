/**
 * 마이너스통장 이자 계산기 — /guide/minus-account-calculator/.
 * 계산은 src/lib/overdraft.ts overdraftInterest() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { overdraftInterest, parseDate, type PayDay } from "../lib/overdraft";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("overdraft");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("od-amount");
const rate = $<HTMLInputElement>("od-rate");
const days = $<HTMLInputElement>("od-days");
const start = $<HTMLInputElement>("od-start");
const payday = $<HTMLSelectElement>("od-payday");
const dot = (s: string) => s.replace(/-/g, ".");

function row(cells: string[]) {
  const tr = document.createElement("tr");
  cells.forEach((t, i) => {
    const el = document.createElement(i === 0 ? "th" : "td");
    if (i === 0) (el as HTMLTableCellElement).scope = "row";
    el.textContent = t;
    tr.append(el);
  });
  return tr;
}

function render() {
  if (Number.isNaN(parseDate(start.value))) return;
  const P = parseAmount(amount.value);
  const pct = Math.min(30, Math.max(0, Number(rate.value) || 0));
  const n = Math.min(3660, Math.max(1, Math.floor(Number(days.value) || 1)));
  const pd: PayDay = payday.value === "last" ? "last" : Number(payday.value);
  const x = overdraftInterest({ amount: P, ratePct: pct, days: n, start: start.value, payDay: pd });

  $("od-hero").textContent = formatWon(x.totalInterest);
  $("od-note").textContent = `${dot(start.value)}부터 ${n}일 · 결제 ${x.rows.length}회 · 마지막 날 ${dot(x.lastDay)}`;
  $("od-daily").textContent = formatWon(x.dailyInterest);
  $("od-avg").textContent = formatWon(x.dailyAverage);
  $("od-count").textContent = `${x.rows.length}회`;
  $("od-p").textContent = formatWon(P);
  $("od-int2").textContent = formatWon(x.totalInterest);
  $("od-table-note").textContent = `(전체 ${x.rows.length}회)`;
  $("od-rows").replaceChildren(
    ...x.rows.map((v) => row([String(v.no), dot(v.billDate), `${v.days}일${v.leapDays ? ` (윤년 ${v.leapDays}일)` : ""}`, formatWon(v.interest), formatWon(v.cumulative)])),
  );
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

amount.addEventListener("input", () => {
  const v = parseAmount(amount.value);
  amount.value = v ? formatAmountInput(v) : amount.value.trim() === "" ? "" : "0";
  onUserInput();
});
for (const el of [rate, days, start]) el.addEventListener("input", onUserInput);
payday.addEventListener("change", onUserInput);
render();
