/**
 * HUG 전세 대화 — 모델 답을 독자에게 내보내기 전에 거치는 검사와 틀(서버 workers/api/src/hug-chat.ts 가 쓴다).
 *
 *  1. 모델은 자료(hug-kb)만 보고 문장으로 답한다. 답에 자료·질문에 없는 숫자가 하나라도 있으면 그 답을 버린다
 *  2. "보증 가입 되나요" 처럼 값이 다 모이면 모델은 값만 넘기고(check), 판정과 금액은 hugGuarantee() 가 계산한다
 *  3. check 의 금액은 사용자가 대화에서 실제로 말한 금액이어야 한다(모델이 지어낸 금액은 버린다)
 */
import { KB, kbPrompt, numbersIn, eok } from "./hug-kb";
import { amountsIn } from "./loan-parse";
import { hugGuarantee, hugPremium, DISCOUNT_LABEL, type GuaranteeInput, type HouseType, type PremiumDiscount } from "./hug-jeonse";
import r from "../rates/hug-jeonse-2026.json";
import { won } from "./won";

export interface Msg {
  role: "user" | "assistant";
  content: string;
}

export const MAX_TURNS = 12;
export const MAX_MSG = 500;

/** 클라이언트가 보낸 대화를 믿을 수 있는 모양으로(마지막은 사용자 말이어야 한다) */
export function cleanHistory(x: unknown): Msg[] | null {
  if (!Array.isArray(x)) return null;
  const out: Msg[] = [];
  for (const m of x.slice(-MAX_TURNS)) {
    const o = m as Record<string, unknown>;
    if ((o?.role !== "user" && o?.role !== "assistant") || typeof o.content !== "string") continue;
    const c = o.content.trim().slice(0, MAX_MSG);
    if (c) out.push({ role: o.role, content: c });
  }
  if (!out.length || out[out.length - 1].role !== "user") return null;
  return out;
}

