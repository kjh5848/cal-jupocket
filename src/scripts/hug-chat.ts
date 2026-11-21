/**
 * 전세 도우미 — components/HugChat.astro(/jeonse-chat/ 전체 화면 채팅)의 동작.
 *
 * 화면: 내 말은 오른쪽 말풍선, 도우미 답은 왼쪽 본문. 페이지가 스크롤되고 입력창은 아래에 붙는다.
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
import { plan, nextItem, localAnswer, findTerm, termsIn, GUIDES, HOUSE_GUIDES, CONTACT, type Guide, type PlanItem } from "../lib/jeonse-guide";
import { toDay, fromDay, addMonths } from "../lib/date-calc";
import { setupPush } from "./push-reminders";
import { checkAnswer, sourcesFor, type CheckInput } from "../lib/hug-chat-core";
import { amountsIn } from "../lib/loan-parse";
import { DISCOUNT_LABEL, refusalChecks, type HouseType, type PremiumDiscount } from "../lib/hug-jeonse";
import { eok } from "../lib/hug-kb";
import { matchAnswer, ANSWERS_VERIFIED_ON } from "../lib/hug-answers";

const BANK_NOTE = `미리 준비해 둔 답이에요. HUG·주택도시기금·법령 원문에서 JU포켓이 확인한 자료(${ANSWERS_VERIFIED_ON} 대조)로 썼어요. 가입 여부·대출 승인은 HUG와 은행 심사로 정해집니다.`;
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
let history: Msg[] = [];
let busy = false;
let level: Level | null = null;

/**
 * GA4 와 함께 우리 서버에도 횟수만 센다(관리자 화면 /admin/). 보내는 것은 이벤트 이름과 버튼 키뿐이고,
 * q 는 미리 준비한 답으로 답한 글 질문일 때만 넣는다 — GA4 로는 보내지 않는다.
 */
