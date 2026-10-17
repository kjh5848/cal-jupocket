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
  const heroDays = p.way === "annuity" ? p.annuityDays : p.lumpDays;
  $("dis-used").textContent = formatWon(p.avg);
  $("dis-way").textContent = WAY[p.way];
  $("dis-annuity").textContent = p.annuityYear ? formatWon(p.annuityYear) : "없음";
  $("dis-monthly").textContent = p.monthly ? formatWon(p.monthly) : "없음";
  $("dis-adv-label").textContent = p.advanceYears
    ? `미리 받을 수 있는 최대 (${p.advanceYears}년분의 ½, 이자 공제 전, 제57조 ④)`
    : "미리 받을 수 있는 최대 (이자 공제 전, 제57조 ④)";
  $("dis-adv").textContent = p.advanceYears ? formatWon(p.advanceMax) : "없음";
  $("dis-even").textContent = p.breakevenYears ? `약 ${p.breakevenYears.toFixed(1)}년` : "—";
  $("dis-cap").textContent = formatWon(p.capCut);
  $("dis-base-label").textContent = `내 평균임금 × ${heroDays.toLocaleString("ko-KR")}일`;
  $("dis-base").textContent = formatWon(p.base);
  $("dis-raised").textContent = formatWon(p.raised);
  if (p.way === "annuity") {
    $("dis-label").textContent = "장해보상연금(1년)";
    $("dis-hero").textContent = formatWon(p.annuityYear);
    $("dis-note").textContent = `제${p.grade}급 · 연금만 · 연 ${p.annuityDays}일분 · 일시금 기준 ${p.lumpDays.toLocaleString("ko-KR")}일분(제57조 ⑤)`;
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