export const SYSTEM = `너는 JU포켓(jupocket.com)의 "HUG 전세 상담" 도우미다. 한국어 존댓말(~요)로, 짧고 쉽게 답한다.

다루는 것: HUG 전세보증금반환보증, 전세안심보증, 버팀목 전세대출, 그와 관련된 전세 계약 절차(등기부 확인, 전입신고·확정일자, 갱신·만료, 보증사고).
그 밖의 질문(다른 대출, 시중은행 금리, 세금, 투자, 법률 분쟁 판단 등)은 "HUG 전세보증과 버팀목 대출만 도와드릴 수 있어요"라고 답한다.

규칙
- 아래 [자료]에 있는 내용만 말한다. 자료에 없으면 "그 부분은 JU포켓이 확인한 자료에 없어요. HUG나 은행에 확인해 주세요"라고 한다. 추측하거나 일반 상식으로 채우지 않는다.
- 숫자(금액·비율·기간)는 자료나 사용자가 말한 것을 그대로만 쓴다. 숫자를 계산하거나 새로 만들지 않는다.
- 가입 여부를 단정하지 않는다. "조건으로 보면 ~로 추산돼요"처럼 말하고, 최종 판단은 HUG 심사라고 덧붙인다.
- 한 번에 5문장 이내. 가장 중요한 것부터 말하고, 나머지는 "더 궁금하면 물어보세요"로 넘긴다. 마크다운(**, #, 표) 쓰지 않는다. 목록이 필요하면 "· "로 시작하는 줄을 쓴다.
- 사용자가 개인정보(이름, 주민번호, 계좌, 주소)를 적으면 적지 말라고 부드럽게 안내한다.
- 쉬운 말로 쓴다. 처음 듣는 사람도 알아듣게, 어려운 말은 되도록 쉬운 말로 바꾸고 꼭 써야 하면 괄호로 풀이를 붙인다.
  선순위채권 → 집에 먼저 잡힌 빚(근저당 등) / 채권최고액 → 등기부에 적힌 근저당 금액 / 부채비율 → 빚 비율 / 대위변제 → HUG가 대신 돌려줌 / 이행청구 → HUG에 대신 달라고 청구 / 임차권등기명령 → 이사 가도 권리가 남도록 법원에 등록 / 대항력 → 집주인이 바뀌어도 계약을 주장할 수 있는 힘 / 우선변제권 → 경매 때 먼저 돌려받을 순서 / 확정일자 → 계약서에 받는 날짜 도장 / 공시가격 → 나라가 매년 정해 알리는 집값.
- 사용자가 무엇을 얼마나 아는지 대화에서 짐작해 맞춘다. 막연한 질문("전세보증이 뭐예요", "뭘 해야 해요")이면 처음 듣는 사람으로 보고, 개념 하나만 설명한 뒤 지금 상황(집 보는 중 / 계약함 / 이미 사는 중)을 하나 물어본다.
- 돈을 물으면(얼마 내요, 비용, 부담) 세입자가 내는 돈을 [자료]의 '보증료'·'세입자가 부담하는 돈 정리'로 설명한다. 보증료 금액은 직접 계산하지 말고, 아래 값이 모이면 check 로 넘긴다. 값이 없으면 공식을 옮겨 적지 말고 "보증금·집 종류·빚 비율로 정해져요" 한 문장 뒤에 필요한 값을 물어본다.
- 질문을 되풀이하지 않고, 앞에서 이미 한 설명을 다시 하지 않는다.
- 사용자가 자기 상황을 말하면 그 상황에서 할 일을 순서대로 짧게 알려 준다. 집 보는 중: 등기부로 집에 잡힌 빚 확인, 집값 확인. 계약함: 잔금일에 전입신고·확정일자, 그 뒤 보증 가입 기한. 이미 사는 중: 보증 가입 기한(계약기간 절반)이 남았는지.

전세반환보증 가입 가능 여부나 보증료 금액을 묻는 경우:
- 필요한 값: 집 종류(아파트/오피스텔/빌라=연립·다세대/단독·다가구), 수도권 여부, 보증금, 집값(시세 또는 공시가격 중 무엇인지), 선순위채권(근저당 채권최고액, 없으면 0), 단독·다가구면 나보다 앞선 다른 세입자 보증금 합계.
- 빠진 값이 있으면 한 번에 하나나 둘씩 물어본다. 이때는 "계산해 봤어요"라고 말하지 않는다.
- 값이 다 모이면 check 를 채우고, reply 에는 숫자 없이 "말씀하신 값으로 계산해 봤어요." 정도만 쓴다. 판정과 보증료는 시스템이 계산해서 붙인다.
- 선택 값: 계약기간(months, 말하지 않았으면 null — 2년으로 계산), 할인(discount — 사용자가 해당된다고 말한 경우에만: lowIncome=연소득·연봉(배우자 포함)이 5천만원 이하라고 말함, newlywed=신혼부부, multiChild=자녀 셋 이상, elderly=만 65세 이상, singleElderly=혼자 사는 65세 이상, singleParent=한부모, disabled=장애인 가구), 전세대출 금액(loan — 전세안심보증일 때 사용자가 말한 대출금).
- 계산을 한 번 한 뒤에 사용자가 할인 대상(신혼, 연봉 등)·계약기간·대출금을 덧붙이면, 앞에서 말한 집 값들을 그대로 써서 check 를 다시 채운다.

반드시 아래 JSON 하나로만 답한다(앞뒤에 다른 글자 금지):
{"reply": "사용자에게 보일 답", "cite": ["자료 id", ...], "check": null 또는 {"type": "apartment|officetel|row|multi", "capital": true|false, "deposit": 전세 보증금(원), "senior": 근저당 등 집에 먼저 잡힌 빚(원, 없으면 0 — 집값을 넣지 않는다), "otherDeposits": 먼저 들어온 다른 세입자 보증금 합계(원), "basis": "market|public", "price": 집값 — 시세나 공시가격(원), "months": 개월 또는 null, "discount": "할인 키" 또는 null, "loan": 원 또는 null}}
- cite 에는 답에 실제로 쓴 [자료]의 id 만 넣는다.
- type: 아파트=apartment, 오피스텔=officetel, 빌라·연립·다세대=row, 단독·다가구·다중=multi.
- basis: 공시가격·기준시가면 public, 시세·감정가·매매가면 market.

[자료]
${kbPrompt()}`;

