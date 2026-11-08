/**
 * 대출 질문 해석기 — "3억 5천, 4.5%, 30년, 원리금균등" 같은 한국어 문장을 LoanInput 으로 바꾼다.
 *
 * AI 챗봇(workers/api /api/chat)의 1단계. 여기서 금액·금리·기간이 다 나오면 모델을 부르지 않는다.
 * 숫자는 이 해석기(또는 모델이 뽑은 값을 이 파일의 검사기로 통과시킨 것)에서만 나오고, 계산은 loan.ts 가 한다 —
 * 모델이 쓴 문장이나 금액을 그대로 독자에게 보여 주지 않는다.
 */
import type { LoanInput, LoanMethod } from "./loan";

export interface LoanQuery {
  principal?: number;
  ratePct?: number;
  months?: number;
  method?: LoanMethod;
  graceMonths?: number;
}

const UNIT: Record<string, number> = { 억: 1e8, 천만: 1e7, 백만: 1e6, 십만: 1e5, 만: 1e4, 천: 1e3, 백: 1e2 };

const SINO: Record<string, number> = { 영: 0, 공: 0, 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9 };

/** "삼십" 30, "사십오" 45, "오" 5 — 십까지만(단위 앞 숫자는 이 정도면 된다) */
function sino(s: string): number {
  let n = 0;
  let cur = 0;
  for (const ch of s) {
    if (ch === "십") {
      n += (cur || 1) * 10;
      cur = 0;
    } else cur = SINO[ch] ?? 0;
  }
  return n + cur;
}

/** 쉼표·전각 숫자·한글 숫자("삼억 사점오프로 삼십년", "1억 오천")를 아라비아 숫자로 */
export function normalize(text: string): string {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/％/g, "%")
    .replace(/(\d),(?=\d{3})/g, "$1")
    .replace(/(\d)\s*\.\s*(\d)/g, "$1.$2")
    .replace(/([영공일이삼사오육칠팔구십]+)점([영공일이삼사오육칠팔구]+)(?=\s*(?:%|프로|퍼센트))/g, (_, a, b) => `${sino(a)}.${[...b].map((c: string) => SINO[c]).join("")}`)
    .replace(/(^|[^가-힣])([일이삼사오육칠팔구십]{1,3})(?=\s*(?:억|천만|천|백만|백|만|년|개월|프로|퍼센트|%))/g, (_, pre, a) => `${pre}${sino(a)}`)
    .replace(/(\d\s*억\s*)([일이삼사오육칠팔구])(?=\s*(?:천|백))/g, (_, pre, a) => `${pre}${SINO[a]}`)
    .replace(/(^|[^\d])천만/g, "$11천만");
}

/**
 * 금액 한 덩어리를 원으로. "3억 5천" "3억5000" "1.5억" "5천만원" "300000000원" "2억 3천 5백만"
 * 억 뒤의 맨 숫자·천·백은 만 단위로 읽는다(3억 5천 = 3억 5천만). loanContext 면 억 없이 "5천"도 5천만으로 읽는다.
 */
export function parseAmount(s: string, loanContext = true): number | undefined {
  const t = normalize(s).replace(/\s+/g, "");
  const re = /(\d+(?:\.\d+)?)(억|천만|백만|십만|만|천|백)?/g;
  let total = 0;
  let afterEok = false;
  let seen = false;
  let pendingMan = 0; // 억 뒤 "5천" "3백" 처럼 만이 생략된 덩어리 — 뒤에 만이 오면 함께 만 단위
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    seen = true;
    const n = Number(m[1]);
    const u = m[2];
    if (u === "억") {
      total += n * 1e8;
      afterEok = true;
    } else if (u === "만") {
      total += (pendingMan + n) * 1e4;
      pendingMan = 0;
    } else if (u === "천" || u === "백") {
      const k = u === "천" ? 1000 : 100;
      if (afterEok || loanContext) pendingMan += n * k;
      else total += n * k;
    } else if (u) {
      total += n * UNIT[u];
    } else if (afterEok) {
      pendingMan += n; // 3억 5000 → 5000만
    } else {
      total += n;
    }
  }
  total += pendingMan * 1e4;
  if (!seen) return undefined;
  return Math.round(total);
}

const AMOUNT_RE =
  /(\d[\d,]*(?:\.\d+)?\s*(?:억|천만|백만|십만|만|천|백)(?:\s*\d[\d,]*(?:\.\d+)?\s*(?:천만|백만|십만|만|천|백)?)*\s*원?|\d{5,}[\d,]*\s*원)/;

function months(n: number, unit: string): number {
  return unit === "년" ? Math.round(n * 12) : Math.round(n);
}

