/**
 * 미국판 EITC 계산기(/en-us/earned-income-credit/) 화면 — 계산은 lib/us/eitc.ts(연방 26 U.S.C. 32 · Worksheet A).
 * 한국 근로장려금과 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { computeEitc, type Children, type Status, type Year } from "./eitc";
import { parseUsd, usd0 } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-eitc";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const inp = (id: string) => $(id) as HTMLInputElement;
const sel = (id: string) => $(id) as HTMLSelectElement;
const ageWrap = $("ei-age-wrap");

const STATUS_NAME: Record<Status, string> = {
  other: "Single / head of household / qualifying surviving spouse",
  mfj: "Married filing jointly",
  mfs: "Married filing separately",
};

let lastLines: [string, string][] = [];

function compute() {
  const year: Year = sel("ei-year").value === "2025" ? 2025 : 2026;
  const s = sel("ei-status").value;
  const status: Status = s === "mfj" || s === "mfs" ? s : "other";
  const children = Math.min(3, Math.max(0, Number(sel("ei-kids").value) || 0)) as Children;
  const earned = parseUsd(inp("ei-earned").value);
  const agiRaw = inp("ei-agi").value.trim();
  const agi = agiRaw === "" ? undefined : parseUsd(agiRaw);
  const r = computeEitc({
    year,
    status,
    children,
    earned,
    agi,
    investmentIncome: parseUsd(inp("ei-invest").value),
    ageOk: sel("ei-age").value !== "no",
  });
  ageWrap.hidden = children !== 0;

  const p = r.params;
  $("hero-value").textContent = usd0(r.credit);
  $("out-max").textContent = usd0(p.maxCredit);
  $("out-threshold").textContent = usd0(p.threshold);
  $("out-end").textContent = usd0(p.completed);

  const note2026 = year === 2026 ? " 2026 figures use Rev. Proc. 2025-32 amounts with the 2025 table method; the 2026 EIC Table is not out yet." : "";
  const mfsNote = status === "mfs" ? " Married filing separately only qualifies under the separated-spouse rule." : "";
  const msg: Record<string, string> = {
    mfsNoChild: "Married filing separately: the credit needs a qualifying child who lived with you more than half the year, so it is $0 with no children.",
    age: "With no qualifying child, you (or your spouse on a joint return) must be at least 25 and under 65 at the end of the year, so the credit is $0.",
    investment: `Investment income over ${usd0(p.investmentIncomeLimit)} rules out the credit for ${year}.`,
  };
  $("ei-hint").textContent =
    msg[r.reason] ??
    (earned === 0
      ? "Enter your earned income — wages, salary and tips from your W-2s."
      : r.credit === 0
        ? `At this income the credit has phased out — it ends at ${usd0(p.completed)} for ${STATUS_NAME[status === "mfs" ? "other" : status].toLowerCase()} with ${children === 3 ? "3 or more" : children} ${children === 1 ? "child" : "children"}.${note2026}`
        : r.byAgi !== null
          ? `Table amount for earned income ${usd0(r.byEarned)}, for AGI ${usd0(r.byAgi)} — Worksheet A uses the smaller one.${mfsNote}${note2026}`
          : `The table amount for these entries.${mfsNote}${note2026}`);

  lastLines = [
    ["Tax year", String(year)],
    ["Filing status", STATUS_NAME[status]],
    ["Qualifying children", children === 3 ? "3 or more" : String(children)],
    ["Earned income", usd0(earned)],
    ["AGI", usd0(agi ?? earned)],
    ["Earned income credit", usd0(r.credit)],
  ];
}

for (const id of ["ei-earned", "ei-agi", "ei-invest"]) {
  inp(id).addEventListener("input", () => {
    reportUse(parseUsd(inp("ei-earned").value));
    compute();
  });
}
for (const id of ["ei-year", "ei-status", "ei-kids", "ei-age"]) sel(id).addEventListener("change", compute);

const buildCard = () => renderCard({ title: "Earned income credit", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "earned-income-credit.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Earned income credit calculator result - jupocket.com");
});

compute();
