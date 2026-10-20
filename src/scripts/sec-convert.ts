import { toNanos, partsToNanos, convertAll, readable, readableJa, clock, UNITS, UNIT_NAME, UNIT_NAME_JA, type Unit } from "../lib/sec-convert";
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
 * 화면 문구 — 한국어판(/tools/sec-convert/)과 일본어판(/ja/tools/sec-convert/)이 같은 계산(lib/sec-convert.ts)을 쓴다.
 */
const KO = {
  unit: UNIT_NAME,
  readable,
  heroLabel: (v: string, unit: Unit) => `${v}${UNIT_NAME[unit]}${unit === "s" || unit === "ms" ? "는" : "은"}`,
  heroSub: (other: string, unit: Unit, hms: string) => `${other}${unit === "min" ? "초" : "분"} · 시:분:초 ${hms}`,
  bad: "0 이상의 숫자만 넣어 주세요 (소수는 여섯째 자리까지, 정수는 15자리까지)",
  lineIn: "입력",
  lineReadable: "풀어 쓰면",
  partsSub: (min: string, h: string, r: string) => `${min}분 · ${h}시간 · ${r}`,
  cardTitle: "초·분·시간 변환",
  shareText: "초·분·시간 변환 - jupocket.com",
};

const JA: typeof KO = {
  unit: UNIT_NAME_JA,
  readable: readableJa,
  heroLabel: (v: string, unit: Unit) => `${v}${UNIT_NAME_JA[unit]}は`,
  heroSub: (other: string, unit: Unit, hms: string) => `${other}${unit === "min" ? "秒" : "分"} ・ 時:分:秒 ${hms}`,
  bad: "0以上の数字を入れてください（小数は6桁まで、整数は15桁まで）",
  lineIn: "入力",
  lineReadable: "何時間何分何秒",
  partsSub: (min: string, h: string, r: string) => `${min}分 ・ ${h}時間 ・ ${r}`,
  cardTitle: "秒・分・時間 変換",
  shareText: "秒・分・時間 変換 - jupocket.com",
};

const S = pickLang({ ko: KO, ja: JA });

let lastLines: [string, string][] = [];

function compute() {
  const unit = unitIn.value as Unit;
  const n = toNanos(valIn.value, unit);
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
  for (const u of UNITS) set(`v-${u}`, all[u]);
  lastLines = [
    [S.lineIn, `${all[unit]}${S.unit[unit]}`],
    [S.lineReadable, S.readable(n)],
    [S.unit.s, all.s],
    [S.unit.min, all.min],
    [S.unit.h, all.h],
  ];
}

function computeParts() {
  const n = partsToNanos(parts[0].value, parts[1].value, parts[2].value, parts[3].value);
  if (n === null) {
    set("p-err", S.bad);
    set("p-value", "—");
    set("p-sub", "");
    return;
  }
  set("p-err", "");
  const all = convertAll(n);
  set("p-value", `${all.s}${S.unit.s}`);
  set("p-sub", S.partsSub(all.min, all.h, S.readable(n)));
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