/** 문장 → 아는 만큼 채운 LoanQuery */
export function parseLoanQuery(text: string): LoanQuery {
  let t = normalize(text);
  const q: LoanQuery = {};

  // 거치기간을 먼저 떼어 낸다 — "거치 1년", "1년 거치", "거치기간 6개월"
  const g1 = t.match(/거치(?:\s*기간)?\s*(?:은|는|이|가)?\s*(\d+(?:\.\d+)?)\s*(년|개월|달)/);
  const g2 = t.match(/(\d+(?:\.\d+)?)\s*(년|개월|달)\s*(?:간\s*)?거치/);
  // "20년 거치 2년"처럼 둘 다 걸리면 "거치 N년"을, "3년 거치 27년 분할"이면 "N년 거치"를 쓴다
  const g = g1 && g2 ? (/분할/.test(t) ? g2 : g1) : (g1 ?? g2);
  if (g) {
    q.graceMonths = months(Number(g[1]), g[2]);
    t = t.replace(g[0], " ");
  }

  // 금리 — "4.5%", "연 4.5퍼센트", "금리 4.5", "이율 3.8프로"
  const r1 = t.match(/(\d+(?:\.\d+)?)\s*(?:%|퍼센트|프로)/);
  const r2 = t.match(/(?:금리|이율|이자율|연)\s*(?:은|는|이|가)?\s*(\d+(?:\.\d+)?)(?!\s*(?:년|개월|달|억|만|천|백|원|\d))/);
  const r = r1 ?? r2;
  if (r) {
    q.ratePct = Number(r[1]);
    t = t.replace(r[0], " ");
  }

  // 기간 — "30년", "360개월", "36달", "만기 20년". "3년 거치 27년 분할"은 거치 + 분할 = 대출기간
  const p = t.match(/(\d+(?:\.\d+)?)\s*(년|개월|달)(?!\s*거치)(\s*(?:간\s*)?분할)?/);
  if (p) {
    q.months = months(Number(p[1]), p[2]) + (p[3] && q.graceMonths ? q.graceMonths : 0);
    t = t.replace(p[0], " ");
  }

  // 금액
  const a = t.match(AMOUNT_RE);
  if (a) q.principal = parseAmount(a[0]);

  // 상환 방식 — 둘을 견주는 질문("차이", "뭐가 나아요", "비교")이면 정하지 않는다(세 방식을 나란히 보여 준다)
  if (/차이|비교|뭐가|어느|vs/i.test(t) && /원리금|원금\s*균등|만기/.test(t)) {
    /* 방식 미정 */
  } else if (/원리금\s*균등/.test(t)) q.method = "level";
  else if (/원금\s*균등/.test(t)) q.method = "principal";
  else if (/만기\s*일시|일시\s*상환|이자만/.test(t)) q.method = "bullet";

  return q;
}

export const LIMITS = {
  principal: { min: 100_000, max: 10_000_000_000 },
  ratePct: { min: 0, max: 30 },
  months: { min: 1, max: 600 },
};

/** 모델이 뽑았든 해석기가 뽑았든, 계산에 넘기기 전에 같은 검사를 거친다 */
export function validQuery(q: unknown): LoanQuery {
  const o = (q ?? {}) as Record<string, unknown>;
  const out: LoanQuery = {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
  const p = num(o.principal);
  if (p !== undefined && p >= LIMITS.principal.min && p <= LIMITS.principal.max) out.principal = Math.round(p);
  const r = num(o.ratePct);
  if (r !== undefined && r >= LIMITS.ratePct.min && r <= LIMITS.ratePct.max) out.ratePct = Math.round(r * 1000) / 1000;
  const m = num(o.months);
  if (m !== undefined && m >= LIMITS.months.min && m <= LIMITS.months.max) out.months = Math.round(m);
  if (o.method === "level" || o.method === "principal" || o.method === "bullet") out.method = o.method;
  const g = num(o.graceMonths);
  if (g !== undefined && g >= 0 && out.months !== undefined && g < out.months) out.graceMonths = Math.round(g);
  return out;
}

export type Missing = "principal" | "ratePct" | "months";
export function missing(q: LoanQuery): Missing[] {
  return (["principal", "ratePct", "months"] as const).filter((k) => q[k] === undefined);
}

/** 다 채워졌으면 LoanInput(방식이 없으면 undefined — 세 방식을 비교해서 보여 준다) */
export function toInput(q: LoanQuery): Omit<LoanInput, "method"> & { method?: LoanMethod } | null {
  if (missing(q).length) return null;
  return { principal: q.principal!, ratePct: q.ratePct!, months: q.months!, method: q.method, graceMonths: q.method === "bullet" ? undefined : q.graceMonths };
}