const track = (name: string, p: Record<string, unknown> = {}, q?: string) => {
  if (typeof window.gtag === "function") window.gtag("event", name, p);
  try {
    const k = String(p.id ?? p.stage ?? p.kind ?? p.a ?? p.level ?? p.at ?? "").slice(0, 40);
    navigator.sendBeacon(`${PUSH_API}/api/ev`, JSON.stringify({ n: name, k, page: location.pathname, ...(q ? { q: q.slice(0, 500) } : {}) }));
  } catch {
    /* 집계는 실패해도 화면에 영향이 없다 */
  }
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
/** 새 말이 붙으면 맨 아래로(페이지 스크롤) */
function scrollDown() {
  requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }));
}
/** 카카오톡처럼: 내 말은 오른쪽 노란 말풍선, 도우미 답은 프로필 + 이름 + 흰 말풍선. 도우미 쪽은 말풍선(.hc-body)을 돌려준다 */
function bubble(who: "user" | "bot", text?: string) {
  if (reset) reset.hidden = false;
  if (who === "user") {
    const u = el("div", text, "hc-user");
    log?.append(u);
    scrollDown();
    return u;
  }
  const row = el("div", undefined, "hc-bot");
  const ava = el("span", "JU", "hc-ava");
  ava.setAttribute("aria-hidden", "true");
  const col = el("div", undefined, "hc-col");
  const name = el("span", "전세 도우미", "hc-name");
  const body = el("div", undefined, "hc-body");
  if (text) body.append(el("p", text));
  col.append(name, body);
  row.append(ava, col);
  log?.append(row);
  scrollDown();
  return body;
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

/** 관련 글 — 답 끝에 붙인다 */
const READ = {
  checklist: { href: "/guide/hug-jeonse-checklist/", title: "HUG 전세대출 체크리스트 — 할 일과 기한 전체" },
  calc: { href: "/guide/hug-jeonse-guarantee-calculator/", title: "HUG 전세보증 가능 여부 계산기 — 한도·보증료 표로 보기" },
  dsr: { href: "/guide/dsr-calculator/", title: "DSR 계산기 — 대출 더 받을 수 있는지" },
  prepay: { href: "/guide/prepayment-fee-calculator/", title: "중도상환수수료 계산기" },
};
type ReadKey = keyof typeof READ;
function relatedEl(keys: ReadKey[]) {
  const box = el("div", undefined, "hc-read");
  box.append(el("p", "관련 글", "hc-read-h"));
  for (const k of keys) {
    const a = el("a", READ[k].title);
    a.href = READ[k].href;
    box.append(a);
  }
  return box;
}

/* ── 버튼(칩) ─────────────────────────────────────────── */

interface Chip {
  label: string;
  run: () => void;
  primary?: boolean;
}
/**
 * 고르는 흐름(퀴즈·계산·일정)의 지나온 질문 — 잘못 눌렀을 때 '← 이전'으로 바로 앞 질문을 다시 묻는다.
 * 질문을 띄우는 함수가 맨 앞에서 mark() 로 자기를 다시 부를 방법을 남긴다. 같은 질문을 다시 띄우면(입력 오류 등) 겹쳐 쌓지 않는다.
 */
let trail: { key: string; again: () => void }[] = [];
/** state 를 주면(계산·일정 중간) 진행 상태를 이 브라우저에 남긴다 — 보고 돌아와도 이어서 할 수 있게 */
function mark(key: string, again: () => void, state?: object) {
  if (trail[trail.length - 1]?.key === key) trail.pop();
  trail.push({ key, again });
  if (state) saveResume(key, state);
}

/* ── 하던 계산·일정 이어하기 ────────────────────────────
 * 답할 때마다 {멈춘 질문, 지금까지 답, 시각}을 localStorage 에만 저장한다(서버로 안 보냄).
 * 다시 들어오면 첫 인사 대신 "하던 게 있어요" 카드. 끝내거나 '처음부터'를 누르면 지운다. 하루 지나면 버린다.
 */
const RESUME_KEY = "jp-jeonse-resume";
const RESUME_TTL_MS = 24 * 60 * 60 * 1000;
interface Resume {
  key: string;
  state: Record<string, unknown>;
  at: number;
}
function saveResume(key: string, state: object) {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify({ key, state: state as Record<string, unknown>, at: Date.now() } satisfies Resume));
  } catch {
    /* 저장이 막힌 브라우저 — 이어하기만 안 될 뿐 */
  }
}
function clearResume() {
  try {
    localStorage.removeItem(RESUME_KEY);
  } catch {
    /* 무시 */
  }
}
function loadResume(): Resume | null {
  try {
    const r = JSON.parse(localStorage.getItem(RESUME_KEY) ?? "null") as Resume | null;
    if (!r || typeof r.key !== "string" || typeof r.at !== "number" || !r.state) return null;
    if (Date.now() - r.at > RESUME_TTL_MS || !(r.key in RESUME_AT)) {
      clearResume();
      return null;
    }
    return r;
  } catch {
    return null;
  }
}
/** 멈춘 질문 key → 그 질문을 다시 띄우는 함수 */
const RESUME_AT: Record<string, { what: string; run: (s: Record<string, unknown>) => void }> = {
  "calc-region": { what: "보증 계산 — 지역", run: (s) => calcRegion(s as Partial<CheckInput>) },
  "calc-basis": { what: "보증 계산 — 집값 기준", run: (s) => calcBasis(s as Partial<CheckInput>) },
  "calc-price": { what: "보증 계산 — 집값 입력", run: (s) => calcPrice(s as Partial<CheckInput>) },
  "calc-deposit": { what: "보증 계산 — 보증금", run: (s) => calcDeposit(s as Partial<CheckInput>) },
  "calc-rent": { what: "보증 계산 — 월세", run: (s) => calcRent(s as Partial<CheckInput>) },
  "calc-rent-amount": { what: "보증 계산 — 월세 금액", run: (s) => calcRentAmount(s as Partial<CheckInput>) },
  "calc-senior": { what: "보증 계산 — 근저당", run: (s) => calcSenior(s as Partial<CheckInput>) },
  "calc-others": { what: "보증 계산 — 다른 세입자 보증금", run: (s) => calcOthers(s as Partial<CheckInput>) },
  "calc-others-doc": { what: "보증 계산 — 다른 세입자 서류", run: (s) => calcOthersDoc(s as Partial<CheckInput>) },
  "calc-term": { what: "보증 계산 — 기간", run: (s) => calcTerm(s as Partial<CheckInput>) },
  "calc-discount": { what: "보증 계산 — 할인", run: (s) => calcDiscount(s as Partial<CheckInput>) },
  "calc-loan": { what: "보증 계산 — 전세대출", run: (s) => calcLoan(s as Partial<CheckInput>) },
  "calc-loan-amount": { what: "보증 계산 — 대출 금액", run: (s) => calcLoanAmount(s as Partial<CheckInput>) },
  "plan-start": { what: "일정 짜기 — 잔금일", run: (s) => askStart(s as Partial<SavedPlan>) },
  "plan-movein": { what: "일정 짜기 — 전입일", run: (s) => askMoveIn(s as Partial<SavedPlan>) },
  "plan-movein-date": { what: "일정 짜기 — 전입일", run: (s) => askMoveInDate(s as Partial<SavedPlan>) },
  "plan-term": { what: "일정 짜기 — 계약 기간", run: (s) => askTerm(s as Partial<SavedPlan>) },
  "plan-end": { what: "일정 짜기 — 만료일", run: (s) => askEnd(s as Partial<SavedPlan>) },
};
/** 다시 들어왔을 때 첫 인사 대신 보여 주는 카드 */
function offerResume(r: Resume) {
  const at = RESUME_AT[r.key];
  const mins = Math.max(1, Math.round((Date.now() - r.at) / 60000));
  const ago = mins < 60 ? `${mins}분 전` : `${Math.round(mins / 60)}시간 전`;
  const b = bubble("bot", "하던 게 있어요. 이어서 할까요?");
  const dl = el("dl");
  dl.append(el("dt", "멈춘 곳"), el("dd", at.what), el("dt", "저장"), el("dd", ago));
  b.append(dl, el("p", "진행 상태는 이 브라우저에만 저장돼요. 하루가 지나면 지워져요.", "hc-note"));
  showChips([
    { label: "이어서 하기", primary: true, run: () => (say("이어서 하기"), track("hug_resume", { a: "yes", at: r.key }), (trail = []), at.run(r.state)) },
    { label: "처음부터 새로", run: () => (track("hug_resume", { a: "no" }), clearResume(), restart()) },
  ]);
}
function goBack() {
  trail.pop();
  const prev = trail.pop();
  if (!prev) return;
  // 열려 있던 날짜·금액 입력칸은 닫는다 — 남겨 두면 지나간 질문에 답이 들어간다
  log?.querySelectorAll(".hc-date").forEach((r) => r.remove());
  say("← 이전");
  prev.again();
}
function showChips(list: Chip[]) {
  if (!chips) return;
  if (trail.length > 1) list = [...list, { label: "← 이전", run: goBack }];
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
const say = (label: string) => {
  bubble("user", label);
};

/* ── 단계 ─────────────────────────────────────────────── */

const STAGES: { id: string; label: string; level: Level; run: () => void }[] = [
  { id: "house", label: "집 보는 중이에요", level: "new", run: stageHouse },
  { id: "contract", label: "계약했어요(날짜가 정해졌어요)", level: "ready", run: () => startPlan() },
  { id: "calc", label: "보증 가입 되는지·보증료 계산", level: "some", run: () => startCalc() },
  { id: "living", label: "이미 살고 있어요", level: "some", run: stageLiving },
  { id: "trouble", label: "집주인과 문제가 생겼어요", level: "some", run: stageTrouble },
];

const STAGE_HINT: Record<string, string> = {
  house: "집 찾는 법·보러 갈 때 볼 것·가격 확인",
  contract: "계약일·잔금일로 할 일 날짜 짜기",
  calc: "집값·보증금·근저당으로 가입 여부·보증료 추산",
  living: "보증 가입·갱신 통보 기한 확인",
  trouble: "보증금을 못 받을 때·연락 기록 남기기",
};
function pickStage(s: (typeof STAGES)[number]) {
  level = level ?? s.level;
  say(s.label);
  track("hug_chat_stage", { stage: s.id });
  s.run();
}
interface Opt {
  label: string;
  hint: string;
  run: () => void;
}
/** 말풍선 안의 고르기 버튼(카카오 챗봇 버튼처럼) */
function optsEl(list: Opt[]) {
  const box = el("div", undefined, "hc-opts");
  for (const c of list) {
    const o = el("button");
    o.type = "button";
    o.append(el("b", c.label), el("small", c.hint));
    o.addEventListener("click", () => !busy && c.run());
    box.append(o);
  }
  return box;
}
/** 첫 인사 — 처음부터 단계를 늘어놓지 않고 "어떤 상황인지"만 묻는다 */
function greet() {
  const saved = loadPlan();
  const b = bubble("bot", "안녕하세요. HUG 전세보증을 대화로 같이 알아봐요.\n어디서부터 도와드릴까요?");
  b.append(
    optsEl([
      ...(saved ? [{ label: "지난번 내 일정 다시 보기", hint: "이 브라우저에 저장된 날짜로", run: () => (say("지난번 내 일정 다시 보기"), showPlan(saved)) }] : []),
      { label: "처음이에요", hint: "전세보증이 뭔지부터 차근차근", run: () => (say("처음이에요"), startQuiz()) },
      { label: "알아보는 중이에요", hint: "집 보는 중·계약 앞뒤로 할 일과 계산", run: () => (say("알아보는 중이에요"), (level = "some"), askStage()) },
      { label: "문제가 생겼는데 뭘 해야 할지 모르겠어요", hint: "보증금을 못 받을 때·집주인 연락", run: () => (say("문제가 생겼는데 뭘 해야 할지 모르겠어요"), (level = "some"), stageTrouble()) },
    ]),
  );
  if (reset) reset.hidden = true;
}
/* ── 처음: 아는 정도 묻기(선문답) ──────────────────────── */

interface QuizQ {
  id: string;
  ask: string;
  /** 모를 때 풀어 주는 말 — 용어집(jeonse-terms) 뜻을 그대로 쓴다 */
  terms: string[];
  /** 모를 때 따로 하는 말(용어집에 없는 것) */
  plain?: string;
  src?: { name: string; url: string };
  read: ReadKey[];
}
const QUIZ: QuizQ[] = [
  {
    id: "hug",
    ask: "먼저 하나 여쭤볼게요. HUG(허그)가 어떤 곳인지 아세요?",
    terms: [],
    plain: "HUG는 주택도시보증공사예요. 전세 세입자를 위해서는, 전세계약이 끝났을 때 집주인이 돌려줘야 할 보증금의 반환을 책임지는 보증(전세반환보증)을 운영해요. 세입자가 보증료를 내고 직접 가입해요.",
    src: { name: "HUG 전세보증금반환보증", url: "https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp" },
    read: ["checklist"],
  },
  { id: "guarantee", ask: "'전세보증금반환보증'은 들어 보셨어요?", terms: ["전세보증금반환보증(전세반환보증)", "선순위채권"], read: ["calc"] },
  { id: "rights", ask: "'전입신고·확정일자·대항력'이 왜 중요한지 아세요?", terms: ["전입신고", "확정일자", "대항력"], read: ["checklist"] },
  { id: "registry", ask: "마지막이에요. 등기부등본에서 '근저당'을 찾아볼 줄 아세요?", terms: ["등기사항전부증명서(등기부등본)", "근저당 · 채권최고액"], read: ["calc", "checklist"] },
];
let known: string[] = [];
let unknown: string[] = [];

function startQuiz() {
  trail = [];
  known = [];
  unknown = [];
  bubble("bot", "좋아요. 어디서부터 설명드릴지 정하려고 4가지만 짧게 여쭤볼게요. 모르셔도 괜찮아요, 바로 풀어 드릴게요.");
  askQuiz(0);
}
function askQuiz(n: number) {
  const q = QUIZ[n];
  if (!q) return quizDone();
  mark(`quiz${n}`, () => askQuiz(n));
  // 이전으로 돌아와 다시 답하면 앞서 고른 답은 지운다
  known = known.filter((x) => x !== q.id);
  unknown = unknown.filter((x) => x !== q.id);
  bubble("bot", q.ask);
  showChips([
    { label: "알아요", run: () => (say("알아요"), known.push(q.id), askQuiz(n + 1)) },
    { label: "들어만 봤어요", run: () => (say("들어만 봤어요"), explainQuiz(q, n)) },
    { label: "몰라요", primary: true, run: () => (say("몰라요"), explainQuiz(q, n)) },
  ]);
}
function explainQuiz(q: QuizQ, n: number) {
  unknown.push(q.id);
  const b = bubble("bot");
  if (q.plain) b.append(el("p", q.plain));
  for (const name of q.terms) {
    const t = findTerm(name);
    if (t) {
      b.append(el("p", t.t, "hc-sub"), el("p", t.d));
      if (t.ex) b.append(exEl(t.ex));
    }
  }
  const src = q.src ? [q.src] : q.terms.map((x) => findTerm(x)).filter((t) => !!t).slice(0, 1).map((t) => ({ name: "원문", url: t!.src }));
  if (src.length) b.append(sourcesEl(src));
  b.append(relatedEl(q.read));
  remember(q.ask, b.textContent ?? "");
  track("hug_quiz_unknown", { id: q.id });
  scrollDown();
  const cont: Chip[] = [{ label: n + 1 < QUIZ.length ? "이해했어요, 다음" : "이해했어요", primary: true, run: () => (say("이해했어요"), askQuiz(n + 1)) }];
  showChips([...cont, ...termChips(b.textContent ?? "", q.terms, cont)]);
}
function quizDone() {
  trail = [];
  level = unknown.length >= 3 ? "new" : unknown.length >= 1 ? "some" : "ready";
  track("hug_quiz_done", { level, unknown: unknown.length });
  const msg =
    level === "new"
      ? "처음이시면 이렇게만 기억하세요. ① 집 고를 때 등기부의 빚을 보고 ② 계약하면 날짜에 맞춰 신고·보증을 하고 ③ 끝날 때 미리 알리면 돼요. 단계마다 하나씩 같이 볼게요."
      : level === "some"
        ? "기본은 알고 계시네요. 헷갈린 부분은 위에 풀어 드렸어요. 이제 지금 상황에 맞춰 할 일을 볼게요."
        : "잘 알고 계시네요. 바로 지금 단계에 필요한 날짜와 계산으로 갈게요.";
  bubble("bot", msg);
  remember("아는 정도 확인", msg);
  askStage();
}
function askStage() {
  trail = [];
  // 고를 것이 많으면 아래 칩(가로 스크롤)에 숨지 않게 말풍선 안에 버튼으로 보여 준다
  const b = bubble("bot", "지금 어느 단계세요? 고르시면 그 단계부터 안내해 드려요.");
  b.append(optsEl(STAGES.map((st) => ({ label: st.label, hint: STAGE_HINT[st.id], run: () => pickStage(st) }))));
  const saved = loadPlan();
  showChips(saved ? [{ label: "지난번 내 일정 다시 보기", run: () => (say("지난번 내 일정 다시 보기"), showPlan(saved)) }] : []);
}

function showStages() {
  const saved = loadPlan();
  showChips([
    ...(saved ? [{ label: "지난번 내 일정 다시 보기", primary: true, run: () => (say("지난번 내 일정 다시 보기"), showPlan(saved)) }] : []),
    ...STAGES.map((s) => ({ label: s.label, run: () => pickStage(s) })),
  ]);
}

function stageHouse() {
  trail = [];
  const text = "좋아요, 대부분 이 단계에서 시작해요. 집을 고르기 전·보러 갈 때·가격 볼 때 챙길 것을 HUG 전세사기예방센터 안내로 정리해 뒀어요. 궁금한 것부터 눌러 보세요.";
  bubble("bot", text);
  remember("집 보는 중이에요", text);
  showChips([
    ...HOUSE_GUIDES.map((g) => guideChip(g)),
    guideChip(GUIDES.find((g) => g.id === "before-contract")!),
    { label: "이 집 보증 되는지 계산", run: () => (say("이 집 보증 되는지 계산해 볼래요"), startCalc()) },
    { label: "계약 날짜가 정해지면 일정 짜기", run: () => (say("계약 날짜로 일정 짜기"), startPlan()) },
  ]);
}
function stageLiving() {
  trail = [];
  const text = "살고 계시면 지금 챙길 건 두 가지예요. 보증 가입·갱신 통보 기한이 언제인지, 그리고 집주인과 주고받는 말을 기록으로 남기는 것이에요.";
  bubble("bot", text);
  remember("이미 살고 있어요", text);
  showChips([
    { label: "내 계약 날짜로 할 일 보기", primary: true, run: () => (say("내 계약 날짜로 할 일 보기"), startPlan()) },
    guideChip(GUIDES.find((g) => g.id === "renewal")!),
    guideChip(GUIDES.find((g) => g.id === "product-kind")!),
    guideChip(CONTACT),
  ]);
}
function stageTrouble() {
  trail = [];
  const text = "많이 답답하시죠. 순서대로 같이 볼게요. 어떤 상황인지 골라 주시거나 아래 칸에 적어 주세요.";
  bubble("bot", text);
  remember("집주인과 문제가 생겼어요", text);
  const g = (id: string) => guideChip(GUIDES.find((x) => x.id === id)!);
  showChips([g("not-returned"), g("landlord-gone"), g("after-accident"), g("no-guarantee"), g("product-kind"), g("renewal"), guideChip(CONTACT)]);
}

/* ── 상황 안내·용어 ───────────────────────────────────── */

function guideChip(g: Guide): Chip {
  return { label: g.ask, run: () => (say(g.ask), showGuide(g)) };
}

function showGuide(g: Guide) {
  trail = [];
  const b = bubble("bot");
  const ol = el("ol", undefined, "hc-steps");
  for (const s of g.steps) ol.append(el("li", s));
  b.append(ol);
  if (g.record?.length) {
    b.append(el("p", "기록 남기기", "hc-sub"));
    const ul = el("ul", undefined, "hc-steps");
    for (const s of g.record) ul.append(el("li", s));
    b.append(ul);
  }
  b.append(sourcesEl(g.sources), relatedEl(HOUSE_GUIDES.includes(g) ? ["calc", "checklist"] : ["checklist"]));
  scrollDown();
  remember(g.ask, [...g.steps, ...(g.record ?? [])].join(" "));
  track("hug_guide", { id: g.id });
  const next: Chip[] = [];
  if (g.id !== CONTACT.id && g.record) next.push(guideChip(CONTACT));
  if (HOUSE_GUIDES.includes(g)) next.push(...[...HOUSE_GUIDES, GUIDES.find((x) => x.id === "before-contract")!].filter((x) => x !== g).map(guideChip));
  // 문제 상황 안내끼리는 서로 이어 준다(연락두절 → 청구 → 보증 없을 때)
  const trouble = ["not-returned", "landlord-gone", "after-accident", "no-guarantee", "product-kind"];
  if (trouble.includes(g.id)) next.push(...trouble.filter((id) => id !== g.id).map((id) => guideChip(GUIDES.find((x) => x.id === id)!)));
  next.push(
    { label: "보증 계산", run: () => (say("보증 되는지 계산해 볼래요"), startCalc()) },
    { label: "일정 짜기", run: () => (say("일정 짜기"), startPlan()) },
    { label: "처음으로", run: restart },
  );
  showChips(next);
}

/**
 * 설명 속에 또 다른 용어(예: 선순위채권 설명 속 "을구")가 나오면 그 뜻을 묻는 버튼을 단다.
 * 누르면 뜻을 보여 주고, 하던 흐름의 버튼(next)으로 돌아온다.
 */
/** "예를 들면" 상자 */
function exEl(text: string) {
  const box = el("div", undefined, "hc-ex");
  box.append(el("span", "예를 들면", "hc-ex-h"), el("p", text));
  return box;
}
function termChips(text: string, exclude: string[], next: Chip[]): Chip[] {
  return termsIn(text)
    .filter((n) => !exclude.includes(n) && n !== "보증금")
    .slice(0, 4)
    .map((n) => ({ label: `'${n.split(/[(·]/)[0].trim()}' 뜻`, run: () => showTerm(n, undefined, next, [...exclude, n]) }));
}
function showTerm(name: string, fromUser?: string, next: Chip[] = [], seen: string[] = []) {
  const t = findTerm(name);
  if (!t) return;
  if (!fromUser) say(`'${t.t.split(/[(·]/)[0].trim()}' 뜻이 뭐예요?`);
  const b = bubble("bot");
  b.append(el("p", t.t, "hc-sub"), el("p", t.d));
  if (t.ex) b.append(exEl(t.ex));
  b.append(sourcesEl([{ name: "원문", url: t.src }]));
  scrollDown();
  remember(fromUser ?? `${t.t} 뜻`, `${t.t}: ${t.d}`);
  track("hug_term");
  const more = termChips(t.d, [...seen, t.t], next);
  if (more.length || next.length) showChips([...next, ...more]);
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
    row.remove();
    say(`${Number(d.value.slice(0, 4))}년 ${Number(d.value.slice(5, 7))}월 ${Number(d.value.slice(8, 10))}일`);
    done(d.value);
  });
  row.append(d, ok);
  b.append(row);
  scrollDown();
  showChips([]);
}

