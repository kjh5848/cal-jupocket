/**
 * 근로장려금 계산기 — /guide/earned-incentive-amount/.
 * 계산은 src/lib/earned-incentive.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { earnedIncentive, type EarnedHousehold } from "../lib/earned-incentive";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import { eokwon } from "../lib/won";
import rates from "../rates/earned-incentive-2026.json";

const reportUse = trackCalculatorUse("earned-incentive");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const pay = $<HTMLInputElement>("ei-pay");
const assets = $<HTMLInputElement>("ei-assets");
const household = $<HTMLSelectElement>("ei-household");
const late = $<HTMLInputElement>("ei-late");
const note = $<HTMLParagraphElement>("ei-note");

function render() {
  const h = household.value as EarnedHousehold;
  const r = earnedIncentive({ household: h, pay: parseAmount(pay.value), assets: parseAmount(assets.value), late: late.checked });
  $("ei-hero").textContent = formatWon(r.amount);
  const msg = !r.eligible
    ? `신청 자격 밖입니다 — 이 가구는 총소득 ${eokwon(rates.eligibility.totalIncomeUnder[h])} 미만, 재산 ${eokwon(rates.eligibility.assetsUnder)} 미만이어야 합니다.`
    : r.amount > r.base
      ? `계산한 금액이 작아 최소 금액 규정으로 ${formatWon(r.amount)}이 됩니다.`
      : "";
  note.textContent = msg;
  note.hidden = !msg;
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

for (const el of [pay, assets]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
household.addEventListener("change", onUserInput);
late.addEventListener("change", onUserInput);
render();
