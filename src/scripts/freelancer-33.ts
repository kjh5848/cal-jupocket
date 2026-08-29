import { fromGross, fromNet } from "../lib/withholding";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";

type Mode = "gross" | "net";
let mode: Mode = "gross";
let lastResult: { gross: number; withholding: number; net: number } = {
  gross: 0,
  withholding: 0,
  net: 0,
};

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const outWithholding = document.getElementById("out-withholding")!;
const outNet = document.getElementById("out-net")!;
const netLabelEl = document.getElementById("net-label")!;
const tabGross = document.getElementById("tab-gross") as HTMLButtonElement;
const tabNet = document.getElementById("tab-net") as HTMLButtonElement;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;
const presetButtons = document.querySelectorAll<HTMLButtonElement>(
  ".preset-chip[data-add]",
);

// 역산 모드(실수령액 -> 계약금액)일 때만 "계약금액 (역산)"을 쓰고, 그 외엔 fallback을 쓴다.
function netLabel(fallback: string): string {
  return mode === "net" ? "계약금액 (역산)" : fallback;
}

function compute() {
  const value = parseAmount(amountInput.value);
  if (mode === "gross") {
    const r = fromGross(value);
    lastResult = r;
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.net);
  } else {
    const r = fromNet(value);
    lastResult = r;
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.gross);
  }
  netLabelEl.textContent = netLabel("실수령액");
}

function buildCard() {
  return renderCard({
    title: "3.3% 원천징수 계산 결과",
    lines: [
      [netLabel("계약금액"), formatWon(lastResult.gross)],
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
  tabGross.setAttribute("aria-pressed", String(mode === "gross"));
  tabNet.setAttribute("aria-pressed", String(mode === "net"));
  compute();
}

tabGross.addEventListener("click", () => setMode("gross"));
tabNet.addEventListener("click", () => setMode("net"));

amountInput.addEventListener("input", () => {
  const value = parseAmount(amountInput.value);
  amountInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = amountInput.value.length;
  amountInput.setSelectionRange(end, end);
  compute();
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const add = parseInt(btn.dataset.add ?? "0", 10);
    const next = parseAmount(amountInput.value) + add;
    amountInput.value = formatAmountInput(next);
    compute();
  });
});

btnDownload.addEventListener("click", () => {
  downloadCard(buildCard(), "freelancer-33-result.png");
});

btnShare.addEventListener("click", async () => {
  await shareCard(buildCard(), "3.3% 원천징수 계산 결과 - jupocket.com");
});

btnCopy.addEventListener("click", async () => {
  const text = `${netLabel("계약금액")} ${formatWon(lastResult.gross)} / 원천징수액 ${formatWon(lastResult.withholding)} / 실수령액 ${formatWon(lastResult.net)}`;
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

compute();
