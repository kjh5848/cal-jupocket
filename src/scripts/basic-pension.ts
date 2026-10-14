/**
 * 기초연금 모의계산 — /guide/basic-pension-calculator/.
 * 계산은 src/lib/basic-pension.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { propertyIncome, workIncome, basicPension, type Region } from "../lib/basic-pension";
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
  const prop = propertyIncome({ general: parseAmount(general.value), financial: parseAmount(fin.value), debt: parseAmount(debt.value), region: region.value as Region });
  // 근로소득 공제는 부부 각자(고시 제6조 제2항)
  const rec = workIncome(parseAmount(work.value)) + (couple ? workIncome(parseAmount(work2.value)) : 0) + parseAmount(other.value) + prop;
  const x = basicPension({ recognized: rec, couple });
  $("bp-hero").textContent = x.eligible ? formatWon(x.total) : "대상 아님";
  $("bp-rec").textContent = formatWon(rec);
  $("bp-prop").textContent = formatWon(prop);
  $("bp-limit").textContent = formatWon(x.limit);
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
