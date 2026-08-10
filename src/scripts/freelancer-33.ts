import { fromGross, fromNet } from "../lib/withholding";
import { formatWon } from "../lib/money";
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
const netLabel = document.getElementById("net-label")!;
const tabGross = document.getElementById("tab-gross") as HTMLButtonElement;
const tabNet = document.getElementById("tab-net") as HTMLButtonElement;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

function currentValueOrDefault(defaultValue: string): string {
  const raw = amountInput.value;
  const parsed = parseFloat(raw);
  return raw !== "" && !isNaN(parsed) && parsed >= 0 ? raw : defaultValue;
}

function compute() {
  const value = Math.max(0, parseFloat(amountInput.value) || 0);
  if (mode === "gross") {
    const r = fromGross(value);
    lastResult = r;
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.net);
    netLabel.textContent = "실수령액";
  } else {
    const r = fromNet(value);
    lastResult = r;
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.gross);
    netLabel.textContent = "계약금액 (역산)";
  }
}

function buildCard() {
  return renderCard({
    title: "3.3% 원천징수 계산 결과",
    lines: [
      ["계약금액", formatWon(lastResult.gross)],
      ["원천징수액(3.3%)", formatWon(lastResult.withholding)],
      ["실수령액", formatWon(lastResult.net)],
    ],
    footer: "cal.jupocket.com",
  });
}

tabGross.addEventListener("click", () => {
  mode = "gross";
  inputLabel.textContent = "계약금액";
  amountInput.value = currentValueOrDefault("1000000");
  tabGross.setAttribute("aria-pressed", "true");
  tabNet.setAttribute("aria-pressed", "false");
  compute();
});

tabNet.addEventListener("click", () => {
  mode = "net";
  inputLabel.textContent = "실수령액";
  amountInput.value = currentValueOrDefault("967000");
  tabNet.setAttribute("aria-pressed", "true");
  tabGross.setAttribute("aria-pressed", "false");
  compute();
});

amountInput.addEventListener("input", compute);

btnDownload.addEventListener("click", () => {
  downloadCard(buildCard(), "freelancer-33-result.png");
});

btnShare.addEventListener("click", async () => {
  await shareCard(buildCard(), "3.3% 원천징수 계산 결과 - cal.jupocket.com");
});

btnCopy.addEventListener("click", async () => {
  const text = `계약금액 ${formatWon(lastResult.gross)} / 원천징수액 ${formatWon(lastResult.withholding)} / 실수령액 ${formatWon(lastResult.net)}`;
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

compute();
