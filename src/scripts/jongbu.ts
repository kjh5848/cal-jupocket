/**
 * 종부세 계산기 — /guide/jongbu-calculator/.
 * 계산은 src/lib/comprehensive-property-tax.ts estimate() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { estimate } from "../lib/comprehensive-property-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("jongbu");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const price = $<HTMLInputElement>("jb-price");
const kind = $<HTMLSelectElement>("jb-kind");
const age = $<HTMLInputElement>("jb-age");
const years = $<HTMLInputElement>("jb-years");
const oneFields = $<HTMLDivElement>("jb-one-fields");

function render() {
  const oneHome = kind.value === "one";
  oneFields.hidden = !oneHome;
  const r = estimate({
    totalPrice: parseAmount(price.value),
    oneHome,
    homes: kind.value === "three" ? "from3Homes" : "upTo2Homes",
    age: Number(age.value) || 0,
    years: Number(years.value) || 0,
  });
  $("jb-hero").textContent = formatWon(r.total);
  $("jb-base").textContent = formatWon(r.base);
  $("jb-tax").textContent = formatWon(r.tax);
  $("jb-credit").textContent = formatWon(r.credit);
  $("jb-rural").textContent = formatWon(r.rural);
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(price.value));
}

price.addEventListener("input", () => {
  const n = parseAmount(price.value);
  price.value = n ? formatAmountInput(n) : "";
  onUserInput();
});
kind.addEventListener("change", onUserInput);
age.addEventListener("input", onUserInput);
years.addEventListener("input", onUserInput);
render();
