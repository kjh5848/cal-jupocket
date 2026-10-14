/**
 * 연차 계산기 — /guide/annual-leave-calculator/.
 * 계산은 src/lib/labor.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { leaveSchedule, annualLeavePay, hourlyFromMonthly40 } from "../lib/labor";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("annual-leave");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLInputElement>("al-start");
const asOf = $<HTMLInputElement>("al-asof");
const pay = $<HTMLInputElement>("al-pay");
const unused = $<HTMLInputElement>("al-unused");

/** "YYYY-MM-DD" → 현지 날짜(시간대 때문에 하루 밀리지 않게) */
const parse = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

function render() {
  const s = parse(start.value);
  const a = parse(asOf.value);
  const daily = hourlyFromMonthly40(parseAmount(pay.value)) * 8;
  $("al-daily").textContent = formatWon(daily);
  $("al-paid").textContent = formatWon(annualLeavePay(daily, Number(unused.value) || 0));
  if (!s || !a || a < s) {
    $("al-hero").textContent = "—";
    $("al-note").textContent = "기준일이 입사일보다 뒤여야 합니다.";
    return;
  }
  const x = leaveSchedule(s, a);
  $("al-tenure").textContent = `${x.years}년 ${x.months % 12}개월`;
  $("al-first").textContent = `${x.firstYear}일`;
  if (x.years < 1) {
    $("al-hero").textContent = `${x.firstYear}일`;
    $("al-note").textContent = "입사 첫해 — 개근한 달마다 1일씩 생깁니다(최대 11일).";
  } else {
    $("al-hero").textContent = `${x.thisYear}일`;
    $("al-note").textContent = `근속 ${x.years}년을 채운 날 생긴 연차입니다. 다음 해까지 쓰지 못하면 소멸하거나 수당이 됩니다.`;
  }
}

function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

for (const el of [start, asOf, unused]) el.addEventListener("input", onUserInput);
pay.addEventListener("input", () => {
  const n = parseAmount(pay.value);
  pay.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
// 기준일 기본값은 오늘
const t = new Date();
asOf.value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
render();