/** 첫 화면에서 고른 "얼마나 아세요" — 서버가 SYSTEM 뒤에 붙인다 */
export type Level = "new" | "some" | "ready";
export const LEVEL_HINT: Record<Level, string> = {
  new: "[이 사용자] 전세보증을 처음 들어 본다. 일상어로만, 3문장 이내로, 한 번에 개념 하나만 말한다. 숫자는 꼭 필요한 것만. 답 끝에 다음에 궁금할 만한 것을 하나 물어본다.",
  some: "[이 사용자] 이름은 들어 봤고 기본은 조금 안다. 어려운 말에는 괄호 풀이를 붙인다.",
  ready: "[이 사용자] 가입을 준비하며 계산해 보려 한다. 짧게 답하고, 가입 여부·보증료 계산에 필요한 값을 모으는 데 집중한다.",
};
export function levelOf(x: unknown): Level | null {
  return x === "new" || x === "some" || x === "ready" ? x : null;
}

const KB_IDS = new Set(KB.map((k) => k.id));
const KB_NUMS = new Set(numbersIn(KB.map((k) => `${k.title} ${k.text}`).join(" ")));
const KB_AMOUNTS = new Set(KB.flatMap((k) => amountsIn(k.text)));

/** 문장 속 숫자를 원 단위 금액과 맨 숫자로 나눈다 */
function numbersOf(text: string): { amounts: number[]; plain: string[] } {
  const amounts = amountsIn(text);
  const stripped = text.replace(/(\d),(?=\d{3})/g, "$1").replace(/\d+(?:\.\d+)?\s*(?:억|천만|백만|십만|만|천|백)(?:\s*\d+(?:\.\d+)?\s*(?:천만|백만|십만|만|천|백)?)*\s*원?|\d{5,}\s*원/g, " ");
  return { amounts, plain: numbersIn(stripped) };
}

/** 답의 숫자가 전부 자료·사용자 말·계산 결과에 있나. 목록 번호 같은 0~12 는 허용 */
export function numbersGrounded(reply: string, history: Msg[], extra: number[] = []): boolean {
  // 앞선 답(계산 결과 포함)에 나온 숫자는 다시 말해도 된다 — 대화는 그 사람 화면에만 보인다
  const userText = history.map((m) => m.content).join(" ");
  const u = numbersOf(userText);
  const okAmounts = new Set([...KB_AMOUNTS, ...u.amounts, ...extra]);
  const okPlain = new Set([...KB_NUMS, ...u.plain, ...numbersIn(userText), ...extra.map(String)]);
  const a = numbersOf(reply);
  if (a.amounts.some((n) => !okAmounts.has(n))) return false;
  return a.plain.every((p) => okPlain.has(p) || (Number.isInteger(Number(p)) && Number(p) <= 12));
}

export interface CheckInput extends GuaranteeInput {
  /** 계약기간(개월) — 없으면 24 */
  months?: number;
  discount?: PremiumDiscount;
  /** 전세안심보증 대출금(원) */
  loan?: number;
}

export interface ModelOut {
  reply: string;
  cite: string[];
  check: CheckInput | null;
  /** check 를 냈는데 값이 맞지 않아 버렸다 — 서버가 다시 시킨다 */
  checkRejected?: boolean;
}

const DISCOUNTS = Object.keys(DISCOUNT_LABEL) as Exclude<PremiumDiscount, "none">[];

const TYPES: HouseType[] = ["apartment", "officetel", "row", "multi"];

