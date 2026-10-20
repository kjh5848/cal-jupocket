import { parseTime, text24, text12, spoken, textEn, boundary } from "../lib/time-12-24";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("time-12-24");

const $ = (id: string) => document.getElementById(id)!;
const inp = $("t-in") as HTMLInputElement;
const set = (id: string, text: string) => {
  $(id).textContent = text;
};

let lastLines: [string, string][] = [];

function compute() {
  const p = parseTime(inp.value);
  if (!p) {
    set("err", "예: 오후 3:40 · 15:40 · 3:40 PM · 정오 · 자정 (24시간제는 0~23시, 12시간제는 1~12시)");
    for (const id of ["hero-label", "hero-value", "hero-sub", "v-24", "v-12", "v-say", "v-en"]) set(id, "—");
    lastLines = [];
    return;
  }
  set("err", "");
  const b = boundary(p.min);
  const tag = b ? ` (${b})` : "";
  const [main, other] = p.from === "12" ? [text24(p.min), text12(p.min)] : [text12(p.min), text24(p.min)];
  set("hero-label", `${other}${tag} =`);
  set("hero-value", main);
  set("hero-sub", `${spoken(p.min)} · ${textEn(p.min)}`);
  set("v-24", text24(p.min));
  set("v-12", text12(p.min) + tag);
  set("v-say", spoken(p.min));
  set("v-en", textEn(p.min));
  lastLines = [
    ["24시간제", text24(p.min)],
    ["12시간제", text12(p.min) + tag],
    ["말로 읽기", spoken(p.min)],
    ["영어", textEn(p.min)],
  ];
}

inp.addEventListener("input", () => {
  reportUse(1);
  compute();
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-t]")) {
  b.addEventListener("click", () => {
    inp.value = b.dataset.t!;
    reportUse(1);
    compute();
  });
}

const buildCard = () => renderCard({ title: "12·24시간제 변환", lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "time-12-24" });
  downloadCard(buildCard(), "time-12-24-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "time-12-24" });
  await shareCard(buildCard(), "12·24시간제 변환 - jupocket.com");
});

compute();
