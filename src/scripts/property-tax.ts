import { bill, halfInstallment, LUMP_SUM_UNDER, type Kind } from "../lib/property-tax";
import { formatWon, formatMan, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("property-tax");

let lastLines: [string, string][] = [];

const valueInput = document.getElementById("standard-value") as HTMLInputElement;
const oneHomeToggle = document.getElementById("one-home") as HTMLInputElement;
const urbanToggle = document.getElementById("urban") as HTMLInputElement;

const heroValue = document.getElementById("hero-value")!;
const stat1 = document.getElementById("stat1-value")!;
const stat2 = document.getElementById("stat2-value")!;
const stat3 = document.getElementById("stat3-value")!;
const breakdown = document.getElementById("breakdown")!;
const note = document.getElementById("split-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const presets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-value]");

const KIND: Kind = "house";

function recompute() {
  const standardValue = parseAmount(valueInput.value);
  const oneHome = oneHomeToggle.checked;
  const urban = urbanToggle.checked;
  const b = bill({ standardValue, kind: KIND, oneHome, urban });

  heroValue.textContent = formatWon(b.total);
  stat1.textContent = formatWon(b.base);
  stat2.textContent = `${(b.ratio * 100).toFixed(0)}%`;
  stat3.textContent = formatWon(b.propertyTax);

  /*
   * 항목을 나눠 보여주는 것이 이 계산기의 존재 이유다. "고지서가 계산기보다
   * 크다" 는 말이 나오는 이유가 도시지역분과 지방교육세이기 때문이다.
   */
  const rows: [string, number][] = [
    ["재산세 본세", b.propertyTax],
    ...(urban ? ([["재산세 도시지역분", b.urbanArea]] as [string, number][]) : []),
    ["지방교육세", b.educationTax],
  ];
  breakdown.innerHTML = rows
    .map(
      ([label, v]) =>
        `<div class="bd-row"><span class="bd-label">${label}</span><span class="bd-value">${formatWon(v)}</span></div>`,
    )
    .join("");

  /*
   * 주택은 절반씩 두 번 온다. "한 해 얼마" 와 "이번 고지서 얼마" 를
   * 섞으면 독자가 두 배로 본다.
   */
  if (!b.collected) {
    note.textContent =
      "재산세가 2천원 미만이라 징수하지 않습니다(지방세법 제119조).";
  } else if (b.propertyTax <= LUMP_SUM_UNDER) {
    note.textContent = `주택분 세액이 ${formatMan(LUMP_SUM_UNDER)} 이하라, 조례에 따라 7월에 한꺼번에 올 수 있습니다.`;
  } else {
    note.textContent = `주택은 절반씩 두 번 옵니다 — 7월과 9월에 각각 ${formatWon(halfInstallment(b.total))} 정도입니다.`;
  }

  lastLines = [
    ["시가표준액", formatWon(standardValue)],
    ["공정시장가액비율", `${(b.ratio * 100).toFixed(0)}%`],
    ["과세표준", formatWon(b.base)],
    ...rows.map(([l, v]) => [l, formatWon(v)] as [string, string]),
    ["고지서 합계", formatWon(b.total)],
  ];
  reportUse();
}

valueInput.addEventListener("input", () => {
  formatAmountInput(valueInput);
  recompute();
});
oneHomeToggle.addEventListener("change", recompute);
urbanToggle.addEventListener("change", recompute);

for (const chip of presets) {
  chip.addEventListener("click", () => {
    valueInput.value = Number(chip.dataset.value).toLocaleString("ko-KR");
    recompute();
    track("preset_click", { calculator: "property-tax", value: chip.dataset.value });
  });
}

const card = () =>
  renderCard({ title: "재산세 고지서 예상", hero: heroValue.textContent ?? "", lines: lastLines });

btnDownload.addEventListener("click", () => downloadCard(card(), "재산세.png"));
btnShare.addEventListener("click", () => shareCard(card(), "재산세.png"));
btnCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(
    lastLines.map(([k, v]) => `${k}: ${v}`).join("\n"),
  );
  copyToast.style.display = "";
  setTimeout(() => (copyToast.style.display = "none"), 2000);
});

recompute();
