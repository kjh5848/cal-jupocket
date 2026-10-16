import { compute } from "../lib/pension-premium";
import pp from "../rates/pension-premium-2026.json";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("national_pension");

let lastLines: [string, string][] = [];

const RATE_LABEL = `월 보험료(${pp.rate * 100}%)`;
const man = (n: number) => `${(n / 10_000).toLocaleString("ko-KR")}만원`;

const incomeInput = document.getElementById("income") as HTMLInputElement;
const heroValue = document.getElementById("hero-value")!;
const outStd = document.getElementById("out-std")!;
const outMonthly = document.getElementById("out-monthly")!;
const outLeft = document.getElementById("out-left")!;
const outAnnual = document.getElementById("out-annual")!;
const capNote = document.getElementById("cap-note")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;

function recompute() {
  const r = compute(parseAmount(incomeInput.value));
  heroValue.textContent = formatWon(r.monthly);
  outStd.textContent = formatWon(r.standardIncome);
  outMonthly.textContent = formatWon(r.monthly);
  outLeft.textContent = formatWon(Math.max(0, r.income - r.monthly));
  outAnnual.textContent = formatWon(r.annual);

  if (r.capped) {
    capNote.textContent = `소득이 상한(${man(pp.standardIncomeCeiling)})을 넘어 기준소득월액이 상한으로 조정됐습니다.`;
    capNote.style.display = "block";
  } else if (r.floored && r.income > 0) {
    capNote.textContent = `소득이 하한(${man(pp.standardIncomeFloor)})보다 낮아 기준소득월액이 하한으로 조정됐습니다.`;
    capNote.style.display = "block";
  } else {
    capNote.style.display = "none";
  }

  lastLines = [
    ["월소득", formatWon(r.income)],
    ["기준소득월액", formatWon(r.standardIncome)],
    [RATE_LABEL, formatWon(r.monthly)],
    ["연 보험료", formatWon(r.annual)],
  ];
}

function buildCard() {
  return renderCard({
    title: "국민연금 보험료 (지역가입자)",
    lines: lastLines,
    footer: "jupocket.com",
  });
}

incomeInput.addEventListener("input", () => {
  const value = parseAmount(incomeInput.value);
  reportUse(value);
  incomeInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = incomeInput.value.length;
  incomeInput.setSelectionRange(end, end);
  recompute();
});

btnDownload.addEventListener("click", () => {
  track("save_result", { calculator: "national_pension" });
  downloadCard(buildCard(), "nps-premium.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "national_pension" });
  await shareCard(buildCard(), "국민연금 보험료 계산 결과 - jupocket.com");
});

recompute();
