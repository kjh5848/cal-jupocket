import { toNanos, partsToNanos, convertAll, readable, clock, UNITS, UNIT_NAME, type Unit } from "../lib/sec-convert";
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
const BAD = "0 이상의 숫자만 넣어 주세요 (소수는 여섯째 자리까지, 정수는 15자리까지)";

let lastLines: [string, string][] = [];

function compute() {
  const unit = unitIn.value as Unit;
  const n = toNanos(valIn.value, unit);
  if (n === null) {
    set("err", BAD);
    set("hero-value", "—");
    set("hero-sub", "");
    for (const u of UNITS) set(`v-${u}`, "—");
    lastLines = [];
    return;
  }
  set("err", "");
  const all = convertAll(n);
  set("hero-label", `${all[unit]}${UNIT_NAME[unit]}${unit === "s" || unit === "ms" ? "는" : "은"}`);
  set("hero-value", readable(n));
  set("hero-sub", `${all[unit === "min" ? "s" : "min"]}${unit === "min" ? "초" : "분"} · 시:분:초 ${clock(n)}`);
  for (const u of UNITS) set(`v-${u}`, all[u]);
  lastLines = [
    ["입력", `${all[unit]}${UNIT_NAME[unit]}`],
    ["풀어 쓰면", readable(n)],
    ["초", all.s],
    ["분", all.min],
    ["시간", all.h],
  ];
}

function computeParts() {
  const n = partsToNanos(parts[0].value, parts[1].value, parts[2].value, parts[3].value);
  if (n === null) {
    set("p-err", BAD);
    set("p-value", "—");
    set("p-sub", "");
    return;
  }
  set("p-err", "");
  const all = convertAll(n);
  set("p-value", `${all.s}초`);
  set("p-sub", `${all.min}분 · ${all.h}시간 · ${readable(n)}`);
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

const buildCard = () => renderCard({ title: "초·분·시간 변환", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "sec-convert" });
  downloadCard(buildCard(), "sec-convert-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "sec-convert" });
  await shareCard(buildCard(), "초·분·시간 변환 - jupocket.com");
});

compute();
computeParts();
