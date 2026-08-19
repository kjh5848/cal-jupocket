import { fromGross, fromNet, otherIncome } from "../lib/withholding";
import { formatWon } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";

type IncomeType = "business" | "other";
type Mode = "gross" | "net";

let incomeType: IncomeType = "business";
let mode: Mode = "gross";
let lastResult: { gross: number; withholding: number; net: number } = {
  gross: 0,
  withholding: 0,
  net: 0,
};

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const outWithholding = document.getElementById("out-withholding")!;
const outRate = document.getElementById("out-rate")!;
const outNet = document.getElementById("out-net")!;
const netLabel = document.getElementById("net-label")!;
const tabIncomeBusiness = document.getElementById(
  "tab-income-business",
) as HTMLButtonElement;
const tabIncomeOther = document.getElementById(
  "tab-income-other",
) as HTMLButtonElement;
const tabGross = document.getElementById("tab-gross") as HTMLButtonElement;
const tabNet = document.getElementById("tab-net") as HTMLButtonElement;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

function rateLabel(): string {
  return incomeType === "business" ? "3.3%" : "8.8%";
}

function incomeLabel(): string {
  return incomeType === "business" ? "사업소득" : "기타소득";
}

function currentValueOrDefault(defaultValue: string): string {
  const raw = amountInput.value;
  const parsed = parseFloat(raw);
  return raw !== "" && !isNaN(parsed) && parsed >= 0 ? raw : defaultValue;
}

function compute() {
  const value = Math.max(0, parseFloat(amountInput.value) || 0);

  if (incomeType === "other") {
    const r = otherIncome(value);
    lastResult = r;
    outWithholding.textContent = formatWon(r.withholding);
    outNet.textContent = formatWon(r.net);
    netLabel.textContent = "실수령액";
  } else if (mode === "gross") {
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

  outRate.textContent = rateLabel();
}

function setMode(next: Mode) {
  mode = next;
  if (mode === "gross") {
    inputLabel.textContent = "계약금액";
    amountInput.value = currentValueOrDefault("1000000");
    tabGross.setAttribute("aria-pressed", "true");
    tabNet.setAttribute("aria-pressed", "false");
  } else {
    inputLabel.textContent = "실수령액";
    amountInput.value = currentValueOrDefault("967000");
    tabNet.setAttribute("aria-pressed", "true");
    tabGross.setAttribute("aria-pressed", "false");
  }
  compute();
}

function setIncomeType(next: IncomeType) {
  incomeType = next;
  tabIncomeBusiness.setAttribute(
    "aria-pressed",
    String(incomeType === "business"),
  );
  tabIncomeOther.setAttribute("aria-pressed", String(incomeType === "other"));

  if (incomeType === "other") {
    // otherIncome()은 gross만 받는 단방향 함수라 역산 모드가 성립하지 않는다.
    tabNet.disabled = true;
    tabNet.setAttribute("aria-disabled", "true");
    setMode("gross");
  } else {
    tabNet.disabled = false;
    tabNet.removeAttribute("aria-disabled");
    compute();
  }
}

function buildCard() {
  return renderCard({
    title: `원천징수 계산 결과 (${incomeLabel()} ${rateLabel()})`,
    lines: [
      [mode === "net" && incomeType === "business" ? "계약금액 (역산)" : "계약금액", formatWon(lastResult.gross)],
      [`원천징수액(${rateLabel()})`, formatWon(lastResult.withholding)],
      ["실수령액", formatWon(lastResult.net)],
    ],
    footer: "cal.jupocket.com",
  });
}

tabIncomeBusiness.addEventListener("click", () => setIncomeType("business"));
tabIncomeOther.addEventListener("click", () => setIncomeType("other"));

tabGross.addEventListener("click", () => setMode("gross"));
tabNet.addEventListener("click", () => {
  if (incomeType === "other") return;
  setMode("net");
});

amountInput.addEventListener("input", compute);

btnDownload.addEventListener("click", () => {
  downloadCard(buildCard(), "withholding-result.png");
});

btnShare.addEventListener("click", async () => {
  await shareCard(
    buildCard(),
    `원천징수(${rateLabel()}) 계산 결과 - cal.jupocket.com`,
  );
});

btnCopy.addEventListener("click", async () => {
  const text = `소득유형 ${incomeLabel()}(${rateLabel()}) / 계약금액 ${formatWon(
    lastResult.gross,
  )} / 원천징수액 ${formatWon(lastResult.withholding)} / 실수령액 ${formatWon(
    lastResult.net,
  )}`;
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

compute();
