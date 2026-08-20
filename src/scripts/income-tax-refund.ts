import { estimateRefund } from "../lib/income-tax";
import {
  formatWon,
  parseAmount,
  formatAmountInput,
  currentValueOrDefault,
} from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";

const DEFAULT_GROSS_INCOME = 30000000;
const DEFAULT_EXPENSE_RATE_PERCENT = 60;
const DEFAULT_DEPENDENTS = 1;

let lastResult: {
  grossIncome: number;
  expenseRatePercent: number;
  dependents: number;
  taxableBase: number;
  computedTax: number;
  prepaid: number;
  refund: number;
} = {
  grossIncome: 0,
  expenseRatePercent: 0,
  dependents: 1,
  taxableBase: 0,
  computedTax: 0,
  prepaid: 0,
  refund: 0,
};

const amountInput = document.getElementById("amount") as HTMLInputElement;
const expenseRateInput = document.getElementById(
  "expense-rate",
) as HTMLInputElement;
const dependentsInput = document.getElementById(
  "dependents",
) as HTMLInputElement;
const resultLabel = document.getElementById("result-label")!;
const outRefund = document.getElementById("out-refund")!;
const extraPaymentWarn = document.getElementById("extra-payment-warn")!;
const outTaxableBase = document.getElementById("out-taxable-base")!;
const outComputedTax = document.getElementById("out-computed-tax")!;
const outPrepaid = document.getElementById("out-prepaid")!;
const btnDownload = document.getElementById("btn-download") as HTMLButtonElement;
const btnShare = document.getElementById("btn-share") as HTMLButtonElement;
const btnCopy = document.getElementById("btn-copy") as HTMLButtonElement;
const copyToast = document.getElementById("copy-toast")!;
const btnRateDefault = document.getElementById(
  "btn-rate-default",
) as HTMLButtonElement;
const presetButtons = document.querySelectorAll<HTMLButtonElement>(
  ".preset-chip[data-add]",
);

function clampExpenseRatePercent(raw: string): number {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function clampDependents(raw: string): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}

function compute() {
  const grossIncome = parseAmount(amountInput.value);
  const expenseRatePercent = clampExpenseRatePercent(expenseRateInput.value);
  const dependents = clampDependents(dependentsInput.value);

  const r = estimateRefund({
    grossIncome,
    expenseRate: expenseRatePercent / 100,
    dependents,
  });

  lastResult = { grossIncome, expenseRatePercent, dependents, ...r };

  if (r.refund >= 0) {
    resultLabel.textContent = "💰 환급 예상액";
    extraPaymentWarn.style.display = "none";
  } else {
    resultLabel.textContent = "⚠️ 추가납부 예상액";
    extraPaymentWarn.style.display = "block";
  }
  outRefund.textContent = formatWon(Math.abs(r.refund));
  outTaxableBase.textContent = formatWon(r.taxableBase);
  outComputedTax.textContent = formatWon(r.computedTax);
  outPrepaid.textContent = formatWon(r.prepaid);
}

function buildCard() {
  const statusLabel = lastResult.refund >= 0 ? "환급 예상액" : "추가납부 예상액";
  return renderCard({
    title: `종소세 ${statusLabel} (총수입 ${formatWon(lastResult.grossIncome)}, 경비율 ${lastResult.expenseRatePercent}%)`,
    lines: [
      [statusLabel, formatWon(Math.abs(lastResult.refund))],
      ["과세표준", formatWon(lastResult.taxableBase)],
      ["결정세액", formatWon(lastResult.computedTax)],
      ["기납부세액(3.3%)", formatWon(lastResult.prepaid)],
    ],
    footer: "cal.jupocket.com",
  });
}

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

expenseRateInput.addEventListener("input", () => {
  compute();
});

btnRateDefault.addEventListener("click", () => {
  expenseRateInput.value = String(DEFAULT_EXPENSE_RATE_PERCENT);
  compute();
});

dependentsInput.addEventListener("input", () => {
  compute();
});

btnDownload.addEventListener("click", () => {
  downloadCard(buildCard(), "income-tax-refund-result.png");
});

btnShare.addEventListener("click", async () => {
  const statusLabel = lastResult.refund >= 0 ? "환급 예상액" : "추가납부 예상액";
  await shareCard(
    buildCard(),
    `종합소득세 ${statusLabel} ${formatWon(Math.abs(lastResult.refund))} - cal.jupocket.com`,
  );
});

btnCopy.addEventListener("click", async () => {
  const statusLabel = lastResult.refund >= 0 ? "환급 예상액" : "추가납부 예상액";
  const text = `총수입 ${formatWon(lastResult.grossIncome)} / 경비율 ${lastResult.expenseRatePercent}% / 인적공제 ${lastResult.dependents}명 / 과세표준 ${formatWon(
    lastResult.taxableBase,
  )} / 결정세액 ${formatWon(lastResult.computedTax)} / 기납부세액 ${formatWon(
    lastResult.prepaid,
  )} / ${statusLabel} ${formatWon(Math.abs(lastResult.refund))}`;
  if (!navigator.clipboard) return;
  await navigator.clipboard.writeText(text);
  copyToast.style.display = "block";
  setTimeout(() => {
    copyToast.style.display = "none";
  }, 1800);
});

// 초기값 정규화 후 첫 계산
amountInput.value = currentValueOrDefault(amountInput.value, DEFAULT_GROSS_INCOME);
dependentsInput.value = String(clampDependents(dependentsInput.value || String(DEFAULT_DEPENDENTS)));
compute();
