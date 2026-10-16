import { fromSupply, fromTotal, simplifiedTax } from "../lib/vat";
import vat from "../rates/vat-2026.json";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("vat");

// 세 모드: 공급가액→합계(supply) / 합계→공급가액(total) / 간이과세(simple)
type Mode = "supply" | "total" | "simple";
let mode: Mode = "supply";

let lastLines: [string, string][] = [];
let lastTitle = "";

const RATE_LABEL = `부가세 (${Math.round(vat.standardRate * 100)}%)`;

const modeSelect = document.getElementById("mode") as HTMLSelectElement;
const amountInput = document.getElementById("amount") as HTMLInputElement;
const inputLabel = document.getElementById("input-label")!;
const rateRow = document.getElementById("rate-row")!;
const rateSelect = document.getElementById("vat-rate") as HTMLSelectElement;
const hero = document.querySelector<HTMLElement>(".result-hero")!;

const heroLabel = document.getElementById("hero-label")!;
const heroValue = document.getElementById("hero-value")!;
const supplyLabel = document.getElementById("supply-label")!;
const outSupply = document.getElementById("out-supply")!;
const taxLabel = document.getElementById("tax-label")!;
const outTax = document.getElementById("out-tax")!;
const totalLabel = document.getElementById("total-label")!;
const outTotal = document.getElementById("out-total")!;

const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;

function compute() {
  const value = parseAmount(amountInput.value);
  // 공급가액·부가세 막대는 일반과세에서만 뜻이 있다(간이과세 공급대가는 부가세를 품은 금액)
  hero.querySelectorAll<HTMLElement>(".ux-bar, .ux-legend").forEach((el) => (el.hidden = mode === "simple"));

  if (mode === "simple") {
    const rate = parseFloat(rateSelect.value);
    const r = simplifiedTax(value, rate);
    const ratePercent = `${Math.round(rate * 100)}%`;
    heroLabel.textContent = "간이과세 납부세액";
    heroValue.textContent = formatWon(r.tax);
    supplyLabel.textContent = "공급대가 (매출)";
    outSupply.textContent = formatWon(r.supplyValue);
    taxLabel.textContent = "납부세액";
    outTax.textContent = formatWon(r.tax);
    totalLabel.textContent = "업종 부가가치율";
    outTotal.textContent = ratePercent;
    lastTitle = "간이과세 부가세 계산 결과";
    lastLines = [
      ["공급대가", formatWon(r.supplyValue)],
      ["업종 부가가치율", ratePercent],
      ["납부세액", formatWon(r.tax)],
    ];
    return;
  }

  const r = mode === "supply" ? fromSupply(value) : fromTotal(value);
  // 큰 숫자는 구하려던 값 — 공급가액을 넣으면 합계, 합계를 넣으면 공급가액
  heroLabel.textContent = mode === "supply" ? "합계금액 (공급대가)" : "공급가액";
  heroValue.textContent = formatWon(mode === "supply" ? r.total : r.supply);
  supplyLabel.textContent = "공급가액";
  outSupply.textContent = formatWon(r.supply);
  taxLabel.textContent = RATE_LABEL;
  outTax.textContent = formatWon(r.tax);
  totalLabel.textContent = "합계금액 (공급대가)";
  outTotal.textContent = formatWon(r.total);
  lastTitle = mode === "supply" ? "부가세 계산 결과 (공급가액 기준)" : "부가세 계산 결과 (합계금액 역산)";
  lastLines = [
    ["공급가액", formatWon(r.supply)],
    [RATE_LABEL.replace(" ", ""), formatWon(r.tax)],
    ["합계금액", formatWon(r.total)],
  ];
}

function setMode(next: Mode) {
  mode = next;
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
    footer: "jupocket.com",
  });
}

modeSelect.addEventListener("change", () => {
  const v = modeSelect.value;
  setMode(v === "total" ? "total" : v === "simple" ? "simple" : "supply");
});
rateSelect.addEventListener("change", compute);

amountInput.addEventListener("input", () => {
  reportUse(parseAmount(amountInput.value));
  const value = parseAmount(amountInput.value);
  amountInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = amountInput.value.length;
  amountInput.setSelectionRange(end, end);
  compute();
});

btnDownload.addEventListener("click", () => {
  track("save_result", { calculator: "vat" });
  downloadCard(buildCard(), "vat-result.png");
});

btnShare.addEventListener("click", async () => {
  track("share_result", { calculator: "vat" });
  await shareCard(buildCard(), "부가세 계산 결과 - jupocket.com");
});

compute();
