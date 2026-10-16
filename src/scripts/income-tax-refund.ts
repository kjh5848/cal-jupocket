import { estimateRefund } from "../lib/income-tax";
import { formatWon, parseAmount, formatAmountInput, currentValueOrDefault } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("income_tax_refund");

const DEFAULT_GROSS_INCOME = 30000000;

type Result = ReturnType<typeof estimateRefund> & {
  grossIncome: number;
  expenseRatePercent: number;
  dependents: number;
};
let last: Result | null = null;

const $ = (id: string) => document.getElementById(id)!;
const amountInput = $("amount") as HTMLInputElement;
const expenseRateInput = $("expense-rate") as HTMLInputElement;
const dependentsInput = $("dependents") as HTMLInputElement;
const hero = document.querySelector<HTMLElement>(".result-hero")!;
const extraPaymentWarn = $("extra-payment-warn");

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

/** 환급이면 "환급", 추가납부면 "추가납부" — 금액은 절대값으로 보여 준다. */
const verb = (n: number) => (n >= 0 ? "환급" : "추가납부");

function compute() {
  const grossIncome = parseAmount(amountInput.value);
  const expenseRatePercent = clampExpenseRatePercent(expenseRateInput.value);
  const dependents = clampDependents(dependentsInput.value);
  const r = estimateRefund({ grossIncome, expenseRate: expenseRatePercent / 100, dependents });
  last = { ...r, grossIncome, expenseRatePercent, dependents };

  const refund = r.refund >= 0;
  $("result-label").textContent = refund ? "💰 환급 예상액 (지방소득세 포함)" : "⚠️ 추가납부 예상액 (지방소득세 포함)";
  extraPaymentWarn.style.display = refund ? "none" : "block";
  // '실제 세금 | 돌려받는 돈' 막대는 환급일 때만 뜻이 있다
  hero.querySelectorAll<HTMLElement>(".ux-bar, .ux-legend").forEach((el) => (el.hidden = !refund));

  $("out-refund").textContent = formatWon(Math.abs(r.refund));
  $("out-taxable-base").textContent = formatWon(r.taxableBase);
  $("out-computed-tax").textContent = formatWon(r.computedTax);
  $("out-local-tax").textContent = formatWon(r.localTax);
  $("out-prepaid-national").textContent = formatWon(r.prepaidNational);
  $("out-prepaid-local").textContent = formatWon(r.prepaidLocal);
  $("label-refund-national").textContent = `소득세 ${verb(r.refundNational)}`;
  $("out-refund-national").textContent = formatWon(Math.abs(r.refundNational));
  $("label-refund-local").textContent = `지방소득세 ${verb(r.refundLocal)}`;
  $("out-refund-local").textContent = formatWon(Math.abs(r.refundLocal));
}

function buildCard() {
  const r = last!;
  const status = `${verb(r.refund)} 예상액`;
  return renderCard({
    title: `종소세 ${status} (총수입 ${formatWon(r.grossIncome)}, 경비율 ${r.expenseRatePercent}%)`,
    lines: [
      [status, formatWon(Math.abs(r.refund))],
      ["과세표준", formatWon(r.taxableBase)],
      ["결정세액 (지방소득세 포함)", formatWon(r.totalTax)],
      ["미리 낸 세금 (3.3%)", formatWon(r.prepaid)],
    ],
    footer: "jupocket.com",
  });
}

amountInput.addEventListener("input", () => {
  const value = parseAmount(amountInput.value);
  reportUse(value);
  amountInput.value = value === 0 ? "" : formatAmountInput(value);
  const end = amountInput.value.length;
  amountInput.setSelectionRange(end, end);
  compute();
});
expenseRateInput.addEventListener("input", compute);
dependentsInput.addEventListener("input", compute);
dependentsInput.addEventListener("change", compute);

$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "income_tax_refund" });
  downloadCard(buildCard(), "income-tax-refund-result.png");
});

$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "income_tax_refund" });
  const r = last!;
  await shareCard(buildCard(), `종합소득세 ${verb(r.refund)} 예상액 ${formatWon(Math.abs(r.refund))} - jupocket.com`);
});

// 초기값 정규화 후 첫 계산
amountInput.value = currentValueOrDefault(amountInput.value, DEFAULT_GROSS_INCOME);
dependentsInput.value = String(clampDependents(dependentsInput.value || "1"));
compute();
