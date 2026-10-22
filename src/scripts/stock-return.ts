/**
 * 주식 수익률 계산기 — /guide/stock-return-calculator/.
 * 계산은 src/lib/stock-return.ts stockReturn()·priceForReturn() 이 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { stockReturn, priceForReturn, type Market } from "../lib/stock-return";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("stock-return");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const buy = $<HTMLInputElement>("sr-buy");
const qty = $<HTMLInputElement>("sr-qty");
const sell = $<HTMLInputElement>("sr-sell");
const market = $<HTMLSelectElement>("sr-market");
const fee = $<HTMLInputElement>("sr-fee");
const target = $<HTMLSelectElement>("sr-target");

const rate = (v: number) => `${(v * 100).toFixed(2)}%`;
const priceOr = (p: number | null) => (p == null ? "—" : formatWon(p));

function render() {
  const input = {
    buyPrice: parseAmount(buy.value),
    qty: Math.max(0, Math.floor(Number(qty.value) || 0)),
    feePct: Math.min(1, Math.max(0, Number(fee.value) || 0)),
    market: market.value as Market,
  };
  const x = stockReturn({ ...input, sellPrice: parseAmount(sell.value) });
  const goal = Number(target.value) || 0;
  const ready = input.buyPrice > 0 && input.qty > 0;

  $("sr-hero").textContent = ready ? `${x.profit > 0 ? "+" : ""}${formatWon(x.profit)}` : "—";
  $("sr-note").textContent = ready ? `실제 수익률 ${rate(x.returnRate)} · 주가 변동 ${rate(x.priceChange)}` : "매수 단가와 수량을 넣으세요.";
  $("sr-rate").textContent = ready ? rate(x.returnRate) : "—";
  $("sr-even").textContent = priceOr(priceForReturn(input));
  $("sr-target-label").textContent = `목표 ${goal}% 매도가`;
  $("sr-goal").textContent = priceOr(priceForReturn(input, goal));
  $("sr-buyamt").textContent = formatWon(x.buyAmount);
  $("sr-buyfee").textContent = formatWon(x.buyFee);
  $("sr-sellfee").textContent = formatWon(x.sellFee);
  $("sr-tax").textContent = formatWon(x.tax);
  $("sr-rural").textContent = formatWon(x.rural);
  $("sr-proceeds").textContent = formatWon(x.proceeds);
  $("sr-formula").textContent = ready
    ? `순손익 = 매도 정산액 ${formatWon(x.proceeds)} − 매수 원가 ${formatWon(x.cost)} · 수수료와 세금 합계 ${formatWon(x.costs)}`
    : "";
}

function onUserInput() {
  render();
  reportUse(parseAmount(buy.value) * (Number(qty.value) || 0));
}

for (const el of [buy, sell])
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
for (const el of [qty, market, fee, target]) el.addEventListener("input", onUserInput);
render();
