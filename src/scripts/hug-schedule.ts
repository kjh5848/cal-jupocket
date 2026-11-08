/**
 * HUG 전세대출 체크리스트 일정 — /guide/hug-jeonse-checklist/.
 * 날짜는 src/lib/hug-jeonse.ts hugSchedule() 가 낸다. 여기서는 입력을 읽고 목록과 캘린더 파일(.ics)을 만든다.
 * .ics 는 브라우저 안에서 만들어 내려받는다(날짜가 밖으로 나가지 않는다).
 * 채팅(HugChat)에서 짠 일정은 이 브라우저에 저장돼 있다가 여기 칸을 채운다(jeonse-plan-store).
 * "알림 받기"를 누른 경우에만 할 일 key·날짜를 알림 서버(api.jupocket.com)로 보낸다 — scripts/push-reminders.ts
 */
import { hugSchedule, type ScheduleItem } from "../lib/hug-jeonse";
import { toDay, fromDay } from "../lib/date-calc";
import { trackCalculatorUse } from "../lib/track";
import { setupPush } from "./push-reminders";
import { loadPlan, savePlan, downloadIcs } from "./jeonse-plan-store";

const reportUse = trackCalculatorUse("hug-jeonse-schedule");
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const contract = $<HTMLInputElement>("hs-contract");
const start = $<HTMLInputElement>("hs-start");
const moveIn = $<HTMLInputElement>("hs-movein");
const end = $<HTMLInputElement>("hs-end");
let current: ScheduleItem[] = [];
let userChanged = false;

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
  if (userChanged) savePlan({ contract: contract.value, start: start.value, moveIn: moveIn.value, end: end.value });
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

for (const el of [contract, start, moveIn, end]) {
  el.addEventListener("change", () => {
    userChanged = true;
    render();
    reportUse(1);
  });
}
$("hs-ics").addEventListener("click", () => downloadIcs(current, "hug-jeonse-schedule"));
setupPush($<HTMLButtonElement>("hs-push"), $("hs-push-msg"), $<HTMLButtonElement>("hs-push-off"), () =>
  current.map((i) => ({ key: i.key, date: fromDay(i.day) })),
);
const saved = loadPlan();
if (saved) {
  contract.value = saved.contract;
  start.value = saved.start;
  moveIn.value = saved.moveIn;
  end.value = saved.end;
}
render();
