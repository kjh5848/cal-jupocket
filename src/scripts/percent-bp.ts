/**
 * 퍼센트 계산기의 bp ↔ %p 카드(#155) — 한국어판(/tools/percent/#bp)과 영어판(/en-us/tools/percent/#bp).
 * 나라판과 같이 쓰는 percent.ts 를 건드리지 않으려고 따로 뒀다. 계산은 lib/percent.ts(bpToPct·pctToBp·rateShift).
 * 문구는 pickLang 으로 고른다 — 영어 사전은 다섯 판 공용이라 1년 이자 차이의 통화는 판의 currency·numberLocale
 * (src/i18n/locales.ts)로 정한다(rateShift 가 1 단위로 반올림). KO 문자열은 그대로.
 */
import { parseNumber, bpToPct, pctToBp, rateShift, formatFine } from "../lib/percent";
import { trackCalculatorUse } from "../lib/track";
import { pageLocale, pickLang } from "../i18n/ui";
import { meta } from "../i18n/locales";

type Dict = {
  empty: string;
  hero: (signed: string, bp: number) => string;
  value: (signedPp: string) => string;
  formula: (bp: string, pp: string) => string;
  zeroBase: string;
  needPrincipal: string;
  money: (v: number) => string;
};

const KO: Dict = {
  empty: "숫자를 넣어 주세요",
  hero: (s) => `${s}bp는`,
  value: (p) => `${p}%p`,
  formula: (b, p) => `${b} ÷ 100 = ${p}%p`,
  zeroBase: "처음 금리가 0%라 셀 수 없음",
  needPrincipal: "원금을 넣으면 보여요",
  money: (v) => `${v.toLocaleString("ko-KR")}원`,
};

const EN_MONEY = meta(pageLocale());
const EN: Dict = {
  empty: "Enter a number",
  hero: (s, bp) => `${s} ${Math.abs(bp) === 1 ? "bp" : "bps"} is`,
  value: (p) => `${p}%`,
  formula: (b, p) => `${b} ÷ 100 = ${p} percentage points`,
  zeroBase: "Can't compare — the starting rate is 0%",
  needPrincipal: "Enter a loan or balance",
  money: (v) =>
    v.toLocaleString(EN_MONEY.numberLocale, { style: "currency", currency: EN_MONEY.currency, maximumFractionDigits: 0, minimumFractionDigits: 0 }),
};

const S = pickLang({ ko: KO, en: EN });

const reportUse = trackCalculatorUse("percent-bp");
const $ = (id: string) => document.getElementById(id)!;
const bpIn = $("bp-in") as HTMLInputElement;
const ppIn = $("bp-pp") as HTMLInputElement;
const baseIn = $("bp-base") as HTMLInputElement;
const prIn = $("bp-principal") as HTMLInputElement;

/** 마지막으로 손댄 칸 — bp 를 고치면 %p 를, %p 를 고치면 bp 를 채운다. */
let source: "bp" | "pp" = "bp";

function compute() {
  let bp: number;
  if (source === "bp") {
    bp = parseNumber(bpIn.value);
    ppIn.value = Number.isNaN(bp) ? "" : formatFine(bpToPct(bp));
  } else {
    const pp = parseNumber(ppIn.value);
    bp = Number.isNaN(pp) ? NaN : pctToBp(pp);
    bpIn.value = Number.isNaN(bp) ? "" : formatFine(bp);
  }
  if (Number.isNaN(bp)) {
    $("bp-hero").textContent = S.empty;
    $("bp-value").textContent = "—";
    $("bp-formula").textContent = "";
    for (const id of ["bp-after", "bp-rel", "bp-year"]) $(id).textContent = "—";
    return;
  }
  const sign = bp > 0 ? "+" : "";
  $("bp-hero").textContent = S.hero(`${sign}${formatFine(bp)}`, bp);
  $("bp-value").textContent = S.value(`${sign}${formatFine(bpToPct(bp))}`);
  $("bp-formula").textContent = S.formula(formatFine(bp), formatFine(bpToPct(bp)));

  const base = parseNumber(baseIn.value);
  const pr = parseNumber(prIn.value);
  if (Number.isNaN(base)) {
    for (const id of ["bp-after", "bp-rel", "bp-year"]) $(id).textContent = "—";
    return;
  }
  const r = rateShift(base, bp, Number.isNaN(pr) ? undefined : pr);
  $("bp-after").textContent = `${formatFine(base)}% → ${formatFine(r.after)}%`;
  $("bp-rel").textContent = r.relative === null ? S.zeroBase : `${r.relative > 0 ? "+" : ""}${formatFine(r.relative)}%`;
  $("bp-year").textContent = r.yearly === null ? S.needPrincipal : `${r.yearly > 0 ? "+" : ""}${S.money(r.yearly)}`;
}

bpIn.addEventListener("input", () => { source = "bp"; reportUse(1); compute(); });
ppIn.addEventListener("input", () => { source = "pp"; reportUse(1); compute(); });
for (const el of [baseIn, prIn]) el.addEventListener("input", compute);
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bp]")) {
  b.addEventListener("click", () => { bpIn.value = b.dataset.bp!; source = "bp"; reportUse(1); compute(); });
}
compute();
