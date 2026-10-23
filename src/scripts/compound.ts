/**
 * 적립식 복리 계산기 — /tools/compound/ · 일본어판 /ja/tools/compound/ · 영어판(/en-us/tools/compound/ 등).
 * 계산은 src/lib/compound.ts compound() 가 한다. 여기서는 입력을 읽고 결과를 그린다.
 * 여러 언어판이 같은 계산을 쓰고 말·통화 표기만 다르다(pickLang). 영어 사전은 다섯 판 공용이라
 * 통화는 페이지 판의 currency·numberLocale(src/i18n/locales.ts)로 정한다 — 1 단위 반올림.
 * 인도네시아어판(/id/tools/compound/)은 ID 사전 — 통화는 같은 판 formatter(IDR, id-ID). 입력칸 천 단위 표기도
 * 판의 numberLocale 로 쓴다(ko·ja·en 은 쉼표 그대로, id 는 점 — 결과 'Rp 10.000.000' 과 맞춤).
 * 프랑스어판(/fr/tools/compound/)은 FR 사전 — EUR·fr-FR('10 000 €'), 입력칸 금액은 쉼표 앞까지만 읽는다(readAmount).
 * 독일어판(/de/tools/compound/)은 DE 사전 — 금액은 lib/de/money euroDe('10 000 Euro', 법령 원문 꼴, Intl 안 씀),
 * 입력칸 천 단위는 intDe(공백), 금액은 fr 과 같이 쉼표 앞까지만 읽는다.
 * 스페인어판(/es/tools/compound/)은 ES 사전 — 금액은 lib/es/money euroEs('10 000 euros', RD 2032/2009 숫자 표기, € 기호 안 씀),
 * 입력칸 천 단위는 formatNumberEs(다섯 자리부터 공백), 금액은 fr·de 와 같이 쉼표 앞까지만 읽는다(1.500 의 점은 parseAmount 가 버림).
 */
import { compound, type Timing } from "../lib/compound";
import { formatWon, formatYen, parseAmount } from "../lib/money";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pageLocale, pickLang } from "../i18n/ui";
import { meta } from "../i18n/locales";
import { euroDe, decimalDe } from "../lib/de/money";
import { intDe } from "../lib/de/date-format";
import { euroEs, decimalEs } from "../lib/es/money";
import { formatNumberEs } from "../lib/es/number";

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
  goalLater: (s: string) => `기간 밖 · 계속 넣으면 ${s}째`,
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
  goalLater: (s) => `期間外 · 続ければ${s}目`,
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
  goalLater: (s) => `Beyond this period · after ${s} if you keep going`,
  yearRow: (year, rest) => (rest === 0 ? `Year ${year}` : `Year ${year} (${rest} mo)`),
  after: (s) => `Balance after ${s}`,
  paid: "Total contributions",
  gain: "Interest earned",
  afterTax: "After tax",
  title: "Compound interest result",
  share: "Compound interest result - jupocket.com",
};

const ID: typeof KO = {
  money: enMoney,
  spell: (y, r) => [y ? `${y} tahun` : "", r ? `${r} bulan` : ""].filter(Boolean).join(" ") || "0 bulan",
  note: (months, monthlyRate, start) => `${months} bulan · bunga ${monthlyRate}% per bulan · setoran di ${start ? "awal" : "akhir"} bulan`,
  noTax: enMoney(0),
  goalNone: "Tanpa target",
  goalNever: "Tidak tercapai dalam jangka waktu ini",
  goalAtStart: "Sudah tercapai sejak awal",
  goalAt: (s) => `Setelah ${s}`,
  goalLater: (s) => `Di luar jangka waktu · setelah ${s} jika diteruskan`,
  yearRow: (year, rest) => (rest === 0 ? `Tahun ke-${year}` : `Tahun ke-${year} (${rest} bulan)`),
  after: (s) => `Saldo setelah ${s}`,
  paid: "Total setoran",
  gain: "Total bunga",
  afterTax: "Setelah pajak",
  title: "Hasil kalkulator bunga majemuk",
  share: "Hasil kalkulator bunga majemuk - jupocket.com",
};

/** 繁體中文 — 대만판·홍콩판 공용. 통화는 같은 판 formatter(zh-tw TWD · zh-hk HKD) */
const ZH_HANT: typeof KO = {
  money: enMoney,
  spell: (y, r) => [y ? `${y}年` : "", r ? `${r}個月` : ""].join("") || "0個月",
  note: (months, monthlyRate, start) => `${months}個月 · 月利率 ${monthlyRate}% · ${start ? "每月月初" : "每月月底"}存入`,
  noTax: enMoney(0),
  goalNone: "未設目標",
  goalNever: "期間內未能達到",
  goalAtStart: "一開始已達到",
  goalAt: (s) => `${s}後達到`,
  goalLater: (s) => `超出期間 · 繼續投入則${s}後達到`,
  yearRow: (year, rest) => (rest === 0 ? `第${year}年` : `第${year}年（${rest}個月）`),
  after: (s) => `${s}後結餘`,
  paid: "投入本金",
  gain: "利息收益",
  afterTax: "稅後金額",
  title: "複利計算結果",
  share: "複利計算結果 - jupocket.com",
};