function startPlan() {
  trail = [];
  const p: Partial<SavedPlan> = {};
  askContract(p);
}
function askContract(p: Partial<SavedPlan>) {
  mark("plan-contract", () => askContract(p));
  askDate("계약서를 쓴 날(또는 쓸 날)이 언제예요?", "아직 정해지지 않았다면 예정일을 넣어도 돼요. 나중에 바꿀 수 있어요.", (v) => {
    p.contract = v;
    askStart(p);
  });
}
function askStart(p: Partial<SavedPlan>) {
  mark("plan-start", () => askStart(p), p);
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
  mark("plan-movein", () => askMoveIn(p), p);
  bubble("bot", "전입신고는 잔금일에 같이 하실 건가요? 같은 날 하는 게 가장 안전해요.");
  showChips([
    { label: "네, 같은 날 해요", primary: true, run: () => (say("네, 같은 날 해요"), (p.moveIn = p.start), askTerm(p)) },
    { label: "다른 날이에요", run: () => (say("다른 날이에요"), askMoveInDate(p)) },
  ]);
}
function askMoveInDate(p: Partial<SavedPlan>) {
  mark("plan-movein-date", () => askMoveInDate(p), p);
  askDate("전입신고하는 날은요?", "", (m) => ((p.moveIn = m), askTerm(p)));
}
function askTerm(p: Partial<SavedPlan>) {
  mark("plan-term", () => askTerm(p), p);
  bubble("bot", "계약 기간은요?");
  const endAfter = (months: number) => fromDay(addMonths(toDay(p.start!)!, months) - 1);
  showChips([
    { label: "2년", primary: true, run: () => (say("2년"), finish({ ...p, end: endAfter(24) } as SavedPlan)) },
    { label: "1년", run: () => (say("1년"), finish({ ...p, end: endAfter(12) } as SavedPlan)) },
    { label: "만료일 직접 고르기", run: () => (say("만료일 직접 고를게요"), askEnd(p)) },
  ]);
}
function askEnd(p: Partial<SavedPlan>) {
  mark("plan-end", () => askEnd(p), p);
  askDate("계약이 끝나는 날은요?", "", (e) => finish({ ...p, end: e } as SavedPlan));
}

