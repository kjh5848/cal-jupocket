/**
 * 코인 세금 계산기 — /guide/crypto-tax-calculator/.
 * 계산은 src/lib/crypto-tax.ts cryptoPage() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { cryptoPage } from "../lib/crypto-tax";
import r from "../rates/crypto-2026.json";
import { eokwon } from "../lib/won";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("crypto-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fields = ["ct-proceeds", "ct-cost", "ct-pre", "ct-fv", "ct-fees"].map((id) => $<HTMLInputElement>(id));
const [proceeds, cost, pre, fv, fees] = fields;

function render() {
  const x = cryptoPage({ proceeds: parseAmount(proceeds.value), cost: parseAmount(cost.value), preCost: parseAmount(pre.value), preFairValue: parseAmount(fv.value), fees: parseAmount(fees.value) });
  const set = (id: string, v: number) => ($(id).textContent = formatWon(v));
  set("ct-hero", x.total);
  set("ct-income", x.income);
  $("ct-rate").textContent = `${x.effectiveRate}%`;
  set("ct-kept", x.kept);
  set("ct-dsave", x.deductionSaving);
  set("ct-room", x.room);
  set("ct-stepup", x.stepUp);
  set("ct-fvsave", x.stepUpSaving);
  set("ct-c-cost", x.cost);
  set("ct-c-pre", x.preBasis);
  set("ct-c-fees", x.fees);
  set("ct-tax", x.tax);
  set("ct-local", x.local);
  // 제84조 3호: 소득금액 250만원 이하면 과세하지 않는다
  $("ct-note").textContent = x.loss
    ? `1년 손익이 ${formatWon(-x.income)} 손실이라 세금이 없습니다.`
    : x.total
      ? `1년 이익 ${formatWon(x.income)}에서 ${eokwon(r.deduction)}을 빼고 ${Math.round((r.rate + r.localRate) * 100)}%를 곱했습니다.`
      : `1년 이익이 ${eokwon(r.deduction)} 이하라 세금이 없습니다.`;
}

for (const el of fields)
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    render();
    reportUse(parseAmount(proceeds.value));
  });
render();