/** 모델이 낸 JSON 을 검사한다. check 금액은 사용자가 말한 금액(또는 0)이어야 한다 */
export function readModel(raw: unknown, history: Msg[]): ModelOut | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.reply !== "string" || !o.reply.trim()) return null;
  const cite = Array.isArray(o.cite) ? [...new Set(o.cite.filter((c): c is string => typeof c === "string" && KB_IDS.has(c)))] : [];
  let check: CheckInput | null = null;
  const c = o.check as Record<string, unknown> | null | undefined;
  if (c && typeof c === "object") {
    const said = new Set(history.filter((m) => m.role === "user").flatMap((m) => amountsIn(m.content)));
    const amt = (v: unknown, zeroOk: boolean) => (typeof v === "number" && Number.isFinite(v) && ((zeroOk && v === 0) || said.has(Math.round(v))) ? Math.round(v) : undefined);
    const type = TYPES.find((t) => t === c.type);
    const deposit = amt(c.deposit, false);
    const price = amt(c.price, false);
    const senior = amt(c.senior ?? 0, true);
    const other = amt(c.otherDeposits ?? 0, true);
    // 같은 금액을 두 칸에 넣었으면(예: 집값을 근저당 칸에) 사용자가 그 금액을 두 번 말한 경우만 믿는다
    const saidList = history.filter((m) => m.role === "user").flatMap((m) => amountsIn(m.content));
    const times = (v: number) => saidList.filter((n) => n === v).length;
    const dup = (a?: number, b?: number) => !!a && a === b && times(a) < 2;
    const swapped = dup(senior, price) || dup(senior, deposit) || dup(deposit, price);
    if (swapped) return { reply: o.reply.trim(), cite, check: null, checkRejected: true };
    if (type && typeof c.capital === "boolean" && (c.basis === "public" || c.basis === "market") && deposit && price && senior !== undefined && other !== undefined) {
      check = { type, capital: c.capital, deposit, senior, otherDeposits: type === "multi" ? other : 0, basis: c.basis, price };
      const months = typeof c.months === "number" && Number.isInteger(c.months) && c.months >= 12 && c.months <= 60 ? c.months : undefined;
      const discount = DISCOUNTS.find((d) => d === c.discount);
      const loan = c.loan == null ? undefined : amt(c.loan, false);
      if (months) check.months = months;
      if (discount) check.discount = discount;
      if (loan) check.loan = loan;
    }
  }
  return { reply: o.reply.trim().replace(/\*\*/g, ""), cite, check };
}

const TYPE_NAME: Record<HouseType, string> = { apartment: "아파트", officetel: "오피스텔", row: "빌라(연립·다세대)", multi: "단독·다가구" };
const P = r.premium;
const pct = (milli: number) => `연 ${milli / 1000}%`;