function finish(p: SavedPlan) {
  if (toDay(p.end)! <= toDay(p.start)!) {
    bubble("bot", "만료일이 잔금일보다 앞이에요. 처음부터 다시 넣어 주세요.");
    return startPlan();
  }
  savePlan(p);
  clearResume();
  track("hug_plan_done");
  showPlan(p);
}

function itemsOf(p: SavedPlan): PlanItem[] {
  return plan({ contract: toDay(p.contract)!, start: toDay(p.start)!, moveIn: toDay(p.moveIn)!, end: toDay(p.end)! }, todayDay());
}

function showPlan(p: SavedPlan) {
  mark("plan-result", () => showPlan(p));
  const items = itemsOf(p);
  const nxt = nextItem(items);
  const b = bubble("bot");
  const sum = el("div", undefined, "hc-summary");
  sum.append(el("p", nxt ? "가장 먼저 할 일" : "모든 날짜가 지났어요", "hc-sub"));
  if (nxt) sum.append(el("p", `${nxt.when} · ${nxt.dday}\n${nxt.title}`));
  b.append(sum, el("p", `할 일 ${items.length}가지를 날짜 순서로 정리했어요.`));
  const ol = el("ol", undefined, "hc-plan");
  for (const i of items) {
    const li = el("li", undefined, i.past ? "hc-past" : i === nxt ? "hc-next" : undefined);
    li.append(el("b", `${i.when} · ${i.dday}`), el("span", i.title));
    if (i.warn && !i.past) li.append(el("span", `⚠ ${i.warn}`, "hc-warn"));
    ol.append(li);
  }
  b.append(ol, relatedEl(["checklist"]), el("p", "용어가 어려우면 아래 칸에 \"대항력이 뭐예요?\"처럼 물어보세요.", "hc-note"));
  remember("내 전세 일정", items.map((i) => `${i.when} ${i.title}`).join(" / "));
  scrollDown();
  showChips([
    { label: "알림 받기", primary: true, run: () => (say("알림 받을래요"), offerPush(items)) },
    { label: "내 캘린더에 넣기", run: () => (downloadIcs(items, "hug-chat-plan"), bubble("bot", "캘린더 파일(.ics)을 내려받았어요. 열면 휴대폰·PC 캘린더에 날짜가 들어가요.")) },
    { label: "자세한 일정 표", run: () => (location.href = "/guide/hug-jeonse-checklist/#hs-card") },
    guideChip(CONTACT),
    { label: "날짜 다시 넣기", run: () => (say("날짜 다시 넣기"), startPlan()) },
    { label: "일정 지우기", run: () => (say("일정 지우기"), clearPlan(), bubble("bot", "이 브라우저에 저장된 일정을 지웠어요."), showStages()) },
  ]);
}

