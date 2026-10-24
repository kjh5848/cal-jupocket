/**
 * 미국판 Lottery Tax Calculator(/en-us/lottery-tax/) 화면 — 계산은 lib/us/gambling-winnings.ts(26 U.S.C. 3402(q) · Rev. Proc. 2025-32).
 * 한국 복권 세금과 제도가 달라 공유 스크립트(src/scripts/)를 쓰지 않고, 화면 문구는 영어만 둔다.
 */
import { computeLottery, standardDeduction, PROCEEDS_THRESHOLD, W2G_MINIMUM, type Game, type Status } from "./gambling-winnings";
import { parseUsd, usd0 } from "./fica";
import { renderCard, downloadCard, shareCard } from "../result-card";
import { track, trackCalculatorUse } from "../track";

const CALC = "us-lottery-tax";
const reportUse = trackCalculatorUse(CALC);

const $ = (id: string) => document.getElementById(id)!;
const inp = (id: string) => $(id) as HTMLInputElement;
const sel = (id: string) => $(id) as HTMLSelectElement;

const STATUS_LABEL: Record<Status, string> = {
  single: "Single",
  mfj: "Married filing jointly",
  hoh: "Head of household",
  mfs: "Married filing separately",
};
const pct = (r: number) => `${(r * 100).toFixed(1).replace(/\.0$/, "")}%`;

let lastLines: [string, string][] = [];

function compute() {
  const s = sel("lt-status").value;
  const status: Status = s === "mfj" || s === "hoh" || s === "mfs" ? s : "single";
  const g = sel("lt-game").value;
  const game: Game = g === "wager" || g === "slots" ? g : "lottery";
  const std = standardDeduction(status);
  inp("lt-ded").placeholder = `${usd0(std)} standard`;
  const dedRaw = inp("lt-ded").value.trim();
  const winnings = parseUsd(inp("lt-win").value);
  const r = computeLottery({
    status,
    game,
    winnings,
    wager: parseUsd(inp("lt-wager").value),
    otherIncome: parseUsd(inp("lt-other").value),
    deduction: dedRaw === "" ? undefined : parseUsd(dedRaw),
  });

  $("hero-value").textContent = usd0(r.additionalTax);
  $("out-withheld").textContent = usd0(r.withholding);
  $("out-balance").textContent = r.balanceDue >= 0 ? usd0(r.balanceDue) : `−${usd0(-r.balanceDue)}`;
  $("out-net").textContent = usd0(r.netAfterFederal);

  let hint: string;
  if (winnings === 0) hint = "Enter the prize you receive this year — the lump sum, or this year's annuity payment.";
  else {
    const wh =
      r.withholding > 0
        ? `The payer withholds 24% of ${usd0(r.proceeds)} = ${usd0(r.withholding)}.`
        : game === "slots"
          ? "Slot machine, keno and bingo winnings have no regular 24% withholding."
          : r.proceeds <= PROCEEDS_THRESHOLD
            ? `No 24% withholding: winnings minus the wager (${usd0(r.proceeds)}) are not more than ${usd0(PROCEEDS_THRESHOLD)}.`
            : "No 24% withholding: the winnings are less than 300 times the wager.";
    const bal =
      r.balanceDue > 0
        ? `You would owe about ${usd0(r.balanceDue)} more when you file.`
        : r.balanceDue < 0
          ? `Withholding is about ${usd0(-r.balanceDue)} more than the extra tax — that comes back as a refund or lowers other tax due.`
          : "Withholding matches the extra tax.";
    const w2g = game === "slots" ? "" : r.w2g ? " Expect a Form W-2G." : ` Under ${usd0(W2G_MINIMUM)} there is usually no W-2G, but the winnings are still taxable.`;
    hint = `${wh} The prize adds ${usd0(r.additionalTax)} of federal income tax (${pct(r.effectiveRate)} of the prize, top bracket ${pct(r.topRate)}). ${bal}${w2g} State tax is not included.`;
  }
  $("lt-hint").textContent = hint;

  lastLines = [
    ["Filing status", STATUS_LABEL[status]],
    ["Winnings", usd0(winnings)],
    ["24% withheld", usd0(r.withholding)],
    ["Extra federal tax (2026)", usd0(r.additionalTax)],
    [r.balanceDue >= 0 ? "Still owed at filing" : "Over-withheld", usd0(Math.abs(r.balanceDue))],
    ["Left after federal tax", usd0(r.netAfterFederal)],
  ];
}

for (const id of ["lt-win", "lt-wager", "lt-other", "lt-ded"]) {
  inp(id).addEventListener("input", () => {
    reportUse(parseUsd(inp("lt-win").value));
    compute();
  });
}
for (const id of ["lt-status", "lt-game"]) sel(id).addEventListener("change", compute);

const buildCard = () => renderCard({ title: "Lottery tax (federal)", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: CALC });
  downloadCard(buildCard(), "lottery-tax.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: CALC });
  await shareCard(buildCard(), "Lottery tax calculator result - jupocket.com");
});

compute();
