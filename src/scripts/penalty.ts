import { computeLateFiling, daysBetween, periodEnd, penaltyRates as p } from "../lib/penalty";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("penalty");

let lastLines: [string, string][] = [];

const NO_REPORT_PCT = Math.round(p.noReport.general * 100);
const DAILY_PCT = Math.round(p.latePayment.dailyRate * 100_000) / 1000; // 0.022

const taxInput = document.getElementById("tax") as HTMLInputElement;
const deadlineInput = document.getElementById("deadline") as HTMLInputElement;
const filedInput = document.getElementById("filed-on") as HTMLInputElement;
const heroValue = document.getElementById("hero-value")!;
const stat1Label = document.getElementById("stat1-label")!;
const stat1Value = document.getElementById("stat1-value")!;
const stat2Label = document.getElementById("stat2-label")!;
const stat2Value = document.getElementById("stat2-value")!;
const statTax = document.getElementById("stat-tax")!;
const stat3Value = document.getElementById("stat3-value")!;
const reliefNote = document.getElementById("relief-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;

const monthPresets = document.querySelectorAll<HTMLButtonElement>(".preset-chip[data-months]");

/** "2026-07-01" → "7월 1일" (해가 다르면 연도도) */
function md(date: string, base: string): string {
  const y = date.slice(0, 4) === base.slice(0, 4) ? "" : `${date.slice(0, 4)}년 `;
  return `${y}${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일`;
}

/** 오늘(사용자 시간대) "YYYY-MM-DD" */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function recompute() {
  const tax = parseAmount(taxInput.value);
  const deadline = deadlineInput.value;
  const filedOn = filedInput.value;
  const r = computeLateFiling({ tax, deadline, filedOn });

  heroValue.textContent = formatWon(r.total);
  stat1Label.textContent = `무신고가산세 (${NO_REPORT_PCT}%, 감면 ${Math.round(r.reliefRate * 100)}%)`;
  stat1Value.textContent = formatWon(r.noReport);
  stat2Label.textContent = `납부지연가산세 (${r.lateDays}일 × ${DAILY_PCT}%)`;
  stat2Value.textContent = formatWon(r.latePayment);
  statTax.textContent = formatWon(tax);
  stat3Value.textContent = formatWon(r.total);

  // 감면이 계단식이라 "며칠까지인지" 가 이 계산기에서 가장 쓸모 있는 한 줄이다.
  if (!deadline || !filedOn || tax <= 0) {
    reliefNote.textContent = "";
  } else if (r.daysLate === 0) {
    // 기한 내 신고는 가산세가 아예 없다. 감면 안내를 띄우면 거짓말이 된다.
    reliefNote.textContent = "기한 안에 신고·납부하는 날이라 가산세가 없습니다. 세액만 납부하면 됩니다.";
  } else if (r.reliefExpired) {
    reliefNote.textContent =
      `기한 후 ${r.daysLate}일째 — 6개월이 지나 무신고가산세 감면은 끝났습니다. 납부지연가산세는 매일 늘어나므로 그래도 빨리 신고하는 쪽이 적게 냅니다.`;
  } else {
    const pct = Math.round(r.reliefRate * 100);
    const until = r.reliefUntil!;
    const left = daysBetween(filedOn, until);
    reliefNote.textContent =
      `기한 후 ${r.daysLate}일째 — 무신고가산세의 ${pct}%가 감면됩니다. ` +
      (left === 0
        ? "이 감면율은 이날이 마지막입니다."
        : `이 감면율은 ${md(until, deadline)}까지(${left}일 더)입니다.`);
  }

  lastLines = [
    ["신고했어야 할 세액", formatWon(tax)],
    ["기한 · 신고일", `${deadline} · ${filedOn}`],
    [`무신고가산세 (감면 ${Math.round(r.reliefRate * 100)}%)`, formatWon(r.noReport)],
    [`납부지연가산세 (${r.lateDays}일)`, formatWon(r.latePayment)],
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

for (const el of [deadlineInput, filedInput]) {
  el.addEventListener("input", () => {
    reportUse(parseAmount(taxInput.value));
    recompute();
  });
}

monthPresets.forEach((btn) => {
  btn.addEventListener("click", () => {
    track("preset_click", { calculator: "penalty" });
    if (!deadlineInput.value) return;
    filedInput.value = periodEnd(deadlineInput.value, Number(btn.dataset.months));
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

// "지금 신고하면" 이 기본 질문이다 — 오늘이 기한 뒤 1년 안이면 오늘로 둔다.
const t = today();
const sinceDeadline = daysBetween(deadlineInput.value, t);
if (sinceDeadline > 0 && sinceDeadline <= 366) filedInput.value = t;

recompute();