/** 대화 안에서 바로 알림을 켠다 — 로그인 없이 이 브라우저의 웹 푸시로 */
function offerPush(items: PlanItem[]) {
  const b = bubble("bot", "로그인은 필요 없어요. 이 기기 브라우저로 3일 전·하루 전·당일 오전 9시쯤 알림을 보내요. 서버에는 할 일 종류·날짜와 알림 주소만 저장하고, 이름·연락처는 받지 않아요.");
  b.append(el("p", "아이폰은 사파리에서 홈 화면에 추가한 JU포켓 앱으로 열어야 알림이 와요.", "hc-note"));
  const btn = el("button", "이 기기로 알림 켜기", "hc-act");
  btn.type = "button";
  const msg = el("p", undefined, "hc-note");
  msg.setAttribute("aria-live", "polite");
  const off = el("button", "알림 끄기", "hc-act-off");
  off.type = "button";
  off.hidden = true;
  b.append(btn, msg, off);
  setupPush(btn, msg, off, () => items.map((i) => ({ key: i.key, date: fromDay(i.day) })));
  scrollDown();
}

/* ── 보증 가입·보증료 계산(계산기를 대화로) ─────────────── */

/** 금액 하나를 묻는다 — "3억 5천"처럼 적으면 원으로 읽는다. zero 가 있으면 "없어요" 버튼 */
/** min·example: 월세처럼 작은 금액을 받을 때(기본은 100만원 이상, "3억 5천") */
function askAmount(question: string, hint: string, done: (won: number) => void, zero?: string, min = 1_000_000, example = "3억 5천") {
  const b = bubble("bot", question);
  if (hint) b.append(el("p", hint, "hc-note"));
  const row = el("div", undefined, "hc-date");
  const i = el("input");
  i.type = "text";
  i.inputMode = "text";
  i.placeholder = `예: ${example}`;
  i.setAttribute("aria-label", question);
  const ok = el("button", "확인");
  ok.type = "button";
  const err = el("p", undefined, "hc-note");
  const submit = () => {
    const raw = i.value.trim();
    const n = amountsIn(/[억만천원]/.test(raw) ? raw : `${raw}만원`)[0];
    if (!n || n < min) {
      err.textContent = `금액을 '${example}'처럼 적어 주세요.`;
      return i.focus();
    }
    row.remove();
    err.remove();
    showChips([]);
    say(eok(n));
    done(n);
  };
  ok.addEventListener("click", submit);
  i.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      submit();
    }
  });
  row.append(i, ok);
  b.append(row, err);
  scrollDown();
  showChips(zero ? [{ label: zero, run: () => (row.remove(), err.remove(), say(zero), done(0)) }] : []);
}

