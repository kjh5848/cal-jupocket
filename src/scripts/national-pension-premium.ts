import { compute } from "../lib/pension-premium";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";

let lastLines: [string, string][] = [];

const incomeInput = document.getElementById("income") as HTMLInputElement;
const heroValue = document.getElementById("hero-value")!;
const stat1Value = document.getElementById("stat1-value")!;
const stat2Value = document.getElementById("stat2-value")!;
const capNote = document.getElementById("cap-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;
const presetButtons =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-add]");

function recompute() {
  const r = compute(parseAmount(incomeInput.value));
  heroValue.textContent = formatWon(r.monthly);
  stat1Value.textContent = formatWon(r.annual);
  stat2Value.textContent = formatWon(r.standardIncome);

  if (r.capped) {
    capNote.textContent =
      "소득이 상한(659만원)을 넘어 기준소득월액이 상한으로 조정됐습니다.";
    capNote.style.display = "block";
  } else if (r.floored && r.income > 0) {
    capNote.textContent =
      "소득이 하한(41만원)보다 낮아 기준소득월액이 하한으로 조정됐습니다.";
    capNote.style.display = "block";
  } else {
    capNote.style.display = "none";
  }

  lastLines = [
    ["월소득", formatWon(r.income)],
    ["기준소득월액", formatWon(r.standardIncome)],
    ["월 보험료(9.5%)", formatWon(r.monthly)],
    ["연 보험료", formatWon(r.annual)],
  ];
}

function buildCard() {
  return renderCard({
    title: "국민연금 보험료 (지역가입자)",
    lines: lastLines,
    footer: "cal.jupocket.com",
  });
}

incomeInput.addEventListener("input", () => {
  const value = parseAmount(incomeInput.value);
  incomeInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = incomeInput.value.length;
  incomeInput.setSelectionRange(end, end);
  recompute();
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const add = parseInt(btn.dataset.add ?? "0", 10);
    const next = parseAmount(incomeInput.value) + add;
    incomeInput.value = formatAmountInput(next);
    recompute();
  });
});

btnDownload.addEventListener("click", () => {
  downloadCard(buildCard(), "nps-premium.png");
});

btnShare.addEventListener("click", async () => {
  await shareCard(buildCard(), "국민연금 보험료 계산 결과 - cal.jupocket.com");
});

btnCopy.addEventListener("click", async () => {
  const text = lastLines.map(([k, v]) => `${k} ${v}`).join(" / ");
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

recompute();
