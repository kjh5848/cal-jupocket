/**
 * 내 전세 일정(계약일·잔금일·전입일·만료일)을 이 브라우저에만 저장한다 — 채팅에서 짠 일정을
 * 체크리스트 페이지의 일정 칸·캘린더 파일·알림이 이어받는다. 서버로 보내지 않는다(알림을 켤 때만 할 일 날짜가 간다).
 */
import type { ScheduleItem } from "../lib/hug-jeonse";
import { fromDay } from "../lib/date-calc";

const KEY = "jp-jeonse-plan";

export interface SavedPlan {
  contract: string;
  start: string;
  moveIn: string;
  end: string;
}

export function loadPlan(): SavedPlan | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null") as SavedPlan | null;
    return p && [p.contract, p.start, p.moveIn, p.end].every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)) ? p : null;
  } catch {
    return null;
  }
}

export function savePlan(p: SavedPlan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* 저장이 막혀도 일정은 화면에 보인다 */
  }
}

export function clearPlan() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

const icsDate = (day: number) => fromDay(day).replaceAll("-", "");
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

/** 캘린더 파일(.ics)을 브라우저 안에서 만들어 내려받는다 — 날짜가 밖으로 나가지 않는다 */
export function downloadIcs(items: ScheduleItem[], from: string) {
  if (!items.length) return;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//jupocket//hug-jeonse//KO", "CALSCALE:GREGORIAN"];
  for (const i of items) {
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
  if (typeof window.gtag === "function") window.gtag("event", "ics_download", { calculator: from, items: items.length });
}