function startCalc() {
  trail = [];
  const x: Partial<CheckInput> = {};
  mark("calc-type", startCalc);
  bubble("bot", "HUG 전세보증 가입이 되는지, 보증료는 얼마인지 계산해 볼게요. 몇 가지만 여쭤볼게요. 어떤 집이에요?");
  const types: [HouseType, string][] = [["apartment", "아파트"], ["officetel", "오피스텔"], ["row", "빌라(연립·다세대)"], ["multi", "단독·다가구"]];
  showChips(types.map(([t, l]) => ({ label: l, run: () => (say(l), (x.type = t), calcRegion(x)) })));
}
function calcRegion(x: Partial<CheckInput>) {
  mark("calc-region", () => calcRegion(x), x);
  bubble("bot", "집이 수도권(서울·경기·인천)에 있나요? 보증금 상한이 달라요.");
  showChips([
    { label: "수도권이에요", run: () => (say("수도권이에요"), (x.capital = true), calcBasis(x)) },
    { label: "수도권 밖이에요", run: () => (say("수도권 밖이에요"), (x.capital = false), calcBasis(x)) },
  ]);
}
function calcBasis(x: Partial<CheckInput>) {
  mark("calc-basis", () => calcBasis(x), x);
  const b = bubble("bot", "집값은 무엇으로 아세요? HUG는 아파트면 KB·부동산테크 시세를 먼저 보고, 빌라(연립·다세대)·단독주택은 공시가격 × 140%를 먼저 봐요(감정평가서가 있으면 그게 가장 먼저예요). 공시가격은 '부동산 공시가격 알리미'에서 주소로 찾을 수 있어요.");
  b.append(sourcesEl([{ name: "부동산 공시가격 알리미", url: "https://www.realtyprice.kr/" }]));
  showChips([
    { label: "공시가격을 알아요", primary: true, run: () => (say("공시가격을 알아요"), (x.basis = "public"), calcPrice(x)) },
    { label: "시세·감정가로 볼게요", run: () => (say("시세·감정가로 볼게요"), (x.basis = "market"), calcPrice(x)) },
  ]);
}
function calcPrice(x: Partial<CheckInput>) {
  mark("calc-price", () => calcPrice(x), x);
  if (x.basis === "public") askAmount("공시가격이 얼마예요?", "", (n) => ((x.price = n), calcDeposit(x)));
  else askAmount("시세(또는 감정가)가 얼마예요?", "KB시세·감정평가액처럼 HUG가 인정하는 값이어야 해요.", (n) => ((x.price = n), calcDeposit(x)));
}
function calcDeposit(x: Partial<CheckInput>) {
  mark("calc-deposit", () => calcDeposit(x), x);
  askAmount("전세 보증금은요?", "", (n) => ((x.deposit = n), calcRent(x)));
}
/** 보증부 월세(반전세) — HUG는 월세를 전월세전환율로 보증금에 더해 상한을 본다 */
function calcRent(x: Partial<CheckInput>) {
  mark("calc-rent", () => calcRent(x), x);
  bubble("bot", "월세도 내나요(반전세)? 월세가 있으면 HUG는 그만큼을 보증금으로 환산해서 상한(수도권 7억·그 외 5억)을 봐요.");
  showChips([
    { label: "아니요, 전세예요", primary: true, run: () => (say("아니요, 전세예요"), (x.monthlyRent = 0), calcSenior(x)) },
    { label: "월세도 있어요", run: () => (say("월세도 있어요"), calcRentAmount(x)) },
  ]);
}
function calcRentAmount(x: Partial<CheckInput>) {
  mark("calc-rent-amount", () => calcRentAmount(x), x);
  askAmount("한 달 월세는 얼마예요?", "", (n) => ((x.monthlyRent = n), calcSenior(x)), undefined, 10_000, "50만");
}
function calcSenior(x: Partial<CheckInput>) {
  mark("calc-senior", () => calcSenior(x), x);
  askAmount("집에 먼저 잡힌 빚(근저당 채권최고액)은요?", "등기부등본 을구에 적힌 채권최고액이에요. 없으면 아래 '없어요'를 눌러 주세요.", (s) => {
    x.senior = s;
    if (x.type === "multi") calcOthers(x);
    else calcTerm(x);
  }, "없어요");
}
function calcOthers(x: Partial<CheckInput>) {
  mark("calc-others", () => calcOthers(x), x);
  askAmount("나보다 먼저 들어온 다른 세입자들의 보증금 합계는요?", "단독·다가구는 이것도 먼저 잡힌 빚으로 봐요.", (o) => ((x.otherDeposits = o), calcOthersDoc(x)), "없어요(나 혼자)");
}
/** 단독·다가구: 다른 세입자 계약 확인서를 못 내면 그 구간 최고요율 */
function calcOthersDoc(x: Partial<CheckInput>) {
  mark("calc-others-doc", () => calcOthersDoc(x), x);
  bubble("bot", "다른 세입자들의 계약 내용을 확인하는 서류(타 전월세계약 확인서·확정일자 부여현황)를 낼 수 있나요? 못 내면 보증료가 그 구간에서 가장 높은 요율이 돼요.");
  showChips([
    { label: "낼 수 있어요", primary: true, run: () => (say("낼 수 있어요"), (x.othersConfirmed = true), calcTerm(x)) },
    { label: "못 내요", run: () => (say("못 내요"), (x.othersConfirmed = false), calcTerm(x)) },
    { label: "모르겠어요", run: () => (say("모르겠어요"), calcTerm(x)) },
  ]);
}
function calcTerm(x: Partial<CheckInput>) {
  mark("calc-term", () => calcTerm(x), x);
  bubble("bot", "보증 기간(계약 기간)은요?");
  showChips([
    { label: "2년", primary: true, run: () => (say("2년"), (x.months = 24), calcDiscount(x)) },
    { label: "1년", run: () => (say("1년"), (x.months = 12), calcDiscount(x)) },
  ]);
}
function calcDiscount(x: Partial<CheckInput>) {
  mark("calc-discount", () => calcDiscount(x), x);
  bubble("bot", "보증료 할인 대상인가요? 하나만 적용돼요.");
  const list = Object.entries(DISCOUNT_LABEL) as [Exclude<PremiumDiscount, "none">, string][];
  showChips([
    { label: "해당 없음", primary: true, run: () => (say("해당 없음"), (x.discount = "none"), calcLoan(x)) },
    ...list.map(([k, l]) => ({ label: l, run: () => (say(l), (x.discount = k), calcLoan(x)) })),
  ]);
}
/** 전세대출 — 있으면 전세안심보증(반환보증 + 대출보증) 기준으로 보증료를 더한다 */
function calcLoan(x: Partial<CheckInput>) {
  mark("calc-loan", () => calcLoan(x), x);
  bubble("bot", "전세대출을 받나요? 대출이 있으면 반환보증만 따로 못 드는 경우가 많아서, 대출과 함께 드는 전세안심보증 기준으로 계산할게요.");
  showChips([
    { label: "대출 없어요", primary: true, run: () => (say("대출 없어요"), (x.loan = 0), calcDone(x as CheckInput)) },
    { label: "대출 받아요", run: () => (say("대출 받아요"), calcLoanAmount(x)) },
  ]);
}
function calcLoanAmount(x: Partial<CheckInput>) {
  mark("calc-loan-amount", () => calcLoanAmount(x), x);
  askAmount("전세대출 금액은요?", "은행에서 받는(받을) 대출 원금이에요.", (n) => ((x.loan = n), calcDone(x as CheckInput)));
}
function calcDone(x: CheckInput) {
  mark("calc-result", () => calcDone(x));
  clearResume();
  const r = checkAnswer(x);
  const b = bubble("bot", r.text);
  const dl = el("dl");
  for (const l of r.lines) dl.append(el("dt", l.label), el("dd", l.value));
  b.append(dl, sourcesEl(sourcesFor(["ltv", "deposit-cap", "premium"])), relatedEl(["calc", "checklist", "dsr"]));
  b.append(el("p", "추산이에요. 실제 가입과 금액은 HUG 심사로 정해져요.", "hc-note"));
  remember("보증 가입 계산", `${r.text}\n${r.lines.map((l) => `${l.label}: ${l.value}`).join("\n")}`);
  track("hug_chat_calc");
  scrollDown();
  if (r.ok) return askRefusal(x);
  calcNext();
}

