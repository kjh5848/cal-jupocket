/**
 * 근로장려금 계산기 — /guide/earned-incentive-amount/.
 * 계산은 src/lib/earned-incentive.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { earnedIncentive, bandInfo, type EarnedHousehold } from "../lib/earned-incentive";
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
const BAND = { rise: "벌수록 느는 구간", flat: "최대 금액 구간", taper: "벌수록 주는 구간", none: "대상 아님" } as const;

function render() {
  const h = household.value as EarnedHousehold;
  const r = earnedIncentive({ household: h, pay: parseAmount(pay.value), assets: parseAmount(assets.value), late: late.checked });
  $("ei-hero").textContent = formatWon(r.amount);
  const b = bandInfo(h);
  $("ei-band").textContent = BAND[r.band];
  $("ei-flat").textContent = `${eokwon(b.flatFrom)} 이상 ${eokwon(b.flatUnder)} 미만`;
  $("ei-base").textContent = formatWon(r.base);
  $("ei-below").textContent = formatWon(r.belowMax);
  $("ei-minadj").textContent = formatWon(r.minAdj);
  $("ei-assets-cut").textContent = formatWon(r.assetsCut);
  $("ei-late-cut").textContent = formatWon(r.lateCut);
  $("ei-formula").textContent = `근로장려금 = 법 식 금액 − 줄어든 돈 ± 최소 금액 규정. 줄어드는 구간에서는 총급여액 등이 1만원 늘 때마다 약 ${Math.floor(b.taperPer10k).toLocaleString("ko-KR")}원씩 줄어듭니다(제100조의5 제1항). 최소 금액은 재산·기한 후 신청으로 줄인 뒤의 금액에 적용합니다(제100조의7 제3항).`;
  const msg = !r.eligible
    ? `신청 자격 밖입니다 — 이 가구는 총소득 ${eokwon(rates.eligibility.totalIncomeUnder[h])} 미만, 재산 ${eokwon(rates.eligibility.assetsUnder)} 미만이어야 합니다.`
    : r.amount > r.base
      ? `계산한 금액이 작아 최소 금액 규정으로 ${formatWon(r.amount)}이 됩니다.`
      : r.minAdj < 0
        ? `줄인 뒤 금액이 ${eokwon(rates.reductions.minimum.none)} 미만이라 근로장려금이 없는 것으로 결정됩니다(제100조의7 제3항).`
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
