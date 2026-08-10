import { fromGross, fromNet } from "../lib/withholding";
import { formatWon } from "../lib/money";

type Mode = "gross" | "net";
let mode: Mode = "gross";

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const outWithholding = document.getElementById("out-withholding")!;
const outNet = document.getElementById("out-net")!;
const netLabel = document.getElementById("net-label")!;
const tabGross = document.getElementById("tab-gross") as HTMLButtonElement;
const tabNet = document.getElementById("tab-net") as HTMLButtonElement;

function currentValueOrDefault(defaultValue: string): string {
  const raw = amountInput.value;
  const parsed = parseFloat(raw);
  return raw !== "" && !isNaN(parsed) && parsed >= 0 ? raw : defaultValue;
}

function compute() {
  const value = Math.max(0, parseFloat(amountInput.value) || 0);
  if (mode === "gross") {
    const r = fromGross(value);
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.net);
    netLabel.textContent = "실수령액";
  } else {
    const r = fromNet(value);
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.gross);
    netLabel.textContent = "계약금액 (역산)";
  }
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

compute();
