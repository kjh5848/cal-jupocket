/**
 * HUG 전세 대화 — 모델 답을 독자에게 내보내기 전에 거치는 검사와 틀(서버 workers/api/src/hug-chat.ts 가 쓴다).
 *
 *  1. 모델은 자료(hug-kb)만 보고 문장으로 답한다. 답에 자료·질문에 없는 숫자가 하나라도 있으면 그 답을 버린다
 *  2. "보증 가입 되나요" 처럼 값이 다 모이면 모델은 값만 넘기고(check), 판정과 금액은 hugGuarantee() 가 계산한다
 *  3. check 의 금액은 사용자가 대화에서 실제로 말한 금액이어야 한다(모델이 지어낸 금액은 버린다)
 */
import { KB, kbPrompt, numbersIn, eok } from "./hug-kb";
import { amountsIn } from "./loan-parse";
import { hugGuarantee, type GuaranteeInput, type HouseType } from "./hug-jeonse";
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

전세반환보증 가입 가능 여부를 묻는 경우:
- 필요한 값: 집 종류(아파트/오피스텔/빌라=연립·다세대/단독·다가구), 수도권 여부, 보증금, 집값(시세 또는 공시가격 중 무엇인지), 선순위채권(근저당 채권최고액, 없으면 0), 단독·다가구면 나보다 앞선 다른 세입자 보증금 합계.
- 빠진 값이 있으면 한 번에 하나나 둘씩 물어본다. 이때는 "계산해 봤어요"라고 말하지 않는다.
- 값이 다 모이면 check 를 채우고, reply 에는 숫자 없이 "말씀하신 값으로 계산해 봤어요." 정도만 쓴다. 판정은 시스템이 계산해서 붙인다.

반드시 아래 JSON 하나로만 답한다(앞뒤에 다른 글자 금지):
{"reply": "사용자에게 보일 답", "cite": ["자료 id", ...], "check": null 또는 {"type": "apartment|officetel|row|multi", "capital": true|false, "deposit": 원, "senior": 원, "otherDeposits": 원, "basis": "market|public", "price": 원}}
- cite 에는 답에 실제로 쓴 [자료]의 id 만 넣는다.
- type: 아파트=apartment, 오피스텔=officetel, 빌라·연립·다세대=row, 단독·다가구·다중=multi.
- basis: 공시가격·기준시가면 public, 시세·감정가·매매가면 market.

[자료]
${kbPrompt()}`;

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

export interface ModelOut {
  reply: string;
  cite: string[];
  check: GuaranteeInput | null;
}

const TYPES: HouseType[] = ["apartment", "officetel", "row", "multi"];

/** 모델이 낸 JSON 을 검사한다. check 금액은 사용자가 말한 금액(또는 0)이어야 한다 */
export function readModel(raw: unknown, history: Msg[]): ModelOut | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  if (typeof o.reply !== "string" || !o.reply.trim()) return null;
  const cite = Array.isArray(o.cite) ? [...new Set(o.cite.filter((c): c is string => typeof c === "string" && KB_IDS.has(c)))] : [];
  let check: GuaranteeInput | null = null;
  const c = o.check as Record<string, unknown> | null | undefined;
  if (c && typeof c === "object") {
    const said = new Set(history.filter((m) => m.role === "user").flatMap((m) => amountsIn(m.content)));
    const amt = (v: unknown, zeroOk: boolean) => (typeof v === "number" && Number.isFinite(v) && ((zeroOk && v === 0) || said.has(Math.round(v))) ? Math.round(v) : undefined);
    const type = TYPES.find((t) => t === c.type);
    const deposit = amt(c.deposit, false);
    const price = amt(c.price, false);
    const senior = amt(c.senior ?? 0, true);
    const other = amt(c.otherDeposits ?? 0, true);
    if (type && typeof c.capital === "boolean" && (c.basis === "public" || c.basis === "market") && deposit && price && senior !== undefined && other !== undefined) {
      check = { type, capital: c.capital, deposit, senior, otherDeposits: type === "multi" ? other : 0, basis: c.basis, price };
    }
  }
  return { reply: o.reply.trim().replace(/\*\*/g, ""), cite, check };
}

const TYPE_NAME: Record<HouseType, string> = { apartment: "아파트", officetel: "오피스텔", row: "연립·다세대", multi: "단독·다가구" };

/** 가입 가능 여부 — 숫자는 전부 hugGuarantee() 결과 */
export function checkAnswer(x: GuaranteeInput): { text: string; lines: { label: string; value: string }[]; numbers: number[] } {
  const g = hugGuarantee(x);
  const lines = [
    { label: `HUG가 보는 집값${x.basis === "public" ? "(공시가격 × 140%)" : ""}`, value: won(g.housePrice) },
    { label: "보증금 + 선순위 한도(집값의 90%)", value: won(g.ltvLine) },
    { label: "보증금 + 선순위", value: won(x.deposit + g.seniorTotal) },
    { label: `선순위 한도(집값의 ${x.type === "multi" ? 80 : 60}%)`, value: won(g.seniorLine) },
    { label: `보증금 상한(${x.capital ? "수도권" : "그 외 지역"})`, value: eok(g.depositCap) },
    { label: "이 조건에서 보증되는 최대 보증금", value: won(g.maxDeposit) },
  ];
  const fails = [!g.depositOk && "보증금이 상한을 넘어요", !g.ltvOk && "보증금 + 선순위가 집값의 90%를 넘어요", !g.seniorOk && "선순위채권이 한도를 넘어요"].filter(Boolean);
  const head = `${x.capital ? "수도권" : "수도권 밖"} ${TYPE_NAME[x.type]}, 보증금 ${eok(x.deposit)} 기준으로`;
  const text = g.ok
    ? `${head} 전세반환보증 가입 조건(보증금 상한·90%·선순위)은 맞는 것으로 추산돼요. 실제 가입은 HUG가 집값 기준과 서류·권리관계를 함께 심사해서 정해요.`
    : `${head} 지금 조건으로는 가입이 어려울 것으로 추산돼요 — ${fails.join(", ")}. 실제 판단은 HUG 심사로 정해져요.`;
  return { text, lines, numbers: [g.housePrice, g.ltvLine, g.seniorLine, g.depositCap, g.maxDeposit, x.deposit + g.seniorTotal] };
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
