/**
 * 퍼센트 계산기 한국어판(/tools/percent/#bp) 의 bp ↔ %p 카드(#155). 다른 언어판은 쓰지 않는다 —
 * 나라판과 같이 쓰는 percent.ts 를 건드리지 않으려고 따로 뒀다. 계산은 lib/percent.ts(bpToPct·pctToBp·rateShift).
 */
import { parseNumber, bpToPct, pctToBp, rateShift, formatFine } from "../lib/percent";
import { trackCalculatorUse } from "../lib/track";

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
    $("bp-hero").textContent = "숫자를 넣어 주세요";
    $("bp-value").textContent = "—";
    $("bp-formula").textContent = "";
    for (const id of ["bp-after", "bp-rel", "bp-year"]) $(id).textContent = "—";
    return;
  }
  const sign = bp > 0 ? "+" : "";
  $("bp-hero").textContent = `${sign}${formatFine(bp)}bp는`;
  $("bp-value").textContent = `${sign}${formatFine(bpToPct(bp))}%p`;
  $("bp-formula").textContent = `${formatFine(bp)} ÷ 100 = ${formatFine(bpToPct(bp))}%p`;

  const base = parseNumber(baseIn.value);
  const pr = parseNumber(prIn.value);
  if (Number.isNaN(base)) {
    for (const id of ["bp-after", "bp-rel", "bp-year"]) $(id).textContent = "—";
    return;
  }
  const r = rateShift(base, bp, Number.isNaN(pr) ? undefined : pr);
  $("bp-after").textContent = `${formatFine(base)}% → ${formatFine(r.after)}%`;
  $("bp-rel").textContent = r.relative === null ? "처음 금리가 0%라 셀 수 없음" : `${r.relative > 0 ? "+" : ""}${formatFine(r.relative)}%`;
  $("bp-year").textContent = r.yearly === null ? "원금을 넣으면 보여요" : `${r.yearly > 0 ? "+" : ""}${r.yearly.toLocaleString("ko-KR")}원`;
}

bpIn.addEventListener("input", () => { source = "bp"; reportUse(1); compute(); });
ppIn.addEventListener("input", () => { source = "pp"; reportUse(1); compute(); });
for (const el of [baseIn, prIn]) el.addEventListener("input", compute);
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-bp]")) {
  b.addEventListener("click", () => { bpIn.value = b.dataset.bp!; source = "bp"; reportUse(1); compute(); });
}
compute();
