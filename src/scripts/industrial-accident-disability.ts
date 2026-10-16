/**
 * 산재 장해급여 계산기 — /guide/industrial-accident-disability/.
 * 계산은 src/lib/industrial-accident.ts 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { disabilityPay } from "../lib/industrial-accident";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("industrial-accident-disability");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const avg = $<HTMLInputElement>("dis-avg");
const grade = $<HTMLSelectElement>("dis-grade");
const WAY = { annuity: "연금만", choice: "연금·일시금 선택", lump: "일시금만" } as const;

function render() {
  const p = disabilityPay(parseAmount(avg.value), Number(grade.value) || 14);
  $("dis-used").textContent = formatWon(p.avg);
  $("dis-annuity").textContent = p.annuityYear ? formatWon(p.annuityYear) : "없음";
  if (p.way === "annuity") {
    $("dis-label").textContent = "장해보상연금(1년)";
    $("dis-hero").textContent = formatWon(p.annuityYear);
    $("dis-note").textContent = `제${p.grade}급 · 연금만 · 연 ${p.annuityDays}일분`;
  } else {
    $("dis-label").textContent = "장해보상일시금";
    $("dis-hero").textContent = formatWon(p.lump);
    $("dis-note").textContent = `제${p.grade}급 · ${WAY[p.way]} · ${p.lumpDays.toLocaleString("ko-KR")}일분` + (p.way === "choice" ? ` (연금이면 연 ${p.annuityDays}일분)` : "");
  }
}

avg.addEventListener("input", () => {
  const n = parseAmount(avg.value);
  avg.value = n ? formatAmountInput(n) : "";
  render();
  reportUse(n);
});
grade.addEventListener("input", () => { render(); reportUse(parseAmount(avg.value)); });
render();
