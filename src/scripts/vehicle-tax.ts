import { bill, ageDiscountRate, LUMP_SUM_UNDER } from "../lib/vehicle-tax";
import { formatWon, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("vehicle-tax");
let lastLines: [string, string][] = [];

const ccInput = document.getElementById("cc") as HTMLInputElement;
const ageInput = document.getElementById("age") as HTMLInputElement;

const heroValue = document.getElementById("hero-value")!;
const stat1 = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2-value")!;
const stat3 = document.getElementById("stat3-value")!;
const note = document.getElementById("split-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const ccPresets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-cc]");
const agePresets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-age]");

function recompute() {
  const cc = Math.max(0, Math.floor(parseAmount(ccInput.value)));
  const ageYears = Math.max(0, Math.floor(parseAmount(ageInput.value)));
  const b = bill({ cc, ageYears });

  heroValue.textContent = formatWon(b.total);
  stat1.textContent = formatWon(b.vehicleTax);
  stat2.textContent = formatWon(b.educationTax);
  stat3.textContent = `${(b.discountRate * 100).toFixed(0)}%`;

  if (b.lumpSum) {
    note.textContent = `연세액이 ${formatWon(LUMP_SUM_UNDER)} 이하라 6월에 한 번에 올 수 있습니다. 그러면 12월 고지서가 없습니다.`;
  } else {
    note.textContent = `6월과 12월에 각각 ${formatWon(b.perHalf)} 정도로 나뉘어 옵니다.`;
  }

  lastLines = [
    ["배기량", `${cc.toLocaleString("ko-KR")}cc`],
    ["차령", `${ageYears}년`],
    ["감면 전 연세액", formatWon(b.baseYearly)],
    ["차령 감면", `${(b.discountRate * 100).toFixed(0)}%`],
    ["자동차세", formatWon(b.vehicleTax)],
    ["지방교육세", formatWon(b.educationTax)],
    ["한 해 합계", formatWon(b.total)],
  ];
  reportUse();
}

ccInput.addEventListener("input", recompute);
ageInput.addEventListener("input", recompute);

for (const chip of ccPresets) {
  chip.addEventListener("click", () => {
    ccInput.value = String(chip.dataset.cc);
    recompute();
    track("preset_click", { calculator: "vehicle-tax", value: chip.dataset.cc });
  });
}
for (const chip of agePresets) {
  chip.addEventListener("click", () => {
    ageInput.value = String(chip.dataset.age);
    recompute();
  });
}

const card = () =>
  renderCard({ title: "자동차세 예상", hero: heroValue.textContent ?? "", lines: lastLines });

btnDownload.addEventListener("click", () => downloadCard(card(), "자동차세.png"));
btnShare.addEventListener("click", () => shareCard(card(), "자동차세.png"));
btnCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(lastLines.map(([k, v]) => `${k}: ${v}`).join("\n"));
  copyToast.style.display = "";
  setTimeout(() => (copyToast.style.display = "none"), 2000);
});

recompute();
