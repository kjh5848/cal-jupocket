import { computeLateFiling, daysUntilReliefDrops } from "../lib/penalty";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("penalty");

let lastLines: [string, string][] = [];

const taxInput = document.getElementById("tax") as HTMLInputElement;
const daysInput = document.getElementById("days") as HTMLInputElement;
const heroValue = document.getElementById("hero-value")!;
const stat1Value = document.getElementById("stat1-value")!;
const stat2Value = document.getElementById("stat2-value")!;
const stat3Value = document.getElementById("stat3-value")!;
const reliefNote = document.getElementById("relief-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;

const amountPresets =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-add]");
const dayPresets =
  document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-days]");

const days = () => Math.max(0, Math.floor(parseAmount(daysInput.value)));

function recompute() {
  const tax = parseAmount(taxInput.value);
  const d = days();
  const r = computeLateFiling({ tax, daysLate: d });

  heroValue.textContent = formatWon(r.total);
  stat1Value.textContent = formatWon(r.noReport);
  stat2Value.textContent = formatWon(r.latePayment);
  stat3Value.textContent = formatWon(r.grandTotal);

  // 감면이 계단식이라 "며칠 남았는지" 가 이 계산기에서 가장 쓸모 있는 한 줄이다.
  if (tax <= 0) {
    reliefNote.textContent = "";
  } else if (d === 0) {
    // 기한 내 신고는 가산세가 아예 없다. 감면 안내를 띄우면 거짓말이 된다.
    reliefNote.textContent = "기한 내 신고라 가산세가 없습니다. 세액만 납부하면 됩니다.";
  } else if (r.reliefExpired) {
    reliefNote.textContent =
      "6개월이 지나 무신고가산세 감면은 끝났습니다. 납부지연가산세는 매일 늘어나므로 그래도 빨리 신고하는 쪽이 적게 냅니다.";
  } else {
    const left = daysUntilReliefDrops(d);
    const pct = Math.round(r.reliefRate * 100);
    // 경계 당일이면 "0일 뒤" 가 아니라 "오늘이 마지막" 이다.
    reliefNote.textContent =
      left === null
        ? ""
        : left === 0
          ? `지금 신고하면 무신고가산세의 ${pct}%가 감면됩니다. 오늘이 이 감면율의 마지막 날입니다.`
          : `지금 신고하면 무신고가산세의 ${pct}%가 감면됩니다. ${left}일 뒤부터는 감면율이 내려갑니다.`;
  }

  lastLines = [
    ["신고했어야 할 세액", formatWon(tax)],
    ["지난 일수", `${d}일`],
    ["무신고가산세", formatWon(r.noReport)],
    ["납부지연가산세", formatWon(r.latePayment)],
    ["가산세 합계", formatWon(r.total)],
    ["세금 + 가산세", formatWon(r.grandTotal)],
  ];
}

function buildCard() {
  return renderCard({
    title: "기한 후 신고 가산세",
    lines: lastLines,
    footer: "jupocket.com",
  });
}

taxInput.addEventListener("input", () => {
  reportUse(parseAmount(taxInput.value));
  const value = parseAmount(taxInput.value);
  taxInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = taxInput.value.length;
  taxInput.setSelectionRange(end, end);
  recompute();
});

daysInput.addEventListener("input", () => {
  reportUse(parseAmount(taxInput.value));
  const v = parseAmount(daysInput.value);
  daysInput.value = v === 0 ? "" : String(v);
  recompute();
});

amountPresets.forEach((btn) => {
  btn.addEventListener("click", () => {
    track("preset_click", { calculator: "penalty" });
    const add = Number(btn.dataset.add ?? 0);
    taxInput.value = formatAmountInput(parseAmount(taxInput.value) + add);
    recompute();
  });
});

dayPresets.forEach((btn) => {
  btn.addEventListener("click", () => {
    track("preset_click", { calculator: "penalty" });
    daysInput.value = String(btn.dataset.days ?? 0);
    recompute();
  });
});

btnDownload.addEventListener("click", () => {
  track("save_result", { calculator: "penalty" });
  downloadCard(buildCard(), "penalty.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "penalty" });
  await shareCard(buildCard(), "기한 후 신고 가산세 계산 결과 - jupocket.com");
});

btnCopy.addEventListener("click", async () => {
  track("copy_result", { calculator: "penalty" });
  const text = lastLines.map(([k, v]) => `${k} ${v}`).join(" / ");
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

recompute();
