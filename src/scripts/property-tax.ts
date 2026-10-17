import { housePage, LUMP_SUM_UNDER } from "../lib/property-tax";
import { formatWon, formatMan, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("property-tax");

let lastLines: [string, string][] = [];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const valueInput = $<HTMLInputElement>("standard-value");
const oneHomeToggle = $<HTMLInputElement>("one-home");
const urbanToggle = $<HTMLInputElement>("urban");

const heroValue = $("hero-value");
const note = $("split-note");

const btnDownload = $<HTMLButtonElement>("btn-download");
const btnShare = $<HTMLButtonElement>("btn-share");
const btnCopy = $<HTMLButtonElement>("btn-copy");
const copyToast = $("copy-toast");

const pct = (v: number, d = 3) => `${Number((v * 100).toFixed(d))}%`;

function recompute() {
  const standardValue = parseAmount(valueInput.value);
  const oneHome = oneHomeToggle.checked;
  const urban = urbanToggle.checked;
  const b = housePage({ standardValue, oneHome, urban });

  heroValue.textContent = formatWon(b.total);
  $("stat1-value").textContent = formatWon(b.base);
  $("stat2-value").textContent = standardValue ? pct(b.ratio, 0) : "—";
  $("stat3-value").textContent = formatWon(b.propertyTax);
  $("pt-urban").textContent = urban ? formatWon(b.urbanArea) : "0원 (해당 없음)";
  $("pt-edu").textContent = formatWon(b.educationTax);
  $("pt-half").textContent = formatWon(b.half);
  $("pt-eff").textContent = standardValue ? pct(b.effective) : "—";
  // 체크를 끈 사람에게도 "1주택이면 이만큼 준다"를 보여준다 — 자동완성 '재산세 1주택 감면'·'1주택 2주택 차이' 수요
  $("pt-saving-label").textContent = oneHome ? "1세대 1주택 특례로 줄어든 돈" : "1세대 1주택이면 줄어드는 돈";
  $("pt-saving").textContent = formatWon(b.oneHomeSaving);

  /*
   * 주택은 절반씩 두 번 온다. "한 해 얼마" 와 "이번 고지서 얼마" 를
   * 섞으면 독자가 두 배로 본다.
   */
  if (!standardValue) {
    note.textContent = "공시가격을 넣으세요.";
  } else if (!b.collected) {
    note.textContent = "재산세가 2천원 미만이라 징수하지 않습니다(지방세법 제119조).";
  } else if (b.lumpSum) {
    note.textContent = `주택분 세액이 ${formatMan(LUMP_SUM_UNDER)} 이하라, 조례에 따라 7월에 한꺼번에 올 수 있습니다.`;
  } else {
    note.textContent = `주택은 절반씩 두 번 옵니다 — 7월과 9월에 각각 ${formatWon(b.half)} 정도입니다.`;
  }

  lastLines = [
    ["시가표준액", formatWon(standardValue)],
    ["공정시장가액비율", pct(b.ratio, 0)],
    ["과세표준", formatWon(b.base)],
    ["재산세 본세", formatWon(b.propertyTax)],
    ...(urban ? ([["재산세 도시지역분", formatWon(b.urbanArea)]] as [string, string][]) : []),
    ["지방교육세", formatWon(b.educationTax)],
    ["고지서 합계", formatWon(b.total)],
    [oneHome ? "1세대 1주택 특례로 줄어든 돈" : "1세대 1주택이면 줄어드는 돈", formatWon(b.oneHomeSaving)],
  ];
  reportUse();
}

valueInput.addEventListener("input", () => {
  formatAmountInput(valueInput);
  recompute();
});
oneHomeToggle.addEventListener("change", recompute);
urbanToggle.addEventListener("change", recompute);

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
