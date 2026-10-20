/**
 * 적립식 복리 계산기 — /tools/compound/ · 일본어판 /ja/tools/compound/ · 영어판(/en-us/tools/compound/ 등).
 * 계산은 src/lib/compound.ts compound() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 * 여러 언어판이 같은 계산을 쓰고 말·통화 표기만 다르다(pickLang). 영어 사전은 다섯 판 공용이라
 * 통화는 페이지 판의 currency·numberLocale(src/i18n/locales.ts)로 정한다 — 1 단위 반올림.
 */
import { compound, type Timing } from "../lib/compound";
import { formatWon, formatYen, parseAmount, formatAmountInput } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale, pickLang } from "../i18n/ui";
import { meta } from "../i18n/locales";

const reportUse = trackCalculatorUse("compound");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const principal = $<HTMLInputElement>("cp-principal");
const monthly = $<HTMLInputElement>("cp-monthly");
const goal = $<HTMLInputElement>("cp-goal");
const rate = $<HTMLInputElement>("cp-rate");
const period = $<HTMLInputElement>("cp-period");
const unit = $<HTMLSelectElement>("cp-unit");
const timing = $<HTMLSelectElement>("cp-timing");
const tax = $<HTMLInputElement>("cp-tax");
const infl = $<HTMLInputElement>("cp-infl");

const KO = {
  money: formatWon,
  spell: (y: number, r: number) => [y ? `${y}년` : "", r ? `${r}개월` : ""].filter(Boolean).join(" ") || "0개월",
  note: (months: number, monthlyRate: string, start: boolean) => `${months}개월 · 월 이율 ${monthlyRate}% · ${start ? "매달 초" : "매달 말"} 적립`,
  noTax: "0원",
  goalNone: "목표 없음",
  goalNever: "기간 안에 못 닿음",
  goalAtStart: "처음부터 넘음",
  goalAt: (s: string) => `${s}째`,
  yearRow: (year: number, rest: number) => (rest === 0 ? `${year}년째` : `${year}년째 (${rest}개월)`),
  after: (s: string) => `${s} 뒤 잔액`,
  paid: "넣은 돈",
  gain: "불어난 돈",
  afterTax: "세후 금액",
  title: "적립식 복리 계산 결과",
  share: "적립식 복리 계산 결과 - jupocket.com",
};

const JA: typeof KO = {
  money: formatYen,
  spell: (y, r) => [y ? `${y}年` : "", r ? `${r}か月` : ""].join("") || "0か月",
  note: (months, monthlyRate, start) => `${months}か月 · 月利 ${monthlyRate}% · ${start ? "毎月初め" : "毎月末"}に積立`,
  noTax: "0円",
  goalNone: "目標なし",
  goalAtStart: "最初から到達",
  goalNever: "期間内に届かない",
  goalAt: (s) => `${s}目`,
  yearRow: (year, rest) => (rest === 0 ? `${year}年目` : `${year}年目（${rest}か月）`),
  after: (s) => `${s}後の残高`,
  paid: "元本（積立総額）",
  gain: "運用益",
  afterTax: "税引後",
  title: "積立の複利計算の結果",
  share: "積立の複利計算の結果 - jupocket.com",
};

const EN_MONEY = meta(pageLocale());
const enMoney = (v: number) =>
  Math.round(v).toLocaleString(EN_MONEY.numberLocale, { style: "currency", currency: EN_MONEY.currency, maximumFractionDigits: 0, minimumFractionDigits: 0 });
const EN: typeof KO = {
  money: enMoney,
  spell: (y, r) =>
    [y ? `${y} year${y === 1 ? "" : "s"}` : "", r ? `${r} month${r === 1 ? "" : "s"}` : ""].filter(Boolean).join(" ") || "0 months",
  note: (months, monthlyRate, start) => `${months} months · ${monthlyRate}% a month · deposits at the ${start ? "start" : "end"} of each month`,
  noTax: enMoney(0),
  goalNone: "No goal set",
  goalNever: "Not reached in this period",
  goalAtStart: "Reached from the start",
  goalAt: (s) => `After ${s}`,
  yearRow: (year, rest) => (rest === 0 ? `Year ${year}` : `Year ${year} (${rest} mo)`),
  after: (s) => `Balance after ${s}`,
  paid: "Total contributions",
  gain: "Interest earned",
  afterTax: "After tax",
  title: "Compound interest result",
  share: "Compound interest result - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN });

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (el: HTMLInputElement, lo: number, hi: number) => clamp(Number(el.value) || 0, lo, hi);
const w = (x: number) => S.money(x);
const signed = (x: number) => (Math.round(x) < 0 ? `−${S.money(-x)}` : S.money(x));
const spell = (m: number) => S.spell(Math.floor(m / 12), m % 12);

let lastLines: [string, string][] = [];

function render() {
  const n = clamp(Math.floor(Number(period.value) || 1), 1, 600) * (unit.value === "years" ? 12 : 1);
  const months = Math.min(n, 1200);
  const ratePct = num(rate, -50, 100);
  const t = timing.value as Timing;
  const G = parseAmount(goal.value);
  const x = compound({
    principal: parseAmount(principal.value),
    monthly: parseAmount(monthly.value),
    ratePct,
    months,
    timing: t,
    taxPct: num(tax, 0, 100),
    inflationPct: num(infl, -20, 50),
    goal: G,
  });

  $("cp-hero").textContent = w(x.balance);
  $("cp-note").textContent = S.note(months, (ratePct / 12).toFixed(4), t === "start");
  $("cp-paid").textContent = w(x.paid);
  $("cp-gain2").textContent = signed(x.gain);
  $("cp-tax-v").textContent = Math.round(x.tax) ? `−${w(x.tax)}` : S.noTax;
  $("cp-after").textContent = w(x.afterTax);
  $("cp-real").textContent = w(x.real);
  $("cp-goal-v").textContent = !G ? S.goalNone : x.goalMonth === null ? S.goalNever : x.goalMonth === 0 ? S.goalAtStart : S.goalAt(spell(x.goalMonth));
  $("cp-rows").replaceChildren(
    ...x.years.map((y) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.textContent = S.yearRow(y.year, y.month % 12);
      const cells = [w(y.paid), signed(y.gain), w(y.balance)].map((v) => {
        const td = document.createElement("td");
        td.textContent = v;
        return td;
      });
      tr.append(th, ...cells);
      return tr;
    }),
  );
  lastLines = [
    [S.after(spell(months)), w(x.balance)],
    [S.paid, w(x.paid)],
    [S.gain, signed(x.gain)],
    [S.afterTax, w(x.afterTax)],
  ];
}

function onUserInput() {
  render();
  reportUse(parseAmount(monthly.value) || parseAmount(principal.value));
}

for (const el of [principal, monthly, goal]) {
  el.addEventListener("input", () => {
    const v = parseAmount(el.value);
    el.value = v ? formatAmountInput(v) : el.value.trim() === "" ? "" : "0";
    onUserInput();
  });
}
for (const el of [rate, period, tax, infl]) el.addEventListener("input", onUserInput);
for (const el of [unit, timing]) el.addEventListener("change", onUserInput);

const buildCard = () => renderCard({ title: S.title, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  track("save_result", { calculator: "compound" });
  downloadCard(buildCard(), "compound-result.png");
});
$("btn-share").addEventListener("click", async () => {
  track("share_result", { calculator: "compound" });
  await shareCard(buildCard(), S.share);
});

render();
