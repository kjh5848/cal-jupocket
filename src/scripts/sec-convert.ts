import {
  toNanos,
  partsToNanos,
  convertAll,
  readable,
  readableJa,
  readableEn,
  withUnitEn,
  clock,
  minSec,
  UNITS,
  UNIT_NAME,
  UNIT_NAME_JA,
  UNIT_NAME_EN,
  type Unit,
} from "../lib/sec-convert";
import { UNIT_NAME_ID, withUnitId, readableId } from "../lib/id/sec-convert";
import { UNIT_NAME_ZH_HANT, withUnitZhHant, readableZhHant } from "../lib/hk/sec-convert";
import {
  UNIT_NAME_FR,
  withUnitFr,
  readableFr,
  readInputFr,
  digitsFr,
  partsSubFr,
} from "../lib/fr/sec-convert";
import {
  UNIT_NAME_DE,
  withUnitDe,
  readableDe,
  readInputDe,
  digitsDe,
  partsSubDe,
} from "../lib/de/sec-convert";
import {
  UNIT_NAME_ES,
  withUnitEs,
  readableEs,
  readInputEs,
  digitsEs,
  partsSubEs,
  heroLabelEs,
  heroSubEs,
} from "../lib/es/sec-convert";
import { pickLang } from "../i18n/ui";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("sec-convert");

const $ = (id: string) => document.getElementById(id)!;
const valIn = $("val") as HTMLInputElement;
const unitIn = $("unit") as HTMLSelectElement;
const parts = ["p-d", "p-h", "p-m", "p-s"].map((id) => $(id) as HTMLInputElement);

const set = (id: string, text: string) => {
  $(id).textContent = text;
};
/**
 * 화면 문구 — 한국어판(/tools/sec-convert/)·일본어판(/ja/tools/sec-convert/)·영어판(/en-us/tools/sec-convert/ 등, 영어 판 공용)이
 * 인도네시아어판(/id/tools/sec-convert/, 표기는 lib/id/sec-convert.ts)이
 * 같은 계산(lib/sec-convert.ts)을 쓴다. withUnit 은 값 + 단위 — KO·JA 는 붙여 쓰고 EN 은 띄우고 복수형.
 */
const KO = {
  unit: UNIT_NAME,
  withUnit: (v: string, u: Unit) => `${v}${UNIT_NAME[u]}`,
  readable,
  heroLabel: (v: string, unit: Unit) => `${v}${UNIT_NAME[unit]}${unit === "s" || unit === "ms" ? "는" : "은"}`,
  heroSub: (other: string, unit: Unit, hms: string) => `${other}${unit === "min" ? "초" : "분"} · 시:분:초 ${hms}`,
  bad: "0 이상의 숫자만 넣어 주세요 (소수는 여섯째 자리까지, 정수는 15자리까지)",
  lineIn: "입력",
  lineReadable: "풀어 쓰면",
  partsSub: (min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string) =>
    `${min}분${ms.seconds === "0" ? "" : `(${ms.minutes.toLocaleString("ko-KR")}분 ${ms.seconds}초)`} · ${h}시간 · ${r}`,
  cardTitle: "초·분·시간 변환",
  shareText: "초·분·시간 변환 - jupocket.com",
};

const JA: typeof KO = {
  unit: UNIT_NAME_JA,
  withUnit: (v: string, u: Unit) => `${v}${UNIT_NAME_JA[u]}`,
  readable: readableJa,
  heroLabel: (v: string, unit: Unit) => `${v}${UNIT_NAME_JA[unit]}は`,
  heroSub: (other: string, unit: Unit, hms: string) => `${other}${unit === "min" ? "秒" : "分"} ・ 時:分:秒 ${hms}`,
  bad: "0以上の数字を入れてください（小数は6桁まで、整数は15桁まで）",
  lineIn: "入力",
  lineReadable: "何時間何分何秒",
  partsSub: (min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string) =>
    `${min}分${ms.seconds === "0" ? "" : `（${ms.minutes.toLocaleString("ja-JP")}分${ms.seconds}秒）`} ・ ${h}時間 ・ ${r}`,
  cardTitle: "秒・分・時間 変換",
  shareText: "秒・分・時間 変換 - jupocket.com",
};

