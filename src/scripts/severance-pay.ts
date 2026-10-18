/**
 * 퇴직금 계산기 — /guide/severance-pay-calculator/.
 * 계산은 src/lib/severance-pay.ts severancePayByDays() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { severancePayByDays, parseDate } from "../lib/severance-pay";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("severance-pay");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLInputElement>("sp-start");
const last = $<HTMLInputElement>("sp-last");
const money = ["sp-wages", "sp-bonus", "sp-leave", "sp-ordinary"].map((id) => $<HTMLInputElement>(id));
const [wages, bonus, leave, ordinary] = money;
const hours = $<HTMLSelectElement>("sp-hours");
const ymd = (x: Date) => `${x.getFullYear()}. ${x.getMonth() + 1}. ${x.getDate()}.`;

function render() {
  const s = parseDate(start.value);
  const l = parseDate(last.value);
  if (!s || !l || l < s) {
    $("sp-hero").textContent = "—";
    $("sp-status").textContent = "마지막 근무일이 입사일보다 같거나 늦어야 합니다.";
    return;
  }
  const x = severancePayByDays({
    start: s, lastWorkDay: l,
    wages3m: parseAmount(wages.value), annualBonus: parseAmount(bonus.value),
    leavePay: parseAmount(leave.value), dailyOrdinary: parseAmount(ordinary.value),
    over15h: hours.value === "1",
  });
  $("sp-hero").textContent = formatWon(x.amount);
  $("sp-status").textContent = x.eligible
    ? `법정 퇴직금 대상 — 계속근로 1년 이상 · 주 15시간 이상${x.usedOrdinary ? " · 통상임금으로 계산" : ""}`
    : `법정 퇴직금 대상 아님(${x.oneYear ? "주 15시간 미만" : "계속근로 1년 미만"}) — 금액은 참고용`;
  $("sp-days").textContent = `${x.serviceDays.toLocaleString()}일`;
  $("sp-retire").textContent = ymd(x.retireDate);
  $("sp-period").textContent = `${ymd(x.period.from)} ~ ${ymd(x.period.to)} (${x.period.days}일)`;
  $("sp-w").textContent = formatWon(parseAmount(wages.value));
  $("sp-badd").textContent = formatWon(Math.floor(x.bonusAdd));
  $("sp-ladd").textContent = formatWon(Math.floor(x.leaveAdd));
  $("sp-avg").textContent = formatWon(Math.floor(x.average));
  $("sp-applied").textContent = formatWon(Math.floor(x.applied));
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(wages.value));
}

for (const el of money) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : el.value.trim() === "" ? "" : "0";
    onUserInput();
  });
}
for (const el of [start, last, hours]) el.addEventListener("input", onUserInput);
hours.addEventListener("change", onUserInput);
render();
