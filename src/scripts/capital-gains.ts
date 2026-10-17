/**
 * 양도세 계산기 — /guide/capital-gains-calculator/.
 * 계산은 src/lib/capital-gains.ts capitalGains() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/capital-gains-2026.json";
import { capitalGains, rateLabel, type AssetKind } from "../lib/capital-gains";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("capital-gains");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const money = ["cg-sale", "cg-acq", "cg-exp", "cg-basic-left"].map((id) => $<HTMLInputElement>(id));
const [sale, acq, exp, basicLeft] = money;
const kind = $<HTMLSelectElement>("cg-kind");
const hold = $<HTMLInputElement>("cg-hold");
const reside = $<HTMLInputElement>("cg-reside");
const one = $<HTMLInputElement>("cg-one");
const adj = $<HTMLInputElement>("cg-adj");
const sur = $<HTMLSelectElement>("cg-sur");
const nbl = $<HTMLInputElement>("cg-nbl");
const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const E = r.exemption;

function render() {
  const house = kind.value === "house";
  // 1주택·거주는 주택일 때만, 조정대상지역은 1주택을 골랐을 때만 묻는다
  $("cg-one-wrap").hidden = !house;
  $("cg-reside-wrap").hidden = !house;
  $("cg-adj-wrap").hidden = !(house && one.checked);
  const holdYears = Number(hold.value) || 0;
  const opts = {
    kind: kind.value as AssetKind,
    holdYears,
    surcharge: Number(sur.value) as 0 | 0.2 | 0.3,
    nonBusinessLand: nbl.checked && kind.value === "land",
  };
  const x = capitalGains({
    ...opts,
    sale: parseAmount(sale.value),
    acquisition: parseAmount(acq.value),
    expenses: parseAmount(exp.value),
    residenceYears: Number(reside.value) || 0,
    oneHouse: one.checked && house,
    adjustedAtAcquisition: adj.checked,
    basicLeft: basicLeft.value.trim() ? parseAmount(basicLeft.value) : undefined,
  });
  $("cg-hero").textContent = formatWon(x.total);
  $("cg-rate").textContent = rateLabel(x.base, opts);
  $("cg-lt-rate").textContent = pct(x.ltRate);
  $("cg-ratio").textContent = pct(x.ratio);
  $("cg-exempt-part").textContent = formatWon(x.exemptPart);
  $("cg-lt").textContent = formatWon(x.ltDeduction);
  $("cg-basic").textContent = formatWon(x.basic);
  $("cg-base").textContent = formatWon(x.base);
  $("cg-tax").textContent = formatWon(x.tax);
  $("cg-local").textContent = formatWon(x.local);

  let note = "";
  if (x.exempt) note = `1세대 1주택 비과세 — 양도가액 ${formatWon(E.highPrice)} 이하`;
  else if (x.oneHouseUnmet === "hold") note = `보유 ${E.holdYears}년 미만이라 1주택 비과세가 아닙니다. 일반 주택으로 계산했습니다.`;
  else if (x.oneHouseUnmet === "residence") note = `조정대상지역에서 산 집은 거주 ${E.residenceYearsIfAdjusted}년이 필요합니다. 비과세가 아니어서 일반 주택으로 계산했습니다.`;
  else if (x.ratio > 0 && x.ratio < 1) note = `${formatWon(E.highPrice)} 넘는 부분 비율(${pct(x.ratio)})만 과세합니다.`;
  $("cg-note").textContent = note;

  $("cg-formula").textContent =
    x.gain === 0
      ? "양도차익이 없으면 낼 양도소득세도 없습니다(예정신고는 해야 합니다)."
      : `양도차익 ${formatWon(x.gain)}` +
        (x.ratio < 1 ? ` × 과세 비율 ${pct(x.ratio)}` : "") +
        ` − 장기보유특별공제 ${formatWon(x.ltDeduction)} − 기본공제 ${formatWon(x.basic)} = 과세표준 ${formatWon(x.base)}`;
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(sale.value));
}

for (const el of money) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    // 남은 기본공제는 0원(이미 다 씀)도 뜻이 있어 비우지 않는다
    el.value = n ? formatAmountInput(n) : el === basicLeft && /^\s*0/.test(el.value) ? "0" : "";
    onUserInput();
  });
}
for (const el of [hold, reside]) el.addEventListener("input", onUserInput);
for (const el of [kind, one, adj, sur, nbl]) el.addEventListener("change", onUserInput);
render();
