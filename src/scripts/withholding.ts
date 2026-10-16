import { fromGross, fromNet, otherIncome, otherIncomeFromNet } from "../lib/withholding";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("withholding");

type IncomeType = "business" | "other";
type Mode = "gross" | "net";

let incomeType: IncomeType = "business";
let mode: Mode = "gross";
let lastResult = { gross: 0, withholding: 0, net: 0, incomeTax: 0, localTax: 0, exempt: false };

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const outNet = document.getElementById("out-net")!;
const outGross = document.getElementById("out-gross")!;
const outNetV = document.getElementById("out-netv")!;
const outIncome = document.getElementById("out-income")!;
const outLocal = document.getElementById("out-local")!;
const outExempt = document.getElementById("out-exempt")!;
const incomeLabelEl = document.getElementById("income-label")!;
const localLabelEl = document.getElementById("local-label")!;
const netLabelEl = document.getElementById("net-label")!;
const typeSelect = document.getElementById("income-type") as HTMLSelectElement;
const modeSelect = document.getElementById("mode") as HTMLSelectElement;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;

const rateLabel = () => (incomeType === "business" ? "3.3%" : "8.8%");
const incomeLabel = () => (incomeType === "business" ? "사업소득" : "기타소득");
// 소득세 몫 · 지방소득세 몫(소득세의 10%)
const parts = () => (incomeType === "business" ? ["3%", "0.3%"] : ["8%", "0.8%"]);

function compute() {
  const value = parseAmount(amountInput.value);
  const r =
    incomeType === "business"
      ? { ...(mode === "gross" ? fromGross(value) : fromNet(value)), exempt: false }
      : mode === "gross" ? otherIncome(value) : otherIncomeFromNet(value);
  lastResult = r;
  // 큰 숫자는 구하려던 값 — 계약금액으로 계산하면 실수령액, 역산하면 계약금액
  outNet.textContent = formatWon(mode === "gross" ? r.net : r.gross);
  netLabelEl.textContent = mode === "gross" ? "실수령액" : "필요한 계약금액";
  outGross.textContent = formatWon(r.gross);
  outNetV.textContent = formatWon(r.net);
  outIncome.textContent = formatWon(r.incomeTax);
  outLocal.textContent = formatWon(r.localTax);
  const [inc, loc] = parts();
  incomeLabelEl.textContent = `소득세 (${inc})`;
  localLabelEl.textContent = `지방소득세 (${loc})`;
  outExempt.hidden = !(r.exempt && r.gross > 0);
}

function buildCard() {
  const [inc, loc] = parts();
  return renderCard({
    title: `원천징수 계산 결과 (${incomeLabel()} ${rateLabel()})`,
    lines: [
      [mode === "net" ? "계약금액 (역산)" : "계약금액", formatWon(lastResult.gross)],
      [`소득세(${inc})`, formatWon(lastResult.incomeTax)],
      [`지방소득세(${loc})`, formatWon(lastResult.localTax)],
      [`원천징수액(${rateLabel()})`, formatWon(lastResult.withholding)],
      ["실수령액", formatWon(lastResult.net)],
    ],
    footer: "jupocket.com",
  });
}

function setMode(next: Mode) {
  mode = next;
  if (mode === "gross") {
    inputLabel.textContent = "계약금액";
    amountInput.value = currentValueOrDefault(amountInput.value, 1000000);
  } else {
    inputLabel.textContent = "실수령액";
    amountInput.value = currentValueOrDefault(amountInput.value, 967000);
  }
  compute();
}

typeSelect.addEventListener("change", () => {
  incomeType = typeSelect.value === "other" ? "other" : "business";
  compute();
});
modeSelect.addEventListener("change", () => setMode(modeSelect.value === "net" ? "net" : "gross"));

amountInput.addEventListener("input", () => {
  reportUse(parseAmount(amountInput.value));
  const value = parseAmount(amountInput.value);
  amountInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = amountInput.value.length;
  amountInput.setSelectionRange(end, end);
  compute();
});

btnDownload.addEventListener("click", () => {
  track("save_result", { calculator: "withholding" });
  downloadCard(buildCard(), "withholding-result.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "withholding" });
  await shareCard(buildCard(), `원천징수(${rateLabel()}) 계산 결과 - jupocket.com`);
});

compute();
