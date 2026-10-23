/**
 * 해외결제·환전 수수료 — /tools/overseas-payment-fee/ (한국어판 전용). 계산은 src/lib/overseas-payment-fee.ts compareMethods() 가 한다.
 * 여기서는 입력을 읽고, 통화에 따라 환율 칸 이름('1 USD당' / '100 JPY당')을 바꾼다.
 * 방법별 칸이 비어 있으면 그 방법은 빼고 비교한다(충전 카드는 비워도 매매기준율·0% 로 계산).
 */
import { compareMethods, type Method } from "../lib/overseas-payment-fee";
import { formatWon } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

const reportUse = trackCalculatorUse("overseas-payment-fee");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const val = (id: string) => $<HTMLInputElement>(id).value.replace(/,/g, "").trim();
const num = (id: string) => (val(id) === "" ? undefined : Number(val(id)));
const NAME: Record<Method, string> = { cash: "현금 환전", card: "카드 현지통화 결제", dcc: "카드 원화결제", prepaid: "외화 충전 카드" };
const WON_ID: Record<Method, string> = { cash: "op-cash-won", card: "op-card-won", dcc: "op-dcc-won", prepaid: "op-pp-won" };

const set = (id: string, text: string) => {
  $(id).textContent = text;
};

function cell(tr: HTMLTableRowElement, text: string, head = false) {
  const el = document.createElement(head ? "th" : "td");
  if (head) el.setAttribute("scope", "row");
  el.textContent = text;
  tr.appendChild(el);
}

let lastLines: [string, string][] = [];

function compute() {
  const [code, unitStr] = $<HTMLSelectElement>("op-cur").value.split("|");
  const unit = Number(unitStr);
  set("op-cur-unit", code);
  for (const el of document.querySelectorAll<HTMLElement>(".op-per")) el.textContent = `${unit === 100 ? "100 " : "1 "}${code}당`;

  const amount = Number(val("op-amount"));
  const cashRate = num("op-cash");
  const tt = num("op-tt");
  const r = compareMethods({
    amount,
    unit,
    base: Number(val("op-base")),
    cash: cashRate === undefined ? undefined : { rate: cashRate, prefPct: num("op-pref") ?? 0 },
    card: tt === undefined ? undefined : { rate: tt, brandPct: num("op-brand") ?? 0, servicePct: num("op-svc") ?? 0 },
    dccPct: num("op-dcc"),
    prepaid: { rate: num("op-pp-rate"), feePct: num("op-pp-fee") },
  });
  const rowsEl = $("op-rows");
  if (!r.ok) {
    const msg = {
      amount: "낼 외화 금액을 넣어 주세요.",
      unit: "통화를 다시 골라 주세요.",
      base: "매매기준율을 넣어 주세요.",
      "cash-rate": "현찰 살 때 환율은 매매기준율보다 낮을 수 없습니다 — 단위(1 / 100)를 확인해 주세요.",
      pref: "환율 우대는 0~100% 사이로 넣어 주세요.",
      "card-rate": "환율은 0보다 커야 합니다.",
      pct: "수수료율은 0~100% 사이로 넣어 주세요.",
    }[r.reason];
    set("op-err", msg);
    for (const id of ["op-hero", "op-base-won", "op-gap", ...Object.values(WON_ID)]) set(id, "—");
    set("op-note", "");
    set("op-card-detail", "");
    rowsEl.replaceChildren();
    lastLines = [];
    return;
  }
  set("op-err", "");
  const best = r.methods.find((x) => x.method === r.cheapest)!;
  const worst = r.methods.reduce((a, b) => (b.won > a.won ? b : a));
  set("op-hero", `${NAME[best.method]} ${formatWon(best.won)}`);
  set("op-note", worst.method === best.method ? "" : `${NAME[worst.method]}보다 ${formatWon(worst.won - best.won)} 덜 냄`);
  set("op-base-won", formatWon(r.baseWon));
  set("op-gap", formatWon(best.extra));
  for (const k of Object.keys(WON_ID) as Method[]) {
    const x = r.methods.find((y) => y.method === k);
    set(WON_ID[k], x ? formatWon(x.won) : "칸을 채우면 계산");
  }
  const card = r.methods.find((x) => x.method === "card")?.card;
  set(
    "op-card-detail",
    card ? `카드 청구 = 원금 ${formatWon(card.principal)} + 국제브랜드 수수료 ${formatWon(card.brand)} + 해외서비스 수수료 ${formatWon(card.service)}` : "",
  );
  rowsEl.replaceChildren(
    ...r.methods.map((x) => {
      const tr = document.createElement("tr");
      cell(tr, NAME[x.method], true);
      cell(tr, formatWon(x.won));
      cell(tr, formatWon(x.parts.rate));
      cell(tr, formatWon(x.parts.fee));
      cell(tr, formatWon(x.parts.dcc));
      return tr;
    }),
  );
  lastLines = [
    ["낼 금액", `${amount.toLocaleString("ko-KR")} ${code}`],
    ...r.methods.map((x): [string, string] => [NAME[x.method], formatWon(x.won)]),
    ["가장 싼 방법", NAME[best.method]],
  ];
}

const cardEl = document.querySelector(".calc-card")!;
for (const ev of ["input", "change"]) {
  cardEl.addEventListener(ev, () => {
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: "해외결제 수수료 비교", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "overseas-payment-fee" });
  downloadCard(buildCard(), "overseas-payment-fee-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "overseas-payment-fee" });
  await shareCard(buildCard(), "해외결제 수수료 비교 - jupocket.com");
});

compute();
