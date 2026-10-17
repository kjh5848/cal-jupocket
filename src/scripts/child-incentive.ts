/**
 * 자녀장려금 계산기 — /guide/child-incentive-amount/.
 * 계산은 src/lib/child-incentive.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { childIncentive, bandInfo, type Household } from "../lib/child-incentive";
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
const BAND = { flat: "1명당 100만원 구간", taper: "벌수록 주는 구간", none: "대상 아님" } as const;

function render() {
  const h = household.value as Household;
  const r = childIncentive({
    household: h,
    pay: parseAmount(pay.value),
    children: Math.max(0, Number(children.value) || 0),
    assets: parseAmount(assets.value),
    childTaxCredit: parseAmount(credit.value),
    late: late.checked,
  });
  $("ci-hero").textContent = formatWon(r.amount);
  const b = bandInfo(h);
  $("ci-band").textContent = BAND[r.band];
  $("ci-flat").textContent = `${eokwon(b.flatUnder)} 미만`;
  $("ci-base").textContent = formatWon(r.base);
  $("ci-below").textContent = formatWon(r.belowMax);
  $("ci-floor").textContent = formatWon(r.floorAdj);
  $("ci-assets-cut").textContent = formatWon(r.assetsCut);
  $("ci-late-cut").textContent = formatWon(r.lateCut);
  $("ci-credit-cut").textContent = formatWon(r.minusCredit);
  $("ci-formula").textContent = `자녀장려금 = 법 식 금액 − 줄어든 돈(3만원 미만이면 3만원). 줄어드는 구간에서는 총급여액 등이 1만원 늘 때마다 자녀 1명당 약 ${Math.floor(b.perChildTaperPer10k).toLocaleString("ko-KR")}원씩 줄어듭니다(제100조의29 제1항). 3만원 하한은 재산·기한 후 신청·자녀세액공제로 줄인 뒤의 금액에 적용합니다(제100조의31 제2항).`;
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
