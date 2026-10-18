/**
 * 중도상환수수료 계산기 — /guide/prepayment-fee-calculator/.
 * 계산은 src/lib/prepayment-fee.ts prepaymentFee() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { prepaymentFee, LEGAL_YEARS, type PrepaymentError } from "../lib/prepayment-fee";
import { toDay, fromDay } from "../lib/date-calc";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("prepayment-fee");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("pf-amount");
const rate = $<HTMLInputElement>("pf-rate");
const start = $<HTMLInputElement>("pf-start");
const maturity = $<HTMLInputElement>("pf-maturity");
const pay = $<HTMLInputElement>("pf-pay");
const days = (n: number) => `${n.toLocaleString("ko-KR")}일`;

const WARN: Record<PrepaymentError, string> = {
  "pay-before-start": "갚는 날이 대출 실행일보다 앞입니다. 날짜를 확인하세요.",
  "maturity-before-start": "만기일이 실행일과 같거나 앞입니다. 날짜를 확인하세요.",
  "pay-after-maturity": "갚는 날이 만기 뒤입니다. 만기에 갚는 것은 중도상환이 아니라 수수료가 없습니다.",
};

function render() {
  const A = parseAmount(amount.value);
  const pct = Math.min(5, Math.max(0, Number(rate.value) || 0));
  const s = toDay(start.value);
  const p = toDay(pay.value);
  const warn = $("pf-warn");
  if (s === null || p === null) {
    warn.textContent = "실행일과 갚는 날을 넣으세요.";
    warn.hidden = false;
    return;
  }
  const x = prepaymentFee({ amount: A, ratePct: pct, start: s, maturity: toDay(maturity.value), payDate: p });

  $("pf-hero").textContent = formatWon(x.fee);
  $("pf-note").textContent =
    x.fee > 0
      ? `갚는 원금의 ${(x.ratio * 100).toFixed(3)}% · 30일 더 있다 갚으면 ${formatWon(x.saving30)} 줄어듭니다`
      : x.error
        ? "날짜를 확인하세요"
        : `${fromDay(x.windowEnd)}부터는 수수료가 없습니다`;
  $("pf-p").textContent = formatWon(A);
  $("pf-fee").textContent = formatWon(x.fee);
  $("pf-end").textContent = fromDay(x.windowEnd);
  $("pf-window").textContent = days(x.windowDays);
  $("pf-used").textContent = days(x.error ? 0 : x.windowDays - x.daysLeft);
  $("pf-left").textContent = days(x.daysLeft);
  $("pf-formula").textContent = `${formatWon(A)} × ${pct}% × ${days(x.daysLeft)} ÷ ${days(x.windowDays)} = ${formatWon(x.fee)}${x.endsAtMaturity ? ` (만기가 ${LEGAL_YEARS}년보다 일러 만기까지가 부과기간)` : ""}`;
  warn.textContent = x.error ? WARN[x.error] : "";
  warn.hidden = !x.error;
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

amount.addEventListener("input", () => {
  const v = parseAmount(amount.value);
  amount.value = v ? formatAmountInput(v) : amount.value.trim() === "" ? "" : "0";
  onUserInput();
});
rate.addEventListener("input", onUserInput);
for (const el of [start, maturity, pay]) el.addEventListener("change", onUserInput);
render();
