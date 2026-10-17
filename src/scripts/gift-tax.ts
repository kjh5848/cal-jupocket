/**
 * 증여세 계산기 — /guide/gift-tax-calculator/.
 * 계산은 src/lib/gift.ts computeGift() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 */
import { computeGift, relationCap, type Relation } from "../lib/gift";
import { formatWon, formatMan, parseAmount, formatAmountInput } from "../lib/money";
import { trackCalculatorUse } from "../lib/track";
import r from "../rates/gift-2026.json";

const reportUse = trackCalculatorUse("gift-tax");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const amount = $<HTMLInputElement>("gt-amount");
const prior = $<HTMLInputElement>("gt-prior");
const used = $<HTMLInputElement>("gt-used");
const relation = $<HTMLSelectElement>("gt-relation");
const minor = $<HTMLInputElement>("gt-minor");
const mb = $<HTMLInputElement>("gt-mb");
const skip = $<HTMLInputElement>("gt-skip");

/** 소계가 음수로 읽도록 ASCII '-' (calc-ui 가 U+2212 는 버린다) */
const minus = (v: number) => (v > 0 ? `-${formatWon(v)}` : formatWon(0));

function render() {
  const rel = relation.value as Relation;
  const asc = rel === "ascendant";
  // 결혼·출산공제와 세대생략 할증은 직계존속에게 받을 때만 있다(제53조의2 · 제57조).
  $("gt-mb-wrap").hidden = !asc;
  $("gt-skip-wrap").hidden = !asc;

  const g = computeGift({
    amount: parseAmount(amount.value),
    relation: rel,
    minor: minor.checked,
    usedWithin10y: parseAmount(used.value),
    priorGifts: parseAmount(prior.value),
    marriageBirth: mb.checked && asc ? r.marriageBirthDeduction.amount : 0,
    generationSkip: skip.checked && asc,
  });
  const u = g.unclear;
  const show = (id: string, text: string) => ($(id).textContent = u ? "—" : text);

  show("gt-hero", formatWon(g.payable));
  show("gt-base", formatWon(g.base));
  $("gt-rate").textContent = !u && g.base > 0 ? `${g.ratePercent}%` : "—";
  show("gt-computed", formatWon(g.computed));
  show("gt-surcharge", g.surcharge > 0 ? `${formatWon(g.surcharge)} (${Math.round(g.surchargeRate * 100)}%)` : formatWon(0));
  show("gt-pcredit", minus(g.priorCredit));
  show("gt-fcredit", minus(g.filingCredit));
  $("gt-pcomputed").textContent = g.aggregated && !u ? formatWon(g.priorComputed) : "—";
  $("gt-plimit").textContent = g.aggregated && !u ? formatWon(g.priorCreditLimit) : "—";
  $("gt-amt").textContent = formatWon(g.amount);
  $("gt-pamt").textContent = formatWon(g.aggregated ? g.priorGifts : 0);
  $("gt-ded-rel").textContent = formatWon(g.deductions.relation);
  $("gt-ded-prior").textContent = formatWon(g.aggregated ? g.priorDeduction : 0);
  $("gt-ded-mb").textContent = formatWon(g.deductions.marriageBirth);

  const cap = relationCap(rel, minor.checked);
  const note = $("gt-note");
  if (u) {
    note.textContent =
      g.surchargeRate > 0 || (skip.checked && asc)
        ? "세대생략 할증과 10년 합산이 겹치면 이전에 낸 할증세액을 빼는 방식(시행령 제46조의3)이 입력만으로 정해지지 않아 금액을 내지 않습니다. 세무서(126)에 확인하세요."
        : `공제가 없는 관계에서 이전에 받은 금액이 ${formatMan(r.priorGiftAggregation.threshold)} 미만이면 합산하는지(제47조 ②) 법조문만으로 닫히지 않아 금액을 내지 않습니다. 세무서(126)에 확인하세요.`;
  } else if (g.amount <= 0) {
    note.textContent = "";
  } else if (g.payable === 0) {
    const room = g.deductions.relationAvailable + (asc && mb.checked ? r.marriageBirthDeduction.combinedCap : 0) - g.amount;
    note.textContent =
      g.base === 0 && g.deductions.total >= g.amount && room > 0
        ? `공제가 ${formatMan(room)} 남아 있습니다. 그만큼 더 받아도 0원입니다.`
        : "세금이 없습니다.";
  } else {
    const p = Math.round(g.effectiveRate * 1000) / 10;
    note.textContent = `이번 받은 금액 대비 실효세율 ${p}%입니다.`;
  }

  $("gt-formula").textContent =
    `과세표준 = 이번에 받는 금액` +
    (g.aggregated ? ` + 10년 안 같은 사람에게 받은 ${formatWon(g.priorGifts)}` : "") +
    ` − 공제(관계별 10년 한도 ${formatMan(cap)}` +
    (g.priorDeduction > 0 ? `, 이전 증여가 ${formatWon(g.priorDeduction)} 먼저 씀 — 시행령 제46조 ①` : "") +
    `). ` +
    (g.aggregated
      ? `이전 증여분 세액은 지금 세율·공제로 추정했고(제58조), 산출세액 × 이전분 과세표준 ÷ 합친 과세표준을 넘지 못합니다. `
      : g.priorGifts > 0
        ? `이전에 받은 금액이 ${formatMan(r.priorGiftAggregation.threshold)} 미만이라 합산하지 않고 공제만 줄였습니다. `
        : "") +
    `신고세액공제는 산출세액(할증 포함)에서 이전분 세액을 뺀 금액의 ${Math.round(r.filingCredit.rate * 100)}%입니다.`;
}

/** 사용 집계는 사람이 값을 바꿨을 때만 */
function onUserInput() {
  render();
  reportUse(parseAmount(amount.value));
}

for (const el of [amount, prior, used]) {
  el.addEventListener("input", () => {
    const n = parseAmount(el.value);
    el.value = n ? formatAmountInput(n) : "";
    onUserInput();
  });
}
for (const el of [relation, minor, mb, skip]) el.addEventListener("change", onUserInput);
render();
