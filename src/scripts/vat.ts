import { fromSupply, fromTotal, simplifiedTax } from "../lib/vat";
import vat from "../rates/vat-2026.json";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";

// 세 모드: 공급가액→합계(supply) / 합계→공급가액(total) / 간이과세(simple)
type Mode = "supply" | "total" | "simple";
let mode: Mode = "supply";

let lastLines: [string, string][] = [];
let lastTitle = "";

const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const rateRow = document.getElementById("rate-row")!;
const rateSelect = document.getElementById("vat-rate") as HTMLSelectElement;

const heroLabel = document.getElementById("hero-label")!;
const heroValue = document.getElementById("hero-value")!;
const stat1Label = document.getElementById("stat1-label")!;
const stat1Value = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2")!;
const stat2Label = document.getElementById("stat2-label")!;
const stat2Value = document.getElementById("stat2-value")!;

const tabSupply = document.getElementById("tab-supply") as HTMLButtonElement;
const tabTotal = document.getElementById("tab-total") as HTMLButtonElement;
const tabSimple = document.getElementById("tab-simple") as HTMLButtonElement;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;
const presetButtons =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-add]");

function compute() {
  const value = parseAmount(amountInput.value);

  if (mode === "supply") {
    const r = fromSupply(value);
    heroLabel.textContent = "합계금액 (공급대가)";
    heroValue.textContent = formatWon(r.total);
    stat1Label.textContent = "공급가액";
    stat1Value.textContent = formatWon(r.supply);
    stat2Label.textContent = "부가세 (10%)";
    stat2Value.textContent = formatWon(r.tax);
    stat2.hidden = false;
    lastTitle = "부가세 계산 결과 (공급가액 기준)";
    lastLines = [
      ["공급가액", formatWon(r.supply)],
      ["부가세(10%)", formatWon(r.tax)],
      ["합계금액", formatWon(r.total)],
    ];
  } else if (mode === "total") {
    const r = fromTotal(value);
    heroLabel.textContent = "공급가액";
    heroValue.textContent = formatWon(r.supply);
    stat1Label.textContent = "부가세 (10%)";
    stat1Value.textContent = formatWon(r.tax);
    stat2Label.textContent = "합계금액 (공급대가)";
    stat2Value.textContent = formatWon(r.total);
    stat2.hidden = false;
    lastTitle = "부가세 계산 결과 (합계금액 역산)";
    lastLines = [
      ["합계금액", formatWon(r.total)],
      ["공급가액", formatWon(r.supply)],
      ["부가세(10%)", formatWon(r.tax)],
    ];
  } else {
    const rate = parseFloat(rateSelect.value);
    const r = simplifiedTax(value, rate);
    const ratePercent = Math.round(rate * 100);
    heroLabel.textContent = "간이과세 납부세액";
    heroValue.textContent = formatWon(r.tax);
    stat1Label.textContent = "공급대가";
    stat1Value.textContent = formatWon(r.supplyValue);
    stat2.hidden = true;
    lastTitle = "간이과세 부가세 계산 결과";
    lastLines = [
      ["공급대가", formatWon(r.supplyValue)],
      [`업종 부가가치율`, `${ratePercent}%`],
      ["납부세액", formatWon(r.tax)],
    ];
  }
}

function setMode(next: Mode) {
  mode = next;
  tabSupply.setAttribute("aria-pressed", String(mode === "supply"));
  tabTotal.setAttribute("aria-pressed", String(mode === "total"));
  tabSimple.setAttribute("aria-pressed", String(mode === "simple"));

  if (mode === "supply") inputLabel.textContent = "공급가액";
  else if (mode === "total") inputLabel.textContent = "합계금액 (공급대가)";
  else inputLabel.textContent = "공급대가 (매출)";

  // 간이과세일 때만 업종(부가가치율) 선택을 보여준다.
  rateRow.hidden = mode !== "simple";
  compute();
}

function buildCard() {
  return renderCard({
    title: lastTitle,
    lines: lastLines,
    footer: "cal.jupocket.com",
  });
}

tabSupply.addEventListener("click", () => setMode("supply"));
tabTotal.addEventListener("click", () => setMode("total"));
tabSimple.addEventListener("click", () => setMode("simple"));
rateSelect.addEventListener("change", compute);

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
  downloadCard(buildCard(), "vat-result.png");
});

btnShare.addEventListener("click", async () => {
  await shareCard(buildCard(), "부가세 계산 결과 - cal.jupocket.com");
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

// 접근성: rates의 업종별 부가가치율을 select에 채운다(하드코딩 방지)
void vat;

compute();
