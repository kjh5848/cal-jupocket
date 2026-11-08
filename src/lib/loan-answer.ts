/**
 * AI에게 물어보기(대출) — 답을 만드는 틀. 사이트와 알림 서버(workers/api)가 같이 쓴다.
 *
 * 숫자는 전부 loanSchedule()/compareMethods() 결과에서 나온다. 모델이 쓴 문장·금액은 여기로 들어오지 않는다.
 * 계산기로 답할 수 없는 질문(은행 금리·자격·한도·추천)은 정해진 문장으로 답하고, 서버가 글감으로 모은다.
 */
import { loanSchedule, compareMethods, type LoanMethod } from "./loan";
import { toInput, missing, type LoanQuery, type Missing } from "./loan-parse";
import { won } from "./won";

/** 계산기 밖 질문 — 특정 은행·상품 금리, 자격·한도·규제, 추천·판단 */
const OUT =
  /은행|뱅크|카뱅|토스|어디|추천|자격|조건|한도|DSR|LTV|DTI|스트레스|디딤돌|버팀목|보금자리|특례|청년|신혼|대환|갈아타|중도상환|수수료|고정\s*금리|변동\s*금리|신용\s*점수|등급|연봉|소득|투자|주식|해도\s*될까|해야\s*할까|좋아요|나이|마이너스|카드론|정상/i;

export type Answer =
  | { kind: "calc"; query: LoanQuery; text: string; lines: { label: string; value: string }[] }
  | { kind: "ask"; query: LoanQuery; need: Missing[]; text: string }
  | { kind: "out"; text: string };

const METHOD_NAME: Record<LoanMethod, string> = { level: "원리금균등", principal: "원금균등", bullet: "만기일시" };
const NEED_NAME: Record<Missing, string> = { principal: "대출 금액", ratePct: "연 금리(%)", months: "대출 기간" };

export function isOutOfScope(q: string, query: LoanQuery): boolean {
  return OUT.test(q) && missing(query).length > 0;
}

const years = (m: number) => (m % 12 === 0 ? `${m / 12}년` : `${m}개월`);

export function answer(question: string, query: LoanQuery): Answer {
  if (isOutOfScope(question, query)) {
    return {
      kind: "out",
      text:
        "이 질문은 계산기로 답할 수 없습니다. 은행별 금리·대출 자격·한도는 JU포켓이 확인한 숫자가 없어 답하지 않습니다 — 은행이나 주택도시기금·한국주택금융공사 안내를 확인해 주세요. 대출 금액·금리·기간을 알려 주시면 매달 낼 돈과 총이자는 바로 계산해 드립니다.",
    };
  }
  const inp = toInput(query);
  if (!inp) {
    const need = missing(query);
    return {
      kind: "ask",
      query,
      need,
      text: `계산하려면 ${need.map((k) => NEED_NAME[k]).join("·")} 값을 더 알려 주세요. 예: "3억 4.5% 30년 원리금균등"처럼 한 줄로 적으면 됩니다.`,
    };
  }
  const head = `${won(inp.principal)}을 연 ${inp.ratePct}%로 ${years(inp.months)}${inp.graceMonths ? `(거치 ${years(inp.graceMonths)} 포함)` : ""} 빌리면`;
  if (inp.method) {
    const r = loanSchedule({ ...inp, method: inp.method });
    const lines = [
      ...(inp.graceMonths ? [{ label: `거치기간 매달(이자만)`, value: won(r.gracePayment) }] : []),
      { label: inp.method === "level" ? "매달 내는 돈" : "첫 달 내는 돈", value: won(r.firstPayment) },
      ...(inp.method === "principal" ? [{ label: "마지막 달 내는 돈", value: won(r.lastPayment) }] : []),
      ...(inp.method === "bullet" ? [{ label: "마지막 달(원금 포함)", value: won(r.lastPayment) }] : []),
      { label: "총이자", value: won(r.totalInterest) },
      { label: "총 갚는 돈", value: won(r.totalPaid) },
    ];
    return { kind: "calc", query, lines, text: `${head} ${METHOD_NAME[inp.method]} 기준으로 이렇게 추산됩니다.` };
  }
  const all = compareMethods(inp);
  const lines = all.flatMap((r) => [
    { label: `${METHOD_NAME[r.method]} — ${r.method === "level" ? "매달" : "첫 달"}`, value: won(r.firstPayment) },
    { label: `${METHOD_NAME[r.method]} — 총이자`, value: won(r.totalInterest) },
  ]);
  return { kind: "calc", query, lines, text: `${head} 상환 방식별로 이렇게 추산됩니다. 방식을 정하지 않으셔서 셋을 나란히 보여 드립니다.` };
}

/** 계산 결과 밑에 늘 붙이는 한 줄 */
export const ANSWER_NOTE = "추산입니다. 원 미만 버림, 매달 같은 금리 기준이며 실제 은행은 일수 계산·변동금리·수수료로 다를 수 있습니다.";
