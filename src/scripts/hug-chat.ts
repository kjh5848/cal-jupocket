/**
 * 전세 도우미 — components/HugChat.astro 의 동작(2026-11-08 개편, 같은 날 UI 정리).
 *
 * 화면: 말풍선·안쪽 스크롤 없이 "내가 고른 말 + 답" 한 묶음(turn)씩 아래로 붙는다. 새 묶음이 생기면 앞 묶음은 한 줄로 접힌다.
 *
 * 1. 처음에 "지금 어느 단계세요?"를 묻는다(집 보는 중 / 계약함 / 살고 있음 / 문제가 생김)
 * 2. 일정 짜기: 계약일 → 잔금일 → 전입일 → 계약기간을 하나씩 묻고, 날짜·요일·D-day 로 할 일을 보여 준다
 *    (계산은 lib/jeonse-guide plan() → hugSchedule()). 일정은 이 브라우저에만 저장(jeonse-plan-store)
 * 3. 상황 안내·집주인 연락 기록·용어 뜻은 lib/jeonse-guide 의 확인된 자료로 바로 답한다(AI 안 씀)
 * 4. 그 밖의 글 질문만 AI(api.jupocket.com/api/hug-chat)로 보낸다 — 최근 대화를 함께 보내고 서버는 저장하지 않는다
 *
 * GA4: hug_chat_stage · hug_plan_done · hug_guide(id) · hug_term · hug_chat_send · hug_chat_answer · hug_chat_error · hug_chat_reset
 */
import { PUSH_API } from "../data/push";
import { plan, nextItem, localAnswer, findTerm, GUIDES, HOUSE_GUIDES, CONTACT, type Guide, type PlanItem } from "../lib/jeonse-guide";
import { toDay, fromDay, addMonths } from "../lib/date-calc";
import { loadPlan, savePlan, clearPlan, downloadIcs, type SavedPlan } from "./jeonse-plan-store";

interface Msg {
  role: "user" | "assistant";
  content: string;
}
interface Res {
  ok: boolean;
  text?: string;
  lines?: { label: string; value: string }[];
  sources?: { name: string; url: string }[];
  note?: string;
  error?: string;
}
type Level = "new" | "some" | "ready";

const log = document.getElementById("hc-log");
const form = document.getElementById("hc-form") as HTMLFormElement | null;
const input = document.getElementById("hc-q") as HTMLInputElement | null;
const go = document.getElementById("hc-go") as HTMLButtonElement | null;
const chips = document.getElementById("hc-chips");
const reset = document.getElementById("hc-reset");
const greeting = log?.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
let history: Msg[] = [];
let busy = false;
let level: Level | null = null;