/** 숫자가 맞아도 가입이 안 되는 경우 — 계산이 "된다"고 한 뒤에 보여 주고 묻는다 */
function askRefusal(x: CheckInput) {
  mark("calc-refusal", () => askRefusal(x));
  const b = bubble("bot", "숫자로는 가입이 돼요. 그런데 숫자가 맞아도 아래 중 하나라도 해당되면 HUG가 가입을 받지 않아요. 해당되는 게 있나요?");
  const ul = el("ul", undefined, "hc-checks");
  for (const c of refusalChecks(x.type)) {
    const li = el("li");
    li.append(el("span", c.text), el("small", `확인: ${c.where}`));
    ul.append(li);
  }
  b.append(ul, sourcesEl(sourcesFor(["other-conditions", "registry"])));
  scrollDown();
  showChips([
    { label: "없어요(확인했어요)", primary: true, run: () => (say("없어요(확인했어요)"), track("hug_refusal", { a: "none" }), bubble("bot", "좋아요. 잔금일에 등기부를 한 번 더 떼어 그사이 바뀐 게 없는지만 보세요."), calcNext()) },
    { label: "하나라도 있어요", run: () => (say("하나라도 있어요"), track("hug_refusal", { a: "yes" }), bubble("bot", "그 집은 보증 가입이 거절될 수 있어요. 아직 계약 전이면 계약을 다시 생각하거나, '보증 가입이 안 되면 계약금을 돌려준다'는 특약을 집주인과 상의해 보세요. 이미 계약했다면 HUG 지사나 위탁은행에 가입이 되는지 먼저 물어보세요."), calcNext()) },
    { label: "아직 몰라요", run: () => (say("아직 몰라요"), track("hug_refusal", { a: "unknown" }), bubble("bot", "등기부등본은 인터넷등기소, 건축물대장은 정부24에서 뗄 수 있어요. 전입세대확인서는 주민센터에서 발급해요. 어디를 봐야 하는지는 아래 '계약 전 확인' 안내에 정리해 두었어요."), calcNext()) },
  ]);
}

