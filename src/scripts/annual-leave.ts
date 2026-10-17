/**
 * 연차 계산기 — /guide/annual-leave-calculator/.
 * 계산은 src/lib/labor.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { leaveSchedule, nextLeave, annualLeavePay, hourlyFromMonthly40 } from "../lib/labor";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("annual-leave");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const start = $<HTMLInputElement>("al-start");
const asOf = $<HTMLInputElement>("al-asof");
const pay = $<HTMLInputElement>("al-pay");
const unused = $<HTMLInputElement>("al-unused");
const size = $<HTMLSelectElement>("al-size");

/** "YYYY-MM-DD" → 현지 날짜(시간대 때문에 하루 밀리지 않게) */
const parse = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const set = (id: string, v: string) => ($(id).textContent = v);

function render() {
  const s = parse(start.value);
  const a = parse(asOf.value);
  const daily = hourlyFromMonthly40(parseAmount(pay.value)) * 8;
  set("al-daily", formatWon(daily));
  if (!s || !a || a < s) {
    for (const id of ["al-hero", "al-tenure", "al-first", "al-next", "al-next-days"]) set(id, "—");
    set("al-paid", formatWon(annualLeavePay(daily, Number(unused.value) || 0)));
    set("al-note", "기준일이 입사일보다 뒤여야 합니다.");
    return;
  }
  const x = leaveSchedule(s, a);
  set("al-tenure", `${x.years}년 ${x.months % 12}개월`);
  if (size.value === "4") {
    // 상시 4명 이하 — 제60조 미적용(시행령 별표 1)
    for (const id of ["al-hero", "al-first", "al-next-days"]) set(id, "0일");
    set("al-next", "—");
    set("al-paid", formatWon(0));
    set("al-note", "상시 4명 이하 사업장에는 근로기준법 연차 조항(제60조)이 적용되지 않습니다. 회사 규칙에 연차가 있으면 그 규칙을 따릅니다.");
    return;
  }
  const n = nextLeave(s, a);
  set("al-first", `${x.firstYear}일`);
  set("al-next", `${ymd(n.date)} (${n.daysLeft}일 뒤)`);
  set("al-next-days", `${n.days}일`);
  set("al-paid", formatWon(annualLeavePay(daily, Number(unused.value) || 0)));
  if (x.years < 1) {
    set("al-hero", `${x.firstYear}일`);
    set("al-note", "입사 첫해 — 개근한 달마다 1일씩 생깁니다(최대 11일).");
  } else {
    set("al-hero", `${x.thisYear}일`);
    set("al-note", `근속 ${x.years}년을 채운 날 생긴 연차입니다. 다음 해까지 쓰지 못하면 소멸하거나 수당이 됩니다.`);
  }
}

function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

for (const el of [start, asOf, unused]) el.addEventListener("input", onUserInput);
size.addEventListener("change", onUserInput);
pay.addEventListener("input", () => {
  const n = parseAmount(pay.value);
  pay.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
// 기준일 기본값은 오늘
const t = new Date();
// '처음 값으로' 도 오늘로 돌아가게 defaultValue 까지
asOf.value = asOf.defaultValue = ymd(t);
render();
