import { bill, type Cause } from "../lib/acquisition-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("acquisition-tax");
let lastLines: [string, string][] = [];

const priceInput = document.getElementById("price") as HTMLInputElement;
const causeSelect = document.getElementById("cause") as HTMLSelectElement;

const heroValue = document.getElementById("hero-value")!;
const stat1 = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2-value")!;
const stat3 = document.getElementById("stat3-value")!;
const note = document.getElementById("deadline-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const presets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-price]");

function recompute() {
  const price = parseAmount(priceInput.value);
  const cause = causeSelect.value as Cause;
  const b = bill({ price, cause });

  heroValue.textContent = formatWon(b.total);
  stat1.textContent = formatWon(b.acquisitionTax);
  stat2.textContent = formatWon(b.educationTax);
  stat3.textContent = `${(b.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
  note.textContent = `신고·납부 기한은 ${b.deadline}입니다. 고지서가 오지 않으니 직접 신고해야 합니다.`;

  lastLines = [
    ["취득가액", formatWon(price)],
    ["취득 원인", causeSelect.options[causeSelect.selectedIndex].text],
    ["세율", `${(b.rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`],
    ["취득세", formatWon(b.acquisitionTax)],
    ["지방교육세", formatWon(b.educationTax)],
    ["합계", formatWon(b.total)],
  ];
  reportUse();
}

priceInput.addEventListener("input", () => {
  formatAmountInput(priceInput);
  recompute();
});
causeSelect.addEventListener("change", () => {
  recompute();
  track("select_change", { calculator: "acquisition-tax", value: causeSelect.value });
});

for (const chip of presets) {
  chip.addEventListener("click", () => {
    priceInput.value = Number(chip.dataset.price).toLocaleString("ko-KR");
    recompute();
    track("preset_click", { calculator: "acquisition-tax", value: chip.dataset.price });
  });
}

const card = () =>
  renderCard({ title: "취득세 예상", hero: heroValue.textContent ?? "", lines: lastLines });

btnDownload.addEventListener("click", () => downloadCard(card(), "취득세.png"));
btnShare.addEventListener("click", () => shareCard(card(), "취득세.png"));
btnCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(lastLines.map(([k, v]) => `${k}: ${v}`).join("\n"));
  copyToast.style.display = "";
  setTimeout(() => (copyToast.style.display = "none"), 2000);
});

recompute();
