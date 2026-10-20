import { parseTime, text24, text12, spoken, textEn, boundary, boundaryEn } from "../lib/time-12-24";
import { renderCard, downloadCard, shareCard } from "../lib/result-card";
import { track, trackCalculatorUse } from "../lib/track";
import { pickLang } from "../i18n/ui";

/** 계산기를 실제로 썼는지 — 한 방문에 한 번만 보고한다. */
const reportUse = trackCalculatorUse("time-12-24");

/** 페이지 언어별 문구·표기. 칩 네 칸(v-24·v-12·v-say·v-en)에 무엇을 쓸지도 사전이 정한다. */
interface Dict {
  err: string;
  /** 12시간제 표기 */
  twelve: (min: number) => string;
  /** 정오·자정 이름(나머지는 빈 문자열) */
  tag: (min: number) => string;
  /** 큰 숫자 아래 줄 */
  sub: (min: number) => string;
  /** 셋째·넷째 칩 */
  say: (min: number) => string;
  en: (min: number) => string;
  lines: [string, string, string, string];
  cardTitle: string;
  shareTitle: string;
}

const KO: Dict = {
  err: "예: 오후 3:40 · 15:40 · 3:40 PM · 정오 · 자정 (24시간제는 0~23시, 12시간제는 1~12시)",
  twelve: text12,
  tag: boundary,
  sub: (m) => `${spoken(m)} · ${textEn(m)}`,
  say: spoken,
  en: textEn,
  lines: ["24시간제", "12시간제", "말로 읽기", "영어"],
  cardTitle: "12·24시간제 변환",
  shareTitle: "12·24시간제 변환 - jupocket.com",
};

/** 영어 다섯 판 공용 — 12시간제는 '3:40 PM', 경계는 noon·midnight(NIST 권고 표기를 함께 보임) */
const noColon = (m: number) => text24(m).replace(":", "");
const dotted = (m: number) => textEn(m).replace("AM", "a.m.").replace("PM", "p.m.");
const EN: Dict = {
  err: "Try 3:40 PM, 15:40, 1540, noon or midnight (24-hour times run 0:00 to 23:59, 12-hour times 1 to 12). For the end of a day, enter 00:00 of the next day.",
  twelve: textEn,
  tag: boundaryEn,
  sub: (m) => `${noColon(m)} · ${dotted(m)}`,
  say: noColon,
  en: dotted,
  lines: ["24-hour", "12-hour", "4-digit", "a.m./p.m."],
  cardTitle: "12 to 24 Hour Time Converter",
  shareTitle: "12 to 24 Hour Time Converter - jupocket.com",
};

const T = pickLang<Dict>({ ko: KO, en: EN });

const $ = (id: string) => document.getElementById(id)!;
const inp = $("t-in") as HTMLInputElement;
const set = (id: string, text: string) => {
  $(id).textContent = text;
};

let lastLines: [string, string][] = [];

function compute() {
  const p = parseTime(inp.value);
  if (!p) {
    set("err", T.err);
    for (const id of ["hero-label", "hero-value", "hero-sub", "v-24", "v-12", "v-say", "v-en"]) set(id, "—");
    lastLines = [];
    return;
  }
  set("err", "");
  const b = T.tag(p.min);
  const tag = b ? ` (${b})` : "";
  const [main, other] = p.from === "12" ? [text24(p.min), T.twelve(p.min)] : [T.twelve(p.min), text24(p.min)];
  set("hero-label", `${other}${tag} =`);
  set("hero-value", main);
  set("hero-sub", T.sub(p.min));
  set("v-24", text24(p.min));
  set("v-12", T.twelve(p.min) + tag);
  set("v-say", T.say(p.min));
  set("v-en", T.en(p.min));
  lastLines = [
    [T.lines[0], text24(p.min)],
    [T.lines[1], T.twelve(p.min) + tag],
    [T.lines[2], T.say(p.min)],
    [T.lines[3], T.en(p.min)],
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

const buildCard = () => renderCard({ title: T.cardTitle, lines: lastLines, footer: "jupocket.com" });
$("btn-download").addEventListener("click", () => {
  if (!lastLines.length) return;
  track("save_result", { calculator: "time-12-24" });
  downloadCard(buildCard(), "time-12-24-result.png");
});
$("btn-share").addEventListener("click", async () => {
  if (!lastLines.length) return;
  track("share_result", { calculator: "time-12-24" });
  await shareCard(buildCard(), T.shareTitle);
});

compute();