const EN: typeof KO = {
  unit: UNIT_NAME_EN,
  withUnit: withUnitEn,
  readable: readableEn,
  heroLabel: (v: string, unit: Unit) => `${withUnitEn(v, unit)} is`,
  heroSub: (other: string, unit: Unit, hms: string) => `${withUnitEn(other, unit === "min" ? "s" : "min")} · h:mm:ss ${hms}`,
  bad: "Enter a number of 0 or more (up to 6 decimal places and 15 whole digits)",
  lineIn: "Input",
  lineReadable: "Hours, minutes, seconds",
  partsSub: (min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string) =>
    `${withUnitEn(min, "min")}${ms.seconds === "0" ? "" : ` (${ms.minutes.toLocaleString("en-US")} min ${ms.seconds} sec)`} · ${withUnitEn(h, "h")} · ${r}`,
  cardTitle: "Seconds to Minutes Converter",
  shareText: "Seconds to Minutes Converter - jupocket.com",
};

const ID: typeof KO = {
  unit: UNIT_NAME_ID,
  withUnit: withUnitId,
  readable: readableId,
  heroLabel: (v: string, unit: Unit) => `${withUnitId(v, unit)} =`,
  heroSub: (other: string, unit: Unit, hms: string) => `${withUnitId(other, unit === "min" ? "s" : "min")} · jam:menit:detik ${hms}`,
  bad: "Masukkan angka 0 atau lebih (desimal pakai titik, paling banyak 6 angka di belakang titik dan 15 digit bulat)",
  lineIn: "Input",
  lineReadable: "Jam, menit, detik",
  partsSub: (min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string) =>
    `${withUnitId(min, "min")}${ms.seconds === "0" ? "" : ` (${ms.minutes.toLocaleString("en-US")} menit ${ms.seconds} detik)`} · ${withUnitId(h, "h")} · ${r}`,
  cardTitle: "Konversi Detik ke Menit dan Jam",
  shareText: "Konversi Detik ke Menit dan Jam - jupocket.com",
};

/** 번체 중국어 — 홍콩판(/zh-hk/tools/sec-convert/)이 쓰고 대만판도 같이 쓸 수 있는 중립 서면어(표기는 lib/hk/sec-convert.ts). */
const ZH_HANT: typeof KO = {
  unit: UNIT_NAME_ZH_HANT,
  withUnit: withUnitZhHant,
  readable: readableZhHant,
  heroLabel: (v: string, unit: Unit) => `${withUnitZhHant(v, unit)}等於`,
  heroSub: (other: string, unit: Unit, hms: string) => `${withUnitZhHant(other, unit === "min" ? "s" : "min")} · 時:分:秒 ${hms}`,
  bad: "請輸入 0 或以上的數字（小數最多6位，整數最多15位）",
  lineIn: "輸入",
  lineReadable: "時分秒",
  partsSub: (min: string, ms: { minutes: bigint; seconds: string }, h: string, r: string) =>
    `${withUnitZhHant(min, "min")}${ms.seconds === "0" ? "" : `（${ms.minutes.toLocaleString("en-US")}分${ms.seconds}秒）`} · ${withUnitZhHant(h, "h")} · ${r}`,
  cardTitle: "秒、分鐘、小時換算",
  shareText: "秒、分鐘、小時換算 - jupocket.com",
};

/** 프랑스어판(/fr/tools/sec-convert/) — 숫자는 fr-FR 꼴(천 단위 좁은 공백·소수 쉼표), 표기는 lib/fr/sec-convert.ts. */
const FR: typeof KO = {
  unit: UNIT_NAME_FR,
  withUnit: withUnitFr,
  readable: readableFr,
  heroLabel: (v: string, unit: Unit) => `${withUnitFr(v, unit)} =`,
  heroSub: (other: string, unit: Unit, hms: string) => `${withUnitFr(other, unit === "min" ? "s" : "min")} · h:mm:ss ${digitsFr(hms)}`,
  bad: "Entrez un nombre positif ou nul (virgule ou point pour les décimales, 6 décimales et 15 chiffres entiers au plus)",
  lineIn: "Valeur",
  lineReadable: "Heures, minutes, secondes",
  partsSub: partsSubFr,
  cardTitle: "Convertir secondes, minutes, heures",
  shareText: "Convertir secondes, minutes, heures - jupocket.com",
};

