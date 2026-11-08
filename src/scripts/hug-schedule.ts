/**
 * HUG 전세대출 체크리스트 일정 — /guide/hug-jeonse-checklist/.
 * 날짜는 src/lib/hug-jeonse.ts hugSchedule() 가 낸다. 여기서는 입력을 읽고 목록과 캘린더 파일(.ics)을 만든다.
 * .ics 는 브라우저 안에서 만들어 내려받는다(날짜가 밖으로 나가지 않는다).
 * 채팅(HugChat)에서 짠 일정은 이 브라우저에 저장돼 있다가 여기 칸을 채운다(jeonse-plan-store).
 * "알림 받기"를 누른 경우에만 할 일 key·날짜를 알림 서버(api.jupocket.com)로 보낸다 — scripts/push-reminders.ts
 */
import { hugSchedule, type ScheduleItem } from "../lib/hug-jeonse";
import { toDay, fromDay } from "../lib/date-calc";
import { plan, nextItem, findTerm } from "../lib/jeonse-guide";
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
const today = () => {
  const n = new Date();
  return toDay(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`)!;
};

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
  const items = plan({ contract: c, start: s, moveIn: m, end: e }, today());
  const nxt = nextItem(items);
  list.replaceChildren(
    ...items.map((i) => {
      const li = document.createElement("li");
      if (i.past) li.className = "hug-past";
      else if (i === nxt) li.className = "hug-next";
      const date = Object.assign(document.createElement("span"), { className: "hug-date", textContent: `${i.when} · ${i.dday}${i === nxt ? " · 다음 할 일" : ""}` });
      const title = Object.assign(document.createElement("strong"), { textContent: i.title });
      const what = Object.assign(document.createElement("span"), { className: "hug-what", textContent: i.what });
      li.append(date, title, what);
      if (i.terms.length) {
        const row = Object.assign(document.createElement("span"), { className: "hug-terms" });
        for (const t of i.terms) {
          const b = Object.assign(document.createElement("button"), { type: "button", textContent: `${t.split("(")[0]} 뜻` });
          b.setAttribute("aria-expanded", "false");
          b.addEventListener("click", () => {
            const open = li.querySelector(`[data-term="${CSS.escape(t)}"]`);
            if (open) {
              open.remove();
              b.setAttribute("aria-expanded", "false");
              return;
            }
            const def = findTerm(t);
            if (!def) return;
            const p = Object.assign(document.createElement("span"), { className: "hug-term-def", textContent: `${def.t} — ${def.d}` });
            p.dataset.term = t;
            row.after(p);
            b.setAttribute("aria-expanded", "true");
          });
          row.append(b);
        }
        li.append(row);
      }
      li.append(Object.assign(document.createElement("span"), { className: "hug-basis", textContent: `근거 · ${i.basis}` }));
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
