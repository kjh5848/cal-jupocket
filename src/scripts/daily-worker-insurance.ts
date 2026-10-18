/**
 * 일용직 4대보험 계산기 — /guide/daily-worker-insurance-calculator/.
 * 계산은 src/lib/daily-worker-insurance.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { dailyWorkerInsurance, type Site, type Age } from "../lib/daily-worker-insurance";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("daily-worker-insurance");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const wage = $<HTMLInputElement>("dw-wage");
const days = $<HTMLInputElement>("dw-days");
const hours = $<HTMLInputElement>("dw-hours");
const tenure = $<HTMLSelectElement>("dw-tenure");
const site = $<HTMLSelectElement>("dw-site");
const age = $<HTMLSelectElement>("dw-age");
const pay = $<HTMLSelectElement>("dw-pay");
const size = $<HTMLSelectElement>("dw-size");

function render() {
  const x = dailyWorkerInsurance({
    dayWage: parseAmount(wage.value),
    days: Number(days.value) || 0,
    hours: Number(hours.value) || 0,
    monthOrMore: tenure.value === "long",
    site: site.value as Site,
    age: age.value as Age,
    lump: pay.value === "lump",
    stabilityTier: Number(size.value) as 0 | 1 | 2 | 3,
  });
  const e = x.eligibility;
  $("dw-hero").textContent = formatWon(x.takeHome);
  $("dw-note").textContent = `세전 ${formatWon(x.pay)} − 공제 ${formatWon(x.deduction)}`;
  $("dw-st-pension").textContent = e.pension === "covered" ? "대상" : e.pension === "conditional" ? "조건부" : "제외";
  $("dw-st-health").textContent = e.health ? "직장가입" : "제외";
  $("dw-st-emp").textContent = e.unemploymentFree ? "적용(실업급여분 없음)" : "적용";
  $("dw-pension").textContent = formatWon(x.pension);
  $("dw-health").textContent = formatWon(x.health);
  $("dw-care").textContent = formatWon(x.care);
  $("dw-emp").textContent = formatWon(x.employment);
  $("dw-tax").textContent = formatWon(x.tax.total);
  $("dw-ded").textContent = formatWon(x.deduction);
  $("dw-take").textContent = formatWon(x.takeHome);
  $("dw-employer").textContent = formatWon(x.employer.total);
  const notes: string[] = [];
  if (e.pension === "conditional")
    notes.push(`국민연금: 일수·시간 기준에는 안 걸립니다. 한 달 소득이 보건복지부 고시 금액 이상이면 대상이고, 그때 근로자 몫은 ${formatWon(x.pensionIfCovered)}입니다(고시 금액은 확인하지 못함).`);
  if (age.value !== "under60") notes.push("국민연금은 18세 이상 60세 미만만 가입합니다(국민연금법 제8조).");
  if (tenure.value === "short") notes.push("1개월 미만이면 국민연금·건강보험 직장가입에서 빠지고 고용보험만 뗍니다.");
  if (pay.value === "daily" && x.tax.perDay.raw > 0 && x.tax.perDay.tax === 0) notes.push(`하루 소득세가 ${formatWon(x.tax.perDay.raw)}로 1천원 미만이라 떼지 않습니다.`);
  const warn = $("dw-warn");
  warn.hidden = notes.length === 0;
  warn.textContent = notes.join(" ");
}

function onUserInput() {
  render();
  reportUse(parseAmount(wage.value));
}

wage.addEventListener("input", () => {
  const n = parseAmount(wage.value);
  wage.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
for (const el of [days, hours, tenure, site, age, pay, size]) el.addEventListener("input", onUserInput);
render();
