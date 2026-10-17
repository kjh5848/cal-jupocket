/**
 * 종부세 계산기 — /guide/jongbu-calculator/.
 * 계산은 src/lib/comprehensive-property-tax.ts jongbuPage() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { jongbuPage, RATIO } from "../lib/comprehensive-property-tax";
import { formatWon, formatMan, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("jongbu");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const price = $<HTMLInputElement>("jb-price");
const kind = $<HTMLSelectElement>("jb-kind");
const age = $<HTMLInputElement>("jb-age");
const years = $<HTMLInputElement>("jb-years");
const oneFields = $<HTMLDivElement>("jb-one-fields");

/** 소계가 음수로 읽도록 ASCII '-' (calc-ui 가 U+2212 는 버린다) */
const minus = (v: number) => (v > 0 ? `-${formatWon(v)}` : formatWon(0));
const pct = (v: number, d = 2) => `${Number((v * 100).toFixed(d))}%`;
const KIND_LABEL = { one: "1세대 1주택자", two: "2주택 이하", three: "3주택 이상" } as const;

let lines: [string, string][] = [];

function render() {
  const k = kind.value as "one" | "two" | "three";
  const oneHome = k === "one";
  oneFields.hidden = !oneHome;
  const totalPrice = parseAmount(price.value);
  const p = jongbuPage({ totalPrice, kind: k, age: Number(age.value) || 0, years: Number(years.value) || 0 });

  $("jb-hero").textContent = formatWon(p.total);
  $("jb-deduction").textContent = formatWon(p.deduction);
  $("jb-base").textContent = formatWon(p.base);
  $("jb-tax").textContent = formatWon(p.tax);
  $("jb-rate").textContent = oneHome
    ? `${pct(p.ageRate, 0)} + ${pct(p.holdRate, 0)} = ${pct(p.creditRate, 0)}`
    : "— (1세대 1주택만)";
  $("jb-credit").textContent = minus(p.credit);
  // 자동완성 '종부세 1주택 2주택 차이' — 체크한 쪽 반대편과의 차이를 보여준다
  $("jb-saving-label").textContent = oneHome
    ? "9억 공제였다면 더 냈을 돈 (1주택 특례)"
    : "1세대 1주택이었다면 줄어드는 돈 (나이·보유 공제 빼고)";
  $("jb-saving").textContent = formatWon(p.oneHomeSaving);
  $("jb-multi").textContent = k === "three" ? formatWon(p.multiExtra) : "—";
  $("jb-inst").textContent = p.installment > 0 ? formatWon(p.installment) : "0원 (250만원 이하)";
  $("jb-eff").textContent = totalPrice > 0 && p.total > 0 ? pct(p.effective, 3) : "—";
  $("jb-after").textContent = formatWon(p.afterCredit);
  $("jb-rural").textContent = formatWon(p.rural);

  const note = $("jb-note");
  if (!totalPrice) note.textContent = "공시가격을 넣으세요.";
  else if (p.exempt)
    note.textContent = `공제 ${formatMan(p.deduction)} 이하라 종부세가 없습니다. 공시가격이 ${formatMan(p.room)} 더 올라도 0원입니다.`;
  else note.textContent = "12월 1일~15일에 냅니다. 같은 집 재산세를 빼 주는 공제(제9조 ③)가 빠진 값이라 고지서는 이보다 작습니다.";

  $("jb-formula").textContent =
    `과세표준 = (${formatWon(totalPrice)} − ${formatMan(p.deduction)}) × ${Math.round(RATIO * 100)}% = ${formatWon(p.base)}. ` +
    `${KIND_LABEL[k]} 세율표를 적용하고` +
    (oneHome && p.creditRate > 0 ? ` 나이·보유 공제 ${pct(p.creditRate, 0)}를 뺀 뒤` : "") +
    ` 농어촌특별세 20%를 더했습니다.`;

  lines = [
    ["공시가격 합계", formatWon(totalPrice)],
    ["구분", KIND_LABEL[k]],
    ["과세표준", formatWon(p.base)],
    ["세율 적용 세액", formatWon(p.tax)],
    ...(oneHome ? ([["1주택 나이·보유 공제", minus(p.credit)]] as [string, string][]) : []),
    ["종부세", formatWon(p.afterCredit)],
    ["농어촌특별세", formatWon(p.rural)],
    ["합계(재산세액 공제 전)", formatWon(p.total)],
  ];
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
$("jb-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(lines.map(([a, b]) => `${a}: ${b}`).join("\n"));
  const t = $("jb-toast");
  t.style.display = "";
  setTimeout(() => (t.style.display = "none"), 2000);
});
render();
