/**
 * 미국판 FICA 계산기(/en-us/fica-tax/) 화면 — 계산은 lib/us/fica.ts(미국 연방 제도).
 * 한국어판 4대보험과 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { withholding, additionalMedicareLiability, parseUsd, usd, usd0, SS_WAGE_BASE, type FilingStatus } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-fica";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const wagesIn = $("fc-wages") as HTMLInputElement;
const ytdIn = $("fc-ytd") as HTMLInputElement;
const yearIn = $("fc-year") as HTMLInputElement;
const statusSel = $("fc-status") as HTMLSelectElement;

const STATUSES: FilingStatus[] = ["single", "marriedFilingJointly", "marriedFilingSeparately", "headOfHousehold", "qualifyingWidow"];

let lastLines: [string, string][] = [];

function compute() {
  const wages = parseUsd(wagesIn.value);
  const ytd = parseUsd(ytdIn.value);
  const r = withholding(wages, ytd);

  $("hero-value").textContent = usd(r.total);
  $("fc-hint").textContent =
    wages === 0
      ? "Enter the gross wages for this paycheck."
      : r.ssWages < wages && r.capReached
        ? `Social Security stops at ${usd0(SS_WAGE_BASE)} of wages this year — only ${usd(r.ssWages)} of this paycheck is taxed for it.`
        : `${((r.total / wages) * 100).toFixed(2)}% of this paycheck`;
  $("out-ss").textContent = usd(r.ss);
  $("out-medicare").textContent = usd(r.medicare);
  $("out-addl").textContent = usd(r.addl);
  $("out-employer").textContent = usd(r.employerTotal);
  $("out-ytd").textContent = usd(r.ytdAfter);
  $("out-net").textContent = usd(Math.max(0, Math.round((wages - r.total) * 100) / 100));

  lastLines = [
    ["Wages this paycheck", usd(wages)],
    ["Social Security (6.2%)", usd(r.ss)],
    ["Medicare (1.45%)", usd(r.medicare)],
    ["Additional Medicare (0.9%)", usd(r.addl)],
    ["Employee FICA total", usd(r.total)],
  ];

  const yearWages = parseUsd(yearIn.value);
  const status = (STATUSES.includes(statusSel.value as FilingStatus) ? statusSel.value : "single") as FilingStatus;
  $("out-liability").textContent = usd(additionalMedicareLiability(yearWages, status));
}

for (const el of [wagesIn, ytdIn, yearIn]) {
  el.addEventListener("input", () => {
    reportUse(parseUsd(wagesIn.value));
    compute();
  });
}
statusSel.addEventListener("change", compute);

const buildCard = () => renderCard({ title: "FICA tax withholding (2026)", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "fica-tax-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "FICA tax calculator result - jupocket.com");
});

compute();
