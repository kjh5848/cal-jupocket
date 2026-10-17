/**
 * 산재 휴업급여 계산기 — /guide/industrial-accident-leave-pay/.
 * 계산은 src/lib/industrial-accident.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import r from "../rates/industrial-accident-2026.json";
import { leavePayDaily, bandRange } from "../lib/industrial-accident";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("industrial-accident-leave-pay");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const total = $<HTMLInputElement>("ia-total");
const days = $<HTMLInputElement>("ia-days");
const age = $<HTMLSelectElement>("ia-age");
const grace = $<HTMLInputElement>("ia-grace");
const [bandLo, bandHi] = bandRange();
const E = r.leavePay.elderly;

function render() {
  const t = parseAmount(total.value);
  const d = Math.max(0, Math.floor(Number(days.value) || 0));
  const avg = t && d ? t / d : 0;
  const p = leavePayDaily(avg, Number(age.value) || 0, grace.checked);
  $("ia-avg").textContent = formatWon(Math.floor(p.avg));
  const old = Number(age.value) >= 61 && !grace.checked;
  const key = String(Math.min(65, Number(age.value))) as keyof typeof E.standardFraction;
  $("ia-rate-label").textContent = `평균임금 × ${p.kind === "floor" ? "90% (제54조 ①)" : "70% (제52조)"}`;
  $("ia-cut-label").textContent = old ? `별표 1 감액 (× ${p.kind === "floor" ? E.lowIncomeFraction[key] : E.standardFraction[key]})` : "별표 1 감액";
  $("ia-which").textContent =
    p.kind === "none" ? "—"
    : p.kind === "band" ? "저소득 특례 단서 구간"
    : p.kind === "floor" ? (p.raise > 0 ? "최저임금액 보장" : "저소득 특례 90%")
    : avg > r.compensationBase.max ? "상한 × 70%" : "평균임금 70%";
  if (p.kind === "band") {
    $("ia-hero").textContent = "공단 결정액 확인";
    for (const id of ["ia-month", "ia-gap", "ia-rate", "ia-raise", "ia-floor", "ia-cut"]) $(id).textContent = "—";
    $("ia-note").textContent = `평균임금 ${formatWon(bandLo)}~${formatWon(bandHi)}은 저소득 특례(제54조 제1항 단서) 구간입니다. 최저임금액 보장이 미치는지 조문만으로 확정하지 못해 금액을 내지 않습니다.`;
    return;
  }
  const daily = p.daily ?? 0;
  $("ia-hero").textContent = formatWon(daily);
  $("ia-month").textContent = formatWon(daily * 30);
  $("ia-gap").textContent = formatWon(Math.max(0, Math.floor(p.avg) - p.byRate - p.raise));
  $("ia-rate").textContent = formatWon(p.byRate);
  $("ia-raise").textContent = formatWon(p.raise);
  $("ia-floor").textContent = formatWon(p.floorAdd);
  $("ia-cut").textContent = formatWon(p.ageCut);
  const aged = p.ratio < 1 ? " 61세 이후 별표 1 감액을 반영했습니다." : Number(age.value) >= 61 && grace.checked ? " 2년 유예라 감액하지 않았습니다." : "";
  $("ia-note").textContent = !avg
    ? "임금 총액과 일수를 넣으세요."
    : p.kind === "floor"
      ? `저소득 특례 — 평균임금 90%가 최저임금액보다 적어 최저임금액 ${formatWon(r.compensationBase.minWageDaily)} 기준입니다.${aged}`
      : avg > r.compensationBase.max
        ? `평균임금 상한 ${formatWon(r.compensationBase.max)}의 70%입니다.${aged}`
        : `평균임금 ${formatWon(Math.floor(p.avg))}의 70%입니다.${aged}`;
}

total.addEventListener("input", () => {
  const n = parseAmount(total.value);
  total.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
grace.addEventListener("change", () => { render(); reportUse(parseAmount(total.value)); });
for (const el of [days, age]) el.addEventListener("input", () => { render(); reportUse(parseAmount(total.value)); });
render();
