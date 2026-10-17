import { bill, carAge, LUMP_SUM_UNDER, TAX_YEAR, type StartHalf } from "../lib/vehicle-tax";
import { formatWon, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("vehicle-tax");
let lastLines: [string, string][] = [];

const ccInput = document.getElementById("cc") as HTMLInputElement;
const yearInput = document.getElementById("start-year") as HTMLInputElement;
const halfInput = document.getElementById("start-half") as HTMLSelectElement;

const heroValue = document.getElementById("hero-value")!;
const stat1 = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2-value")!;
const stat3 = document.getElementById("stat3-value")!;
const note = document.getElementById("split-note")!;
const ageOut = document.getElementById("vt-age")!;
const baseOut = document.getElementById("vt-base")!;
const cutOut = document.getElementById("vt-cut")!;
const h1Out = document.getElementById("vt-h1")!;
const h2Out = document.getElementById("vt-h2")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const ccPresets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-cc]");

const pct = (r: number) => `${Math.round(r * 100)}%`;

function recompute() {
  const cc = Math.max(0, Math.floor(parseAmount(ccInput.value)));
  const startYear = Math.floor(Number(yearInput.value)) || TAX_YEAR;
  const half: StartHalf = halfInput.value === "second" ? "second" : "first";
  // 기분별 차령 — 지방세법 시행령 제122조 ②(7~12월 기산이면 6월분이 한 해 적다)
  const ages = carAge(startYear, half);
  const b = bill({ cc, ages });
  const same = ages.first === ages.second;

  heroValue.textContent = formatWon(b.total);
  stat1.textContent = formatWon(b.vehicleTax);
  stat2.textContent = formatWon(b.educationTax);
  stat3.textContent =
    b.halfRates[0] === b.halfRates[1] ? pct(b.halfRates[0]) : `${pct(b.halfRates[0])} · ${pct(b.halfRates[1])}`;
  ageOut.textContent = same ? `${ages.first}년` : `${ages.first}년 · ${ages.second}년`;
  baseOut.textContent = formatWon(b.baseYearly);
  cutOut.textContent = formatWon(b.baseYearly - b.vehicleTax);
  // 자동차세 10만원 이하면 6월에 한 번에(제128조 ④)
  h1Out.textContent = formatWon(b.lumpSum ? b.total : b.halves[0]);
  h2Out.textContent = formatWon(b.lumpSum ? 0 : b.halves[1]);

  if (b.lumpSum) {
    note.textContent = `자동차세가 ${formatWon(LUMP_SUM_UNDER)} 이하라 6월에 한 번에 올 수 있습니다. 그러면 12월 고지서가 없습니다.`;
  } else if (!same) {
    note.textContent = `7~12월에 기산한 차라 6월분 차령이 한 해 적습니다 — 6월 ${formatWon(b.halves[0])}, 12월 ${formatWon(b.halves[1])}.`;
  } else {
    note.textContent = `6월과 12월에 ${formatWon(b.halves[0])}씩 나뉘어 옵니다.`;
  }

  lastLines = [
    ["배기량", `${cc.toLocaleString("ko-KR")}cc`],
    ["차령 기산", `${startYear}년 ${half === "first" ? "1~6월" : "7~12월"}`],
    ["차령 (6월분 · 12월분)", ageOut.textContent],
    ["감면 전 자동차세", formatWon(b.baseYearly)],
    ["차령 감면", stat3.textContent],
    ["자동차세", formatWon(b.vehicleTax)],
    ["지방교육세", formatWon(b.educationTax)],
    ["6월분", h1Out.textContent],
    ["12월분", h2Out.textContent],
    [`${TAX_YEAR}년 합계`, formatWon(b.total)],
  ];
  reportUse();
}

ccInput.addEventListener("input", recompute);
yearInput.addEventListener("input", recompute);
halfInput.addEventListener("change", recompute);

for (const chip of ccPresets) {
  chip.addEventListener("click", () => {
    ccInput.value = String(chip.dataset.cc);
    recompute();
    track("preset_click", { calculator: "vehicle-tax", value: chip.dataset.cc });
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