function calcNext() {
  showChips([
    { label: "이 집으로 일정 짜기", primary: true, run: () => (say("일정 짜기"), startPlan()) },
    { label: "다른 금액으로 다시", run: () => (say("다른 금액으로 다시 계산"), startCalc()) },
    guideChip(GUIDES.find((g) => g.id === "before-contract")!),
    { label: "처음으로", run: restart },
  ]);
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
  b.append(relatedEl(r.lines?.length ? ["calc", "checklist"] : ["checklist", "calc"]));
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

  // 2) 미리 확인한 답변 모음 — 자주 나오는 질문은 AI 를 부르지 않는다(즉시·사용량 0)
  const banked = matchAnswer(text);
  if (banked) {
    const a = banked.answer;
    botAnswer({ ok: true, text: a.a, sources: sourcesFor(a.cite), note: BANK_NOTE });
    history.push({ role: "user", content: text }, { role: "assistant", content: a.a.slice(0, 500) });
    track("hug_chat_answer", { kind: "bank", id: a.id }, text);
    return;
  }

  // 3) 그 밖의 질문은 AI
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
  clearResume();
  trail = [];
  history = [];
  level = null;
  log.replaceChildren();
  showChips([]);
  greet();
  window.scrollTo({ top: 0 });
  track("hug_chat_reset");
}
reset?.addEventListener("click", restart);

// 글 페이지 입구에서 단계를 골라 들어오면(?s=house) 바로 그 단계로
const entry = new URLSearchParams(location.search).get("s");
// 하던 계산·일정이 있으면 첫 인사 대신 이어하기 카드(입구에서 단계를 골라 온 경우는 그 단계가 먼저)
const resumeAtStart = entry ? null : loadResume();
if (resumeAtStart) offerResume(resumeAtStart);
else greet();
const first = STAGES.find((x) => x.id === entry);
const savedAtStart = loadPlan();
if (first) pickStage(first);
else if (entry === "plan" && savedAtStart) {
  say("지난번 내 일정 다시 보기");
  showPlan(savedAtStart);
}
// 화면을 연 횟수(관리자 화면의 "연 사람"). 무엇을 눌렀는지는 위 track 이 따로 센다
track("hug_open", entry ? { id: entry } : {});
