/**
 * 보유세 계산기 — /guide/holding-tax-calculator/.
 * 계산은 src/lib/holding-tax.ts holdingTax() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { holdingTax } from "../lib/holding-tax";
import { formatWon, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("holding-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const prices = [...document.querySelectorAll<HTMLInputElement>("[data-ht-price]")];
const urbans = [...document.querySelectorAll<HTMLSelectElement>("[data-ht-urban]")];
const kind = $<HTMLSelectElement>("ht-kind");
const age = $<HTMLInputElement>("ht-age");
const years = $<HTMLInputElement>("ht-years");
const oneFields = $<HTMLDivElement>("ht-one-fields");

/** 소계가 음수로 읽도록 ASCII '-' (calc-ui 가 U+2212 는 버린다) */
const minus = (v: number) => (v > 0 ? `-${formatWon(v)}` : formatWon(0));
const pct = (v: number, d = 0) => `${Number((v * 100).toFixed(d))}%`;

function render() {
  const houses = prices.map((p, i) => ({ price: parseAmount(p.value), urban: urbans[i].value === "1" }));
  const filled = houses.filter((h) => h.price > 0).length;
  const wantOne = kind.value === "one";
  const x = holdingTax({ houses, oneHome: wantOne, age: Number(age.value) || 0, years: Number(years.value) || 0 });
  oneFields.hidden = !x.oneHome;

  $("ht-hero").textContent = formatWon(x.total);
  $("ht-pt").textContent = formatWon(x.propertyTax);
  $("ht-urban").textContent = formatWon(x.urbanArea);
  $("ht-edu").textContent = formatWon(x.educationTax);
  $("ht-bill").textContent = formatWon(x.propertyBill);
  $("ht-base").textContent = formatWon(x.jongbuTaxBase);
  $("ht-gross").textContent = formatWon(x.jongbuGross);
  $("ht-credit").textContent = minus(x.credit.credit);
  $("ht-onehome").textContent = x.oneHome ? `${minus(x.oneHomeCredit)} (${pct(x.oneHomeRate)})` : "— (1세대 1주택만)";
  $("ht-jongbu").textContent = formatWon(x.jongbu);
  $("ht-rural").textContent = formatWon(x.rural);
  $("ht-eff").textContent = x.totalPrice > 0 ? pct(x.effective, 3) : "—";

  const note = $("ht-note");
  if (!filled) note.textContent = "공시가격을 넣으세요.";
  else if (x.jongbuTaxBase === 0)
    note.textContent = `공시가격 합계가 ${formatWon(x.jongbuDeduction)} 이하라 종부세가 없고 재산세만 냅니다(7월·9월).`;
  else note.textContent = "재산세는 7월·9월, 종부세와 농어촌특별세는 12월 1일~15일에 냅니다.";

  $("ht-formula").textContent =
    x.jongbuTaxBase > 0
      ? `빼는 재산세액 = 재산세 본세 ${formatWon(x.propertyTax)} × ${formatWon(x.credit.numerator)} ÷ ${formatWon(x.credit.denominator)} = ${formatWon(x.credit.credit)} — 재산세 가운데 종부세 과세표준에 해당하는 몫만 뺍니다.`
      : "";

  const warn = $("ht-warn");
  const notes: string[] = [];
  if (wantOne && filled > 1) notes.push("주택이 둘 이상이라 1세대 1주택 특례(12억원 공제·재산세 특례비율·나이·보유 공제) 없이 계산했습니다.");
  if (filled >= 3) notes.push("3주택 이상이라 종부세 과세표준 12억원 초과 구간에 높은 세율을 적용했습니다.");
  warn.hidden = notes.length === 0;
  warn.textContent = notes.join(" ");
}

function onUserInput() {
  render();
  reportUse(prices.reduce((s, p) => s + parseAmount(p.value), 0));
}

for (const p of prices)
  p.addEventListener("input", () => {
    const n = parseAmount(p.value);
    p.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
for (const el of [...urbans, kind, age, years]) el.addEventListener("input", onUserInput);
render();
