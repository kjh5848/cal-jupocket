/**
 * HUG 전세대출 체크리스트 일정 — /guide/hug-jeonse-checklist/.
 * 날짜는 src/lib/hug-jeonse.ts hugSchedule() 가 낸다. 여기서는 입력을 읽고 목록과 캘린더 파일(.ics)을 만든다.
 * .ics 는 브라우저 안에서 만들어 내려받는다(날짜가 밖으로 나가지 않는다).
 * "알림 받기"를 누른 경우에만 할 일 key·날짜를 알림 서버(api.jupocket.com)로 보낸다 — scripts/push-reminders.ts
 */
import { hugSchedule, type ScheduleItem } from "../lib/hug-jeonse";
import { toDay, fromDay } from "../lib/date-calc";
import { trackCalculatorUse } from "../lib/track";
import { setupPush } from "./push-reminders";

const reportUse = trackCalculatorUse("hug-jeonse-schedule");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const contract = $<HTMLInputElement>("hs-contract");
const start = $<HTMLInputElement>("hs-start");
const moveIn = $<HTMLInputElement>("hs-movein");
const end = $<HTMLInputElement>("hs-end");
let current: ScheduleItem[] = [];

function render() {
  const c = toDay(contract.value), s = toDay(start.value), m = toDay(moveIn.value), e = toDay(end.value);
  const list = $("hs-list");
  if (c === null || s === null || m === null || e === null || e <= s) {
    current = [];
    const li = document.createElement("li");
    li.textContent = "네 날짜를 모두 넣고, 만료일이 잔금일보다 뒤인지 확인하세요.";
    list.replaceChildren(li);
    return;
  }
  current = hugSchedule({ contract: c, start: s, moveIn: m, end: e });
  list.replaceChildren(
    ...current.map((i) => {
      const li = document.createElement("li");
      const parts: [string, string][] = [["hug-date", fromDay(i.day)], ["", i.title], ["hug-what", i.what], ["hug-basis", `근거 · ${i.basis}`]];
      for (const [cls, text] of parts) {
        const el = document.createElement(cls ? "span" : "strong");
        if (cls) el.className = cls;
        el.textContent = text;
        li.append(el);
      }
      return li;
    }),
  );
}

const icsDate = (day: number) => fromDay(day).replaceAll("-", "");
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

function downloadIcs() {
  if (!current.length) return;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//jupocket//hug-jeonse//KO", "CALSCALE:GREGORIAN"];
  for (const i of current) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${i.key}-${icsDate(i.day)}@jupocket.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(i.day)}`,
      `DTEND;VALUE=DATE:${icsDate(i.day + 1)}`,
      `SUMMARY:${esc(`[전세] ${i.title}`)}`,
      `DESCRIPTION:${esc(`${i.what}\n근거: ${i.basis}\nhttps://jupocket.com/guide/hug-jeonse-checklist/`)}`,
      "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${esc(i.title)}`, "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "jeonse-schedule.ics" });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (typeof window.gtag === "function") window.gtag("event", "ics_download", { calculator: "hug-jeonse-schedule", items: current.length });
}

for (const el of [contract, start, moveIn, end]) {
  el.addEventListener("change", () => {
    render();
    reportUse(1);
  });
}
$("hs-ics").addEventListener("click", downloadIcs);
setupPush($<HTMLButtonElement>("hs-push"), $("hs-push-msg"), $<HTMLButtonElement>("hs-push-off"), () =>
  current.map((i) => ({ key: i.key, date: fromDay(i.day) })),
);
render();