/** 독일어판(/de/tools/sec-convert/) — 소수 쉼표·천 단위 줄바꿈 없는 공백, 정확히 1만 단수. 표기는 lib/de/sec-convert.ts. */
const DE: typeof KO = {
  unit: UNIT_NAME_DE,
  withUnit: withUnitDe,
  readable: readableDe,
  heroLabel: (v: string, unit: Unit) => `${withUnitDe(v, unit)} =`,
  heroSub: (other: string, unit: Unit, hms: string) => `${withUnitDe(other, unit === "min" ? "s" : "min")} · h:mm:ss ${digitsDe(hms)}`,
  bad: "Bitte eine Zahl ab 0 eingeben (Dezimalstellen mit Komma oder Punkt, höchstens 6 Nachkommastellen und 15 Vorkommastellen)",
  lineIn: "Wert",
  lineReadable: "Stunden, Minuten, Sekunden",
  partsSub: partsSubDe,
  cardTitle: "Sekunden in Minuten umrechnen",
  shareText: "Sekunden in Minuten umrechnen - jupocket.com",
};

/** 스페인어판(/es/tools/sec-convert/) — 소수 쉼표·다섯 자리 이상만 공백 묶음, 1만 단수. 표기는 lib/es/sec-convert.ts. */
const ES: typeof KO = {
  unit: UNIT_NAME_ES,
  withUnit: withUnitEs,
  readable: readableEs,
  heroLabel: heroLabelEs,
  heroSub: heroSubEs,
  bad: "Escribe un número igual o mayor que 0 (decimales con coma o punto, hasta 6 decimales y 15 cifras enteras)",
  lineIn: "Valor",
  lineReadable: "Horas, minutos y segundos",
  partsSub: partsSubEs,
  cardTitle: "Convertir segundos a minutos y horas",
  shareText: "Convertir segundos a minutos y horas - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA, en: EN, id: ID, "zh-Hant": ZH_HANT, fr: FR, de: DE, es: ES });
/** 입력 읽기·숫자 칸 표기 — 프랑스어·독일어·스페인어판만 쉼표 소수를 읽고 그 나라 꼴로 쓴다. 다른 판은 그대로. */
const readIn = pickLang<(raw: string) => string>({ ko: (raw) => raw, fr: readInputFr, de: readInputDe, es: readInputEs });
const num = pickLang<(s: string) => string>({ ko: (s) => s, fr: digitsFr, de: digitsDe, es: digitsEs });

let lastLines: [string, string][] = [];

function compute() {
  const unit = unitIn.value as Unit;
  const n = toNanos(readIn(valIn.value), unit);
  if (n === null) {
    set("err", S.bad);
    set("hero-value", "—");
    set("hero-sub", "");
    for (const u of UNITS) set(`v-${u}`, "—");
    lastLines = [];
    return;
  }
  set("err", "");
  const all = convertAll(n);
  set("hero-label", S.heroLabel(all[unit], unit));
  set("hero-value", S.readable(n));
  set("hero-sub", S.heroSub(all[unit === "min" ? "s" : "min"], unit, clock(n)));
  for (const u of UNITS) set(`v-${u}`, num(all[u]));
  lastLines = [
    [S.lineIn, S.withUnit(all[unit], unit)],
    [S.lineReadable, S.readable(n)],
    [S.unit.s, num(all.s)],
    [S.unit.min, num(all.min)],
    [S.unit.h, num(all.h)],
  ];
}

function computeParts() {
  const n = partsToNanos(readIn(parts[0].value), readIn(parts[1].value), readIn(parts[2].value), readIn(parts[3].value));
  if (n === null) {
    set("p-err", S.bad);
    set("p-value", "—");
    set("p-sub", "");
    return;
  }
  set("p-err", "");
  const all = convertAll(n);
  set("p-value", S.withUnit(all.s, "s"));
  set("p-sub", S.partsSub(all.min, minSec(n), all.h, S.readable(n)));
}

valIn.addEventListener("input", () => {
  reportUse(1);
  compute();
});
unitIn.addEventListener("change", () => {
  reportUse(1);
  compute();
});
for (const p of parts)
  p.addEventListener("input", () => {
    reportUse(1);
    computeParts();
  });

const buildCard = () => renderCard({ title: S.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "sec-convert" });
  downloadCard(buildCard(), "sec-convert-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "sec-convert" });
  await shareCard(buildCard(), S.shareText);
});

compute();
computeParts();
