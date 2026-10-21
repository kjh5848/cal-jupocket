/**
 * 미국판 의료비 공제 계산기(/en-us/medical-expense-deduction/) 화면 — 계산은 lib/us/medical-expense.ts(연방 Schedule A).
 * 한국 의료비 세액공제와 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { computeMedical, MILEAGE, type FilingStatus, type Year } from "./medical-expense";
import { parseUsd, usd } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-medical-expense";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const inp = (id: string) => $(id) as HTMLInputElement;
const yearSel = $("md-year") as HTMLSelectElement;
const statusSel = $("md-status") as HTMLSelectElement;
const boxesSel = $("md-boxes") as HTMLSelectElement;
const milesLabel = $("md-miles-label");
const miles2Wrap = $("md-miles2-wrap");

const STATUSES: FilingStatus[] = ["single", "marriedFilingJointly", "marriedFilingSeparately", "headOfHousehold", "qualifyingSurvivingSpouse"];
const num = (id: string) => {
  const v = parseFloat(inp(id).value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

const cpm = (r: number) => `${Math.round(r * 1000) / 10}¢`;

let lastLines: [string, string][] = [];

function compute() {
  const year: Year = yearSel.value === "2025" ? 2025 : 2026;
  const status = (STATUSES.includes(statusSel.value as FilingStatus) ? statusSel.value : "single") as FilingStatus;
  const agi = parseUsd(inp("md-agi").value);
  const ltc: [number, number][] = [
    [num("md-age1"), parseUsd(inp("md-prem1").value)],
    [num("md-age2"), parseUsd(inp("md-prem2").value)],
  ];
  const r = computeMedical({
    year,
    status,
    agi,
    expenses: parseUsd(inp("md-exp").value),
    miles: num("md-miles"),
    milesLate: year === 2026 ? num("md-miles2") : 0,
    tollsParking: parseUsd(inp("md-tolls").value),
    ltc: ltc.filter(([, p]) => p > 0),
    otherItemized: parseUsd(inp("md-other").value),
    boxes: Number(boxesSel.value) || 0,
  });

  milesLabel.textContent =
    year === 2025 ? `Medical miles driven in 2025 (${cpm(MILEAGE[2025])} a mile)` : `Medical miles, Jan 1 – Jun 30, 2026 (${cpm(MILEAGE[2026].firstHalf)} a mile)`;
  miles2Wrap.hidden = year === 2025;

  $("hero-value").textContent = usd(r.deduction);
  $("out-line1").textContent = usd(r.line1);
  $("out-floor").textContent = usd(r.floor);
  $("out-itemized").textContent = usd(r.itemizedTotal);
  $("out-standard").textContent = usd(r.standard);

  const mfs = status === "marriedFilingSeparately" ? " If your spouse itemizes on a separate return, your standard deduction is $0." : "";
  $("md-hint").textContent =
    agi === 0
      ? "Enter your AGI (Form 1040, line 11b) and your unreimbursed medical expenses."
      : r.deduction === 0
        ? `Medical expenses of ${usd(r.line1)} don't exceed 7.5% of AGI (${usd(r.floor)}), so nothing is deductible.${mfs}`
        : r.difference > 0
          ? `Itemized deductions (${usd(r.itemizedTotal)}) are larger than the ${year} standard deduction by ${usd(r.difference)}.${mfs}`
          : `The ${year} standard deduction (${usd(r.standard)}) is larger than these itemized deductions by ${usd(-r.difference)}, so the medical deduction would not lower taxable income unless you itemize anyway.${mfs}`;

  lastLines = [
    ["Tax year", String(year)],
    ["AGI", usd(agi)],
    ["Medical expenses (line 1)", usd(r.line1)],
    ["7.5% of AGI (line 3)", usd(r.floor)],
    ["Medical deduction (line 4)", usd(r.deduction)],
    ["Itemized total", usd(r.itemizedTotal)],
    ["Standard deduction", usd(r.standard)],
  ];
}

for (const id of ["md-agi", "md-exp", "md-miles", "md-miles2", "md-tolls", "md-age1", "md-prem1", "md-age2", "md-prem2", "md-other"]) {
  inp(id).addEventListener("input", () => {
    reportUse(parseUsd(inp("md-exp").value));
    compute();
  });
}
for (const s of [yearSel, statusSel, boxesSel]) s.addEventListener("change", compute);

const buildCard = () => renderCard({ title: "Medical expense deduction", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "medical-expense-deduction.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Medical expense deduction calculator result - jupocket.com");
});

compute();