/** Français — /fr/tools/compound/. 통화는 같은 판 formatter(EUR, fr-FR — '10 000 €') */
const FR: typeof KO = {
  money: enMoney,
  spell: (y, r) => [y ? `${y} an${y > 1 ? "s" : ""}` : "", r ? `${r} mois` : ""].filter(Boolean).join(" et ") || "0 mois",
  note: (months, monthlyRate, start) => `${months} mois · ${monthlyRate.replace(".", ",")} % par mois · versement en ${start ? "début" : "fin"} de mois`,
  noTax: enMoney(0),
  goalNone: "Aucun objectif",
  goalNever: "Non atteint sur la durée",
  goalAtStart: "Atteint dès le départ",
  goalAt: (s) => `Au bout de ${s}`,
  goalLater: (s) => `Hors durée · au bout de ${s} en continuant`,
  yearRow: (year, rest) => (rest === 0 ? `Année ${year}` : `Année ${year} (${rest} mois)`),
  after: (s) => `Capital au bout de ${s}`,
  paid: "Total versé",
  gain: "Intérêts gagnés",
  afterTax: "Après impôt",
  title: "Résultat du calcul d’intérêts composés",
  share: "Résultat du calcul d’intérêts composés - jupocket.com",
};

/** Deutsch — /de/tools/compound/. 금액은 euroDe('10 000 Euro'), 비율은 소수 쉼표 + 'Prozent'(§ 4 SolzG "5,5 Prozent") */
const DE: typeof KO = {
  money: euroDe,
  spell: (y, r) =>
    [y ? `${y} ${y === 1 ? "Jahr" : "Jahre"}` : "", r ? `${r} ${r === 1 ? "Monat" : "Monate"}` : ""].filter(Boolean).join(" und ") || "0 Monate",
  note: (months, monthlyRate, start) => `${months} Monate · ${decimalDe(monthlyRate)} Prozent pro Monat · Einzahlung am Monats${start ? "anfang" : "ende"}`,
  noTax: euroDe(0),
  goalNone: "Kein Ziel",
  goalNever: "In der Laufzeit nicht erreicht",
  goalAtStart: "Schon zu Beginn erreicht",
  goalAt: (s) => `Nach ${s}`,
  goalLater: (s) => `Außerhalb der Laufzeit · nach ${s} bei Fortsetzung`,
  yearRow: (year, rest) => (rest === 0 ? `${year}. Jahr` : `${year}. Jahr (${rest} Mon.)`),
  after: (s) => `Guthaben nach ${s}`,
  paid: "Eingezahlt",
  gain: "Zinsen",
  afterTax: "Nach Steuern",
  title: "Ergebnis Zinseszinsrechner",
  share: "Ergebnis Zinseszinsrechner - jupocket.com",
};

/** Español — /es/tools/compound/. 금액은 euroEs('10 000 euros'), 비율은 소수 쉼표(퍼센트 페이지와 같이 '%' 붙여 씀) */
const ES: typeof KO = {
  money: euroEs,
  spell: (y, r) =>
    [y ? `${y} ${y === 1 ? "año" : "años"}` : "", r ? `${r} ${r === 1 ? "mes" : "meses"}` : ""].filter(Boolean).join(" y ") || "0 meses",
  note: (months, monthlyRate, start) => `${months} meses · ${decimalEs(monthlyRate)}% al mes · aportación a ${start ? "principio" : "final"} de mes`,
  noTax: euroEs(0),
  goalNone: "Sin objetivo",
  goalNever: "No se alcanza en este plazo",
  goalAtStart: "Alcanzado desde el principio",
  goalAt: (s) => `A los ${s}`,
  goalLater: (s) => `Fuera del plazo · a los ${s} si se continúa`,
  yearRow: (year, rest) => (rest === 0 ? `Año ${year}` : `Año ${year} (${rest} ${rest === 1 ? "mes" : "meses"})`),
  after: (s) => `Capital a los ${s}`,
  paid: "Total aportado",
  gain: "Intereses ganados",
  afterTax: "Tras impuestos",
  title: "Resultado de la calculadora de interés compuesto",
  share: "Resultado de la calculadora de interés compuesto - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN, id: ID, "zh-Hant": ZH_HANT, fr: FR, de: DE, es: ES });
/** 입력칸 천 단위 표기 — 판의 numberLocale(ko-KR·ja-JP·en-* 는 쉼표, id-ID 는 점). parseAmount 는 숫자만 읽어 어느 쪽이든 같다. */
const formatInput = pickLang<(v: number) => string>({ ko: (v) => v.toLocaleString(EN_MONEY.numberLocale), de: intDe, es: formatNumberEs });
/** 입력칸 금액 읽기 — 정수 단위. fr 은 쉼표가 소수점이라 붙여 넣은 "1 500,50" 을 150050 이 아니라 1500 으로(쉼표 뒤 버림). 다른 판은 parseAmount 그대로. */
const cutAtComma = (raw: string) => parseAmount(raw.split(",")[0]);
const readAmount = pickLang<(raw: string) => number>({ ko: parseAmount, fr: cutAtComma, de: cutAtComma, es: cutAtComma });

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
  const G = readAmount(goal.value);
  const x = compound({
    principal: readAmount(principal.value),
    monthly: readAmount(monthly.value),
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
  $("cp-goal-v").textContent = !G ? S.goalNone : x.goalMonth === null ? (x.goalLater === null ? S.goalNever : S.goalLater(spell(x.goalLater))) : x.goalMonth === 0 ? S.goalAtStart : S.goalAt(spell(x.goalMonth));
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
  reportUse(readAmount(monthly.value) || readAmount(principal.value));
}

for (const el of [principal, monthly, goal]) {
  el.addEventListener("input", () => {
    const v = readAmount(el.value);
    el.value = v ? formatInput(v) : el.value.trim() === "" ? "" : "0";
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