const track = (name: string, p: Record<string, unknown> = {}) => {
  if (typeof window.gtag === "function") window.gtag("event", name, p);
};
const todayDay = () => {
  const n = new Date();
  return toDay(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`)!;
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
let turn: HTMLElement | null = null;
/** 새로 붙은 내용이 화면 밖이면 보이게(페이지 스크롤, 채팅 안 스크롤 없음) */
function scrollDown() {
  const target = chips && !chips.hidden && chips.childElementCount ? chips : turn;
  target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
/** 내가 고른 말로 새 묶음을 연다 — 앞 묶음은 한 줄로 접는다 */
function openTurn(label: string) {
  log?.querySelectorAll(".hc-turn").forEach((t) => t.classList.add("hc-old"));
  turn = el("div", undefined, "hc-turn");
  const me = el("button", label, "hc-user");
  me.type = "button";
  const t = turn;
  me.addEventListener("click", () => t.classList.contains("hc-old") && t.classList.remove("hc-old"));
  turn.append(me);
  log?.append(turn);
}
function bubble(who: "user" | "bot", text?: string) {
  if (who === "user") {
    openTurn(text ?? "");
    return turn!;
  }
  const b = el("div", undefined, "hc-bot");
  if (text) b.append(el("p", text));
  (turn ?? log)?.append(b);
  scrollDown();
  return b;
}
function sourcesEl(list: { name: string; url: string }[]) {
  const s = el("p", undefined, "hc-src");
  s.append(el("span", "출처"));
  for (const x of list) {
    const a = el("a", x.name);
    a.href = x.url;
    a.target = "_blank";
    a.rel = "noopener";
    s.append(a);
  }
  return s;
}
/** 대화 기록(AI 맥락용)에 남긴다 — 사용자 말 + 보인 답 요약 */
function remember(user: string, bot: string) {
  history.push({ role: "user", content: user }, { role: "assistant", content: bot.slice(0, 500) });
}

/* ── 버튼(칩) ─────────────────────────────────────────── */

interface Chip {
  label: string;
  run: () => void;
  primary?: boolean;
}
function showChips(list: Chip[]) {
  if (!chips) return;
  chips.replaceChildren(
    ...list.map((c) => {
      const b = el("button", c.label);
      b.type = "button";
      if (c.primary) b.className = "hc-primary";
      b.addEventListener("click", () => {
        if (busy) return;
        c.run();
      });
      return b;
    }),
  );
  chips.hidden = !list.length;
}
/** 같은 묶음 안의 짧은 내 답(날짜 고르기 중간) */
const note = (text: string) => {
  (turn ?? log)?.append(el("p", text, "hc-sub"));
};
const say = (label: string) => {
  if (reset) reset.hidden = false;
  bubble("user", label);
};

/* ── 단계 ─────────────────────────────────────────────── */

const STAGES: { id: string; label: string; level: Level; run: () => void }[] = [
  { id: "house", label: "🏠 집 보는 중이에요", level: "new", run: stageHouse },
  { id: "contract", label: "✍️ 계약했어요(날짜가 정해졌어요)", level: "ready", run: () => startPlan() },
  { id: "living", label: "🏡 이미 살고 있어요", level: "some", run: stageLiving },
  { id: "trouble", label: "😟 집주인과 문제가 생겼어요", level: "some", run: stageTrouble },
];

function showStages() {
  const saved = loadPlan();
  showChips([
    ...(saved ? [{ label: "📅 지난번 내 일정 다시 보기", primary: true, run: () => (say("지난번 내 일정 다시 보기"), showPlan(saved)) }] : []),
    ...STAGES.map((s) => ({
      label: s.label,
      run: () => {
        level = s.level;
        say(s.label);
        track("hug_chat_stage", { stage: s.id });
        s.run();
      },
    })),
  ]);
}

function stageHouse() {
  const text = "좋아요, 대부분 이 단계에서 시작해요. 집을 고르기 전·보러 갈 때·가격 볼 때 챙길 것을 HUG 전세사기예방센터 안내로 정리해 뒀어요. 궁금한 것부터 눌러 보세요.";
  bubble("bot", text);
  remember("집 보는 중이에요", text);
  showChips([
    ...HOUSE_GUIDES.map((g) => guideChip(g)),
    guideChip(GUIDES.find((g) => g.id === "before-contract")!),
    { label: "📅 계약 날짜가 정해지면 일정 짜기", run: () => (say("계약 날짜로 일정 짜기"), startPlan()) },
  ]);
}
function stageLiving() {
  const text = "살고 계시면 지금 챙길 건 두 가지예요. 보증 가입·갱신 통보 기한이 언제인지, 그리고 집주인과 주고받는 말을 기록으로 남기는 것이에요.";
  bubble("bot", text);
  remember("이미 살고 있어요", text);
  showChips([
    { label: "📅 내 계약 날짜로 할 일 보기", primary: true, run: () => (say("내 계약 날짜로 할 일 보기"), startPlan()) },
    guideChip(GUIDES.find((g) => g.id === "renewal")!),
    guideChip(CONTACT),
  ]);
}
function stageTrouble() {
  const text = "많이 답답하시죠. 순서대로 같이 볼게요. 어떤 상황인지 골라 주시거나 아래 칸에 적어 주세요.";
  bubble("bot", text);
  remember("집주인과 문제가 생겼어요", text);
  showChips([guideChip(GUIDES.find((g) => g.id === "not-returned")!), guideChip(GUIDES.find((g) => g.id === "renewal")!), guideChip(CONTACT)]);
}

/* ── 상황 안내·용어 ───────────────────────────────────── */

function guideChip(g: Guide): Chip {
  return { label: g.ask, run: () => (say(g.ask), showGuide(g)) };
}

function showGuide(g: Guide) {
  const b = bubble("bot");
  const ol = el("ol", undefined, "hc-steps");
  for (const s of g.steps) ol.append(el("li", s));
  b.append(ol);
  if (g.record?.length) {
    b.append(el("p", "📝 기록 남기기", "hc-sub"));
    const ul = el("ul", undefined, "hc-steps");
    for (const s of g.record) ul.append(el("li", s));
    b.append(ul);
  }
  b.append(sourcesEl(g.sources));
  scrollDown();
  remember(g.ask, [...g.steps, ...(g.record ?? [])].join(" "));
  track("hug_guide", { id: g.id });
  const next: Chip[] = [];
  if (g.id !== CONTACT.id && g.record) next.push(guideChip(CONTACT));
  if (HOUSE_GUIDES.includes(g)) next.push(...[...HOUSE_GUIDES, GUIDES.find((x) => x.id === "before-contract")!].filter((x) => x !== g).map(guideChip));
  next.push({ label: "📅 일정 짜기", run: () => (say("일정 짜기"), startPlan()) }, { label: "처음으로", run: restart });
  showChips(next);
}

function showTerm(name: string, fromUser?: string) {
  const t = findTerm(name);
  if (!t) return;
  if (!fromUser) say(`'${t.t.split("(")[0]}' 뜻이 뭐예요?`);
  const b = bubble("bot");
  b.append(el("p", t.t, "hc-sub"), el("p", t.d), sourcesEl([{ name: "원문", url: t.src }]));
  scrollDown();
  remember(fromUser ?? `${t.t} 뜻`, `${t.t}: ${t.d}`);
  track("hug_term");
}

/* ── 일정 짜기 ────────────────────────────────────────── */

/** 말풍선 안 날짜 입력 하나 — 확인을 누르면 done(날짜) */
function askDate(question: string, hint: string, done: (v: string) => void) {
  const b = bubble("bot", question);
  if (hint) b.append(el("p", hint, "hc-note"));
  const row = el("div", undefined, "hc-date");
  const d = el("input");
  d.type = "date";
  d.min = "2000-01-01";
  d.max = "2099-12-31";
  d.setAttribute("aria-label", question);
  const ok = el("button", "확인");
  ok.type = "button";
  ok.addEventListener("click", () => {
    if (!d.value || toDay(d.value) === null) return d.focus();
    row.replaceWith(el("p", `→ ${Number(d.value.slice(0, 4))}년 ${Number(d.value.slice(5, 7))}월 ${Number(d.value.slice(8, 10))}일`, "hc-sub"));
    done(d.value);
  });
  row.append(d, ok);
  b.append(row);
  scrollDown();
  showChips([]);
}

function startPlan() {
  const p: Partial<SavedPlan> = {};
  askDate("계약서를 쓴 날(또는 쓸 날)이 언제예요?", "아직 정해지지 않았다면 예정일을 넣어도 돼요. 나중에 바꿀 수 있어요.", (v) => {
    p.contract = v;
    askStart(p);
  });
}
function askStart(p: Partial<SavedPlan>) {
  askDate("잔금을 치르고 들어가는 날(잔금일)은요?", "", (s) => {
    if (toDay(s)! < toDay(p.contract!)!) {
      bubble("bot", "잔금일이 계약일보다 앞이에요. 다시 골라 주세요.");
      return askStart(p);
    }
    p.start = s;
    askMoveIn(p);
  });
}
function askMoveIn(p: Partial<SavedPlan>) {
  bubble("bot", "전입신고는 잔금일에 같이 하실 건가요? 같은 날 하는 게 가장 안전해요.");
  showChips([
    { label: "네, 같은 날 해요", primary: true, run: () => (note("→ 같은 날"), (p.moveIn = p.start), askTerm(p)) },
    { label: "다른 날이에요", run: () => (note("→ 다른 날"), askDate("전입신고하는 날은요?", "", (m) => ((p.moveIn = m), askTerm(p)))) },
  ]);
}
function askTerm(p: Partial<SavedPlan>) {
  bubble("bot", "계약 기간은요?");
  const endAfter = (months: number) => fromDay(addMonths(toDay(p.start!)!, months) - 1);
  showChips([
    { label: "2년", primary: true, run: () => (note("→ 2년"), finish({ ...p, end: endAfter(24) } as SavedPlan)) },
    { label: "1년", run: () => (note("→ 1년"), finish({ ...p, end: endAfter(12) } as SavedPlan)) },
    { label: "만료일 직접 고르기", run: () => askDate("계약이 끝나는 날은요?", "", (e) => finish({ ...p, end: e } as SavedPlan)) },
  ]);
}

function finish(p: SavedPlan) {
  if (toDay(p.end)! <= toDay(p.start)!) {
    bubble("bot", "만료일이 잔금일보다 앞이에요. 처음부터 다시 넣어 주세요.");
    return startPlan();
  }
  savePlan(p);
  syncPageSchedule(p);
  track("hug_plan_done");
  showPlan(p);
}

function itemsOf(p: SavedPlan): PlanItem[] {
  return plan({ contract: toDay(p.contract)!, start: toDay(p.start)!, moveIn: toDay(p.moveIn)!, end: toDay(p.end)! }, todayDay());
}

function showPlan(p: SavedPlan) {
  const items = itemsOf(p);
  const nxt = nextItem(items);
  const card = document.getElementById("hs-card");
  const b = bubble("bot");
  const sum = el("div", undefined, "hc-summary");
  sum.append(el("p", nxt ? "가장 먼저 할 일" : "모든 날짜가 지났어요", "hc-sub"));
  if (nxt) sum.append(el("p", `${nxt.when} · ${nxt.dday}\n${nxt.title}`));
  b.append(sum);
  remember("내 전세 일정", items.map((i) => `${i.when} ${i.title}`).join(" / "));
  if (card) {
    syncPageSchedule(p);
    b.append(el("p", `할 일 ${items.length}가지를 날짜·요일·D-day로 아래 일정 표에 채워 뒀어요. 표에서 용어 뜻도 바로 볼 수 있어요.`));
  } else {
    const ol = el("ol", undefined, "hc-plan");
    for (const i of items) {
      const li = el("li", undefined, i.past ? "hc-past" : i === nxt ? "hc-next" : undefined);
      li.append(el("b", `${i.when} · ${i.dday}`), el("p", i.title));
      ol.append(li);
    }
    b.append(ol);
  }
  scrollDown();
  showChips([
    ...(card ? [{ label: "📋 아래 일정 표 보기", primary: true, run: () => card.scrollIntoView({ behavior: "smooth", block: "start" }) }] : []),
    { label: "📆 내 캘린더에 넣기", primary: !card, run: () => (downloadIcs(items, "hug-chat-plan"), note("→ 캘린더 파일을 내려받았어요. 열면 휴대폰·PC 캘린더에 날짜가 들어가요.")) },
    card
      ? { label: "🔔 알림 받기", run: () => pushOnPage() }
      : { label: "🔔 알림 받기(체크리스트에서)", run: () => (location.href = "/guide/hug-jeonse-checklist/#hs-card") },
    guideChip(CONTACT),
    { label: "날짜 다시 넣기", run: () => (say("날짜 다시 넣기"), startPlan()) },
    { label: "일정 지우기", run: () => (say("일정 지우기"), clearPlan(), bubble("bot", "이 브라우저에 저장된 일정을 지웠어요."), showStages()) },
  ]);
}

/** 체크리스트 페이지면 아래 일정 칸을 같은 날짜로 채운다 */
function syncPageSchedule(p: SavedPlan) {
  const ids: [string, string][] = [["hs-contract", p.contract], ["hs-start", p.start], ["hs-movein", p.moveIn], ["hs-end", p.end]];
  for (const [id, v] of ids) {
    const i = document.getElementById(id) as HTMLInputElement | null;
    if (!i) return;
    i.value = v;
  }
  document.getElementById("hs-end")?.dispatchEvent(new Event("change"));
}
function pushOnPage() {
  const btn = document.getElementById("hs-push") as HTMLButtonElement | null;
  if (!btn) return;
  btn.click(); // 같은 클릭 안에서 눌러야 알림 허용 창이 뜬다
  note("→ 알림 허용 창이 뜨면 '허용'을 눌러 주세요. 결과는 아래 일정 표의 알림 안내에 나와요. 아이폰은 홈 화면에 추가한 앱에서만 돼요.");
  btn.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ── 글로 물을 때 ─────────────────────────────────────── */

function botAnswer(r: Res) {
  const b = bubble("bot", (r.text ?? "답을 만들지 못했어요.").replace(/\s+·\s+/g, "\n· "));
  if (r.lines?.length) {
    const dl = el("dl");
    for (const l of r.lines) dl.append(el("dt", l.label), el("dd", l.value));
    b.append(dl);
  }
  if (r.sources?.length) b.append(sourcesEl(r.sources));
  if (r.note) b.append(el("p", r.note, "hc-note"));
  scrollDown();
}

async function send(q: string) {
  const text = q.trim().slice(0, 500);
  if (!text || busy || !go) return;
  say(text);

  // 1) 확인된 자료에서 먼저 찾는다(AI 를 부르지 않는다)
  const local = localAnswer(text);
  if (local?.kind === "term") return showTerm(local.term.t, text);
  if (local?.kind === "guide") return showGuide(local.guide);
  if (/일정|스케줄|언제까지|날짜/.test(text) && !/보증료|얼마/.test(text)) {
    bubble("bot", "날짜를 하나씩 여쭤볼게요.");
    return startPlan();
  }

  // 2) 그 밖의 질문은 AI
  if (chips) chips.hidden = true;
  busy = true;
  go.disabled = true;
  history.push({ role: "user", content: text });
  const wait = bubble("bot", "답을 찾는 중…");
  wait.classList.add("hc-typing");
  track("hug_chat_send", { turn: history.filter((m) => m.role === "user").length });
  try {
    const res = await fetch(`${PUSH_API}/api/hug-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12), page: location.pathname, level }),
    });
    const r = (await res.json().catch(() => ({ ok: false }))) as Res;
    wait.remove();
    if (res.status === 429) {
      botAnswer({ ok: false, text: "오늘은 상담이 많아 AI가 잠시 쉬어요. 일정 짜기·상황 안내·용어 버튼은 그대로 쓸 수 있어요. AI 질문은 내일 오전 9시 뒤에 다시 해 주세요." });
      history.pop();
      showStages();
    } else if (!r.ok) throw new Error(String(res.status));
    else {
      botAnswer(r);
      const linesTxt = r.lines?.map((l) => `${l.label}: ${l.value}`).join("\n");
      history.push({ role: "assistant", content: [r.text ?? "", linesTxt].filter(Boolean).join("\n").slice(0, 500) });
      track("hug_chat_answer", { kind: r.lines ? "check" : r.sources?.length ? "kb" : "fallback" });
    }
  } catch {
    wait.remove();
    history.pop();
    botAnswer({ ok: false, text: "지금은 답을 받지 못했어요. 잠시 뒤 다시 보내 주세요." });
    track("hug_chat_error");
  } finally {
    busy = false;
    go.disabled = false;
  }
}

/* ── 입력·처음으로 ────────────────────────────────────── */

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input) return;
  const q = input.value;
  input.value = "";
  send(q);
});
input?.addEventListener("keydown", (e) => {
  // 한글 조합을 끝내는 엔터로는 보내지 않는다
  if (e.key === "Enter" && e.isComposing) e.preventDefault();
});

function restart() {
  if (busy || !log) return;
  history = [];
  level = null;
  turn = null;
  log.replaceChildren(...(greeting ? [greeting.cloneNode(true)] : []));
  if (reset) reset.hidden = true;
  showStages();
  track("hug_chat_reset");
}
reset?.addEventListener("click", restart);
showStages();