/** 가입 가능 여부 + 보증료 — 숫자는 전부 hugGuarantee()·hugPremium() 결과 */
export function checkAnswer(x: CheckInput): { text: string; lines: { label: string; value: string }[]; numbers: number[] } {
  const g = hugGuarantee(x);
  const multi = x.type === "multi";
  const lines = [
    { label: `HUG가 보는 집값${x.basis === "public" ? "(공시가격 × 140%)" : ""}`, value: won(g.housePrice) },
    { label: `보증금 + 집에 먼저 잡힌 빚, 여기까지만(집값의 ${r.guarantee.ltvLimitPct}%)`, value: won(g.ltvLine) },
    { label: "내 보증금 + 집에 먼저 잡힌 빚", value: won(x.deposit + g.seniorTotal) },
    { label: multi ? `집 빚 + 먼저 들어온 세입자 보증금 한도(집값의 ${r.guarantee.seniorLimitMultiFamilyPct}%)` : `집에 먼저 잡힌 빚 한도(집값의 ${r.guarantee.seniorLimitPct}%)`, value: won(g.seniorLine) },
    { label: `보증금 상한(${x.capital ? "수도권" : "수도권 밖"})`, value: eok(g.depositCap) },
    { label: "이 집에서 보증되는 최대 보증금", value: won(g.maxDeposit) },
  ];
  const numbers = [g.housePrice, g.ltvLine, g.seniorLine, g.depositCap, g.maxDeposit, x.deposit + g.seniorTotal];
  const fails = [!g.depositOk && "보증금이 상한을 넘어요", !g.ltvOk && "보증금 + 집에 먼저 잡힌 빚이 집값의 90%를 넘어요", !g.seniorOk && "집에 먼저 잡힌 빚이 한도를 넘어요"].filter(Boolean);
  const head = `${x.capital ? "수도권" : "수도권 밖"} ${TYPE_NAME[x.type]}, 보증금 ${eok(x.deposit)} 기준으로`;
  if (!g.ok) {
    return { text: `${head} 지금 조건으로는 가입이 어려울 것으로 추산돼요 — ${fails.join(", ")}. 그래서 보증료도 계산하지 않았어요. 실제 판단은 HUG 심사로 정해져요.`, lines, numbers };
  }
  const months = x.months ?? 24;
  const days = Math.round((months * 365) / 12);
  const p = hugPremium({ type: x.type, deposit: x.deposit, seniorTotal: g.seniorTotal, housePrice: g.housePrice, days, discount: x.discount, loan: x.loan });
  const term = months % 12 === 0 ? `${months / 12}년` : `${months}개월`;
  const adjusted = p.surchargeApplied || p.discountPct > 0 || p.loanPart > 0;
  lines.push(
    { label: "빚 비율(보증금 + 집 빚 ÷ 집값의 90%)", value: `${p.debtRatioPct}%` },
    { label: `보증료율(${x.type === "apartment" ? "아파트" : "아파트 아님"})`, value: pct(p.rateMilli) },
    { label: `보증료(${term}${adjusted ? ", 할인·할증 전" : ""})`, value: won(p.base) },
  );
  numbers.push(p.base, p.total, p.debtRatioPct, p.rateMilli / 1000);
  if (p.surchargeApplied) {
    lines.push({ label: `할증 ${P.surchargePct}%(집에 먼저 잡힌 빚이 많아서)`, value: `+${won(p.surcharge)}` });
    numbers.push(p.surcharge);
  }
  if (p.discountPct && x.discount && x.discount !== "none") {
    lines.push({ label: `할인 ${p.discountPct}%(${DISCOUNT_LABEL[x.discount]})`, value: `−${won(p.discountAmount)}` });
    numbers.push(p.discountAmount);
  }
  if (p.loanPart) {
    lines.push({ label: `대출보증 부분(전세안심보증, 대출 ${eok(x.loan ?? 0)} × ${pct(P.loanPartRateMilliPct)})`, value: `+${won(p.loanPart)}` });
    numbers.push(p.loanPart);
  }
  if (adjusted) lines.push({ label: "내는 보증료(추산)", value: won(p.total) });
  const extra = [
    !x.months && `계약기간은 ${term}으로 계산했어요(다르면 알려 주세요).`,
    !x.discount && `연소득 ${eok(P.lowIncomeMax)} 이하(${P.discountPct.lowIncome}% 할인)나 신혼부부(${P.discountPct.newlywed}% 할인)처럼 할인 대상이면 말씀해 주세요.`,
    p.taxCreditOk && "보증료는 연말정산 세액공제도 받을 수 있어요.",
    multi && "단독·다가구는 다른 세입자 계약 확인서를 내지 않으면 가장 높은 요율이 붙어요.",
    p.surchargeApplied && p.discountPct > 0 && "할증·할인을 어떤 순서로 적용하는지는 HUG 안내에 없어 추산이에요.",
  ].filter(Boolean);
  const text = `${head} 가입 조건(보증금 상한·집값 90%·먼저 잡힌 빚)은 맞는 것으로 추산돼요. 보증료는 ${term} 동안 약 ${won(p.total)}이에요. ${extra.join(" ")} 실제 가입과 금액은 HUG 심사로 정해져요.`;
  return { text, lines, numbers };
}

/** 인용 id → 출처 링크(같은 페이지는 한 번만) */
export function sourcesFor(cite: string[]): { name: string; url: string }[] {
  const seen = new Set<string>();
  const out: { name: string; url: string }[] = [];
  for (const id of cite) {
    const k = KB.find((x) => x.id === id);
    if (!k || seen.has(k.src)) continue;
    seen.add(k.src);
    out.push({ name: k.srcName, url: k.src });
  }
  return out;
}

export const FALLBACK = "이 질문은 JU포켓이 확인한 HUG 자료로는 정확히 답하기 어려워요. HUG 전세반환보증 안내 페이지나 HUG 고객센터에서 확인해 주세요. 보증 조건·서류·기한·버팀목 요건처럼 자료에 있는 내용은 바로 답해 드릴게요.";
export const NOTE = "AI 답변은 HUG·주택도시기금·법령 원문에서 JU포켓이 확인한 자료(2026-11-07 확인)만 근거로 합니다. 가입 여부·대출 승인은 HUG와 은행 심사로 정해집니다.";
