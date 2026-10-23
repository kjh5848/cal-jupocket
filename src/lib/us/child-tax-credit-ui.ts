/**
 * 미국판 Child Tax Credit 계산기(/en-us/child-tax-credit/) 화면 — 계산은 lib/us/child-tax-credit.ts(26 U.S.C. 24 · Schedule 8812).
 * 한국 자녀장려금과 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { computeCtc, phaseoutEnd, PART_IIB_CHILDREN, type Status, type Year } from "./child-tax-credit";
import { parseUsd, usd0 } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-child-tax-credit";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const inp = (id: string) => $(id) as HTMLInputElement;
const sel = (id: string) => $(id) as HTMLSelectElement;
const iibWrap = [$("ct-ss-wrap"), $("ct-eic-wrap")];

const count = (raw: string) => Math.min(20, Math.max(0, Math.floor(Number(raw.replace(/[^0-9]/g, "")) || 0)));

let lastLines: [string, string][] = [];

function compute() {
  const year: Year = sel("ct-year").value === "2025" ? 2025 : 2026;
  const status: Status = sel("ct-status").value === "mfj" ? "mfj" : "other";
  const children = count(inp("ct-kids").value);
  const otherDependents = count(inp("ct-other").value);
  const magi = parseUsd(inp("ct-magi").value);
  const earnedRaw = inp("ct-earned").value.trim();
  const earned = earnedRaw === "" ? magi : parseUsd(earnedRaw);
  const r = computeCtc({
    year,
    status,
    children,
    otherDependents,
    magi,
    taxLimit: parseUsd(inp("ct-tax").value),
    earned,
    socialSecurityTaxes: parseUsd(inp("ct-ss").value),
    eic: parseUsd(inp("ct-eic").value),
  });
  for (const w of iibWrap) w.hidden = children < PART_IIB_CHILDREN;

  $("hero-value").textContent = usd0(r.total);
  $("out-nonref").textContent = usd0(r.line14);
  $("out-actc").textContent = usd0(r.line27);
  $("out-reduce").textContent = usd0(r.line11);

  const yearNote = year === 2026 ? " 2026 uses Rev. Proc. 2025-32 amounts with the 2025 Schedule 8812 method." : "";
  const unused = r.line12 - r.line14 - r.line27;
  let hint: string;
  if (children + otherDependents === 0) hint = "Enter the number of qualifying children or other dependents.";
  else if (r.actcReason === "noCredit")
    hint = `Your MAGI is high enough that the ${usd0(r.line8)} credit is fully phased out — it ends once MAGI is over ${usd0(phaseoutEnd(status, r.line8))}.`;
  else if (r.actcReason === "noChildren")
    hint = `The $500 credit for other dependents only reduces tax — it has no refundable part.${r.line14 < r.line12 ? ` ${usd0(r.line12 - r.line14)} goes unused because your tax is lower.` : ""}${yearNote}`;
  else if (r.actcReason === "fullyUsed") hint = `Your tax covers the whole credit, so there is no additional child tax credit.${yearNote}`;
  else if (r.actcReason === "noEarned")
    hint = `The refundable part needs earned income over $2,500 (or the 3-child rule). ${usd0(r.line12 - r.line14)} goes unused.${yearNote}`;
  else
    hint =
      `Line 14 ${usd0(r.line14)} reduces your tax; line 27 ${usd0(r.line27)} is refundable` +
      (r.line25 !== null && r.line25 > r.line20 ? " (from the 3-or-more-children rule, line 25)" : ` (15% of earned income over $2,500 is ${usd0(r.line20)}, the cap is ${usd0(r.line16b)})`) +
      `.${unused > 0 ? ` ${usd0(unused)} goes unused.` : ""}${yearNote}`;
  $("ct-hint").textContent = hint;

  lastLines = [
    ["Tax year", String(year)],
    ["Filing status", status === "mfj" ? "Married filing jointly" : "Single / HOH / other"],
    ["Children / other dependents", `${children} / ${otherDependents}`],
    ["MAGI", usd0(magi)],
    ["Nonrefundable CTC + ODC", usd0(r.line14)],
    ["Additional child tax credit", usd0(r.line27)],
    ["Total", usd0(r.total)],
  ];
}

for (const id of ["ct-kids", "ct-other", "ct-magi", "ct-tax", "ct-earned", "ct-ss", "ct-eic"]) {
  inp(id).addEventListener("input", () => {
    reportUse(parseUsd(inp("ct-magi").value));
    compute();
  });
}
for (const id of ["ct-year", "ct-status"]) sel(id).addEventListener("change", compute);

const buildCard = () => renderCard({ title: "Child tax credit", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "child-tax-credit.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Child tax credit calculator result - jupocket.com");
});

compute();
