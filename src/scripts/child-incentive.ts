/**
 * 자녀장려금 계산기 — /guide/child-incentive-amount/.
 * 계산은 src/lib/child-incentive.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { childIncentive, type Household } from "../lib/child-incentive";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import { eokwon } from "../lib/won";
import rates from "../rates/child-incentive-2026.json";

const reportUse = trackCalculatorUse("child-incentive");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const money = ["ci-pay", "ci-assets", "ci-credit"].map((id) => $<HTMLInputElement>(id));
const [pay, assets, credit] = money;
const household = $<HTMLSelectElement>("ci-household");
const children = $<HTMLInputElement>("ci-children");
const late = $<HTMLInputElement>("ci-late");
const note = $<HTMLParagraphElement>("ci-note");

function render() {
  const r = childIncentive({
    household: household.value as Household,
    pay: parseAmount(pay.value),
    children: Math.max(0, Number(children.value) || 0),
    assets: parseAmount(assets.value),
    childTaxCredit: parseAmount(credit.value),
    late: late.checked,
  });
  $("ci-hero").textContent = formatWon(r.amount);
  const msg = !r.eligible
    ? `신청 자격 밖입니다 — 부양자녀가 있고, 총소득 ${eokwon(rates.eligibility.totalIncomeUnder)} 미만·재산 ${eokwon(rates.eligibility.assetsUnder)} 미만이어야 합니다.`
    : r.floored
      ? `깎이고 남은 금액이 ${eokwon(rates.reductions.floor.amount)} 미만이라 ${eokwon(rates.reductions.floor.amount)}으로 결정됩니다.`
      : r.minusCredit > 0
        ? `자녀세액공제 ${formatWon(r.minusCredit)}을 뺀 금액입니다.`
        : "";
  note.textContent = msg;
  note.hidden = !msg;
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(pay.value));
}

for (const el of money) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
household.addEventListener("change", onUserInput);
children.addEventListener("input", onUserInput);
late.addEventListener("change", onUserInput);
render();
