/**
 * 전기차 세금 계산기 — /guide/electric-car-tax-calculator/.
 * 계산은 src/lib/electric-car.ts evAcquisitionTax() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { evAcquisitionTax } from "../lib/electric-car";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("electric-car");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const price = $<HTMLInputElement>("ev-price");
const when = $<HTMLSelectElement>("ev-when");

function render() {
  const x = evAcquisitionTax(parseAmount(price.value), when.value);
  $("ev-hero").textContent = formatWon(x.tax);
  $("ev-gross").textContent = formatWon(x.gross);
  $("ev-exempt").textContent = formatWon(x.exempt);
  $("ev-note").textContent = x.exempt
    ? `취득세 ${formatWon(x.gross)}에서 ${formatWon(x.exempt)}이 감면됩니다.`
    : x.gross
      ? "2027년 이후 취득은 현재 법으로 감면이 없습니다."
      : "차값을 넣으세요.";
}

function onUserInput() {
  render();
  reportUse(parseAmount(price.value));
}

price.addEventListener("input", () => {
  const n = parseAmount(price.value);
  price.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
when.addEventListener("input", onUserInput);
render();
