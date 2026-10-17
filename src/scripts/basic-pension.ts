/**
 * 기초연금 모의계산 — /guide/basic-pension-calculator/.
 * 계산은 src/lib/basic-pension.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { propertyIncome, propertySteps, workIncome, basicPension, type Region } from "../lib/basic-pension";
import { eokwon } from "../lib/won";
import rates from "../rates/basic-pension-2026.json";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("basic-pension");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const hh = $<HTMLSelectElement>("bp-hh");
const region = $<HTMLSelectElement>("bp-region");
const money = ["bp-work", "bp-work2", "bp-other", "bp-general", "bp-fin", "bp-debt"].map((id) => $<HTMLInputElement>(id));
const [work, work2, other, general, fin, debt] = money;

function render() {
  const couple = hh.value === "couple";
  const pin = { general: parseAmount(general.value), financial: parseAmount(fin.value), debt: parseAmount(debt.value), region: region.value as Region };
  const prop = propertyIncome(pin);
  const st = propertySteps(pin);
  // 근로소득 공제는 부부 각자(고시 제6조 제2항)
  const workEval = workIncome(parseAmount(work.value)) + (couple ? workIncome(parseAmount(work2.value)) : 0);
  const otherEval = parseAmount(other.value);
  const rec = workEval + otherEval + prop;
  const x = basicPension({ recognized: rec, couple });
  $("bp-hero").textContent = x.eligible ? formatWon(x.total) : "대상 아님";
  $("bp-limit").textContent = formatWon(x.limit);
  $("bp-room-label").textContent = x.room >= 0 ? "선정기준액까지 남은 금액" : "선정기준액을 넘은 금액";
  $("bp-room").textContent = formatWon(Math.abs(x.room));
  $("bp-base-label").textContent = couple ? "기준연금액(2명)" : "기준연금액(1명)";
  $("bp-base").textContent = formatWon(x.baseTotal);
  $("bp-work-eval").textContent = formatWon(workEval);
  $("bp-other-eval").textContent = formatWon(otherEval);
  $("bp-prop").textContent = formatWon(prop);
  $("bp-couple-cut").textContent = formatWon(x.coupleCut);
  $("bp-rev-cut").textContent = formatWon(x.reversalCut);
  $("bp-formula").textContent = `재산 환산액 = (일반재산 − 기본재산액 ${eokwon(st.basic)}) ${formatWon(st.general)} + (금융재산 − ${eokwon(rates.property.financialDeduction)}) ${formatWon(st.financial)} − 부채 ${formatWon(st.debtUsed)} = ${formatWon(st.net)} × 4% ÷ 12. 소득인정액이 선정기준액 이하면 대상이고, 기초연금을 더해 선정기준액을 넘으면 넘는 만큼 줄입니다(기초연금법 제8조 제2항, 최소 기준연금액의 10%·부부 20%).`;
  $("bp-note").textContent = !x.eligible
    ? "소득인정액이 선정기준액을 넘습니다."
    : couple
      ? `부부 합계입니다(각자 ${formatWon(x.each)}).${x.reduced ? " 선정기준액에 가까워 감액했습니다." : ""}`
      : x.reduced
        ? "선정기준액에 가까워 차액만큼 감액했습니다."
        : "";
}

function onUserInput() {
  render();
  reportUse(parseAmount(general.value));
}

for (const el of money)
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
hh.addEventListener("input", onUserInput);
region.addEventListener("input", onUserInput);
render();
