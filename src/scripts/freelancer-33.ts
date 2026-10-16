import { fromGross, fromNet } from "../lib/withholding";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("freelancer_33");

type Mode = "gross" | "net";
let mode: Mode = "gross";
let lastResult = { gross: 0, withholding: 0, net: 0, incomeTax: 0, localTax: 0 };

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const outNet = document.getElementById("out-net")!;
const outGross = document.getElementById("out-gross")!;
const outNetV = document.getElementById("out-netv")!;
const outIncome = document.getElementById("out-income")!;
const outLocal = document.getElementById("out-local")!;
const netLabelEl = document.getElementById("net-label")!;
const modeSelect = document.getElementById("mode") as HTMLSelectElement;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;

// 역산 모드(실수령액 -> 계약금액)일 때만 "계약금액 (역산)"을 쓰고, 그 외엔 fallback을 쓴다.
function netLabel(fallback: string): string {
  return mode === "net" ? "계약금액 (역산)" : fallback;
}

function compute() {
  const value = parseAmount(amountInput.value);
  const r = mode === "gross" ? fromGross(value) : fromNet(value);
  lastResult = r;
  // 큰 숫자는 구하려던 값 — 계약금액으로 계산하면 실수령액, 역산하면 계약금액
  outNet.textContent = formatWon(mode === "gross" ? r.net : r.gross);
  outGross.textContent = formatWon(r.gross);
  outNetV.textContent = formatWon(r.net);
  outIncome.textContent = formatWon(r.incomeTax);
  outLocal.textContent = formatWon(r.localTax);
  netLabelEl.textContent = mode === "gross" ? "실수령액" : "필요한 계약금액";
}

function buildCard() {
  return renderCard({
    title: "3.3% 원천징수 계산 결과",
    lines: [
      [netLabel("계약금액"), formatWon(lastResult.gross)],
      ["소득세(3%)", formatWon(lastResult.incomeTax)],
      ["지방소득세(0.3%)", formatWon(lastResult.localTax)],
      ["원천징수액(3.3%)", formatWon(lastResult.withholding)],
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
  track("save_result", { calculator: "freelancer_33" });
  downloadCard(buildCard(), "freelancer-33-result.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "freelancer_33" });
  await shareCard(buildCard(), "3.3% 원천징수 계산 결과 - jupocket.com");
});

compute();
