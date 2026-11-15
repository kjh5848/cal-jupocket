import { describe, it, expect } from "vitest";
import { ANSWERS, matchAnswer } from "../hug-answers";
import { KB } from "../hug-kb";
import { numbersGrounded } from "../hug-chat-core";

const KB_IDS = new Set(KB.map((k) => k.id));

describe("미리 확인한 답변 모음 — 내용", () => {
  it("id 가 겹치지 않는다", () => {
    expect(new Set(ANSWERS.map((a) => a.id)).size).toBe(ANSWERS.length);
  });
  for (const a of ANSWERS) {
    it(`${a.id}: 근거 자료가 실제로 있고, 숫자는 모두 자료에 있다`, () => {
      expect(a.cite.length).toBeGreaterThan(0);
      for (const c of a.cite) expect(KB_IDS.has(c), c).toBe(true);
      // rates 가 바뀌어 자료 숫자가 달라지면 여기서 깨진다 — 답을 고쳐야 한다
      expect(numbersGrounded(a.a, []), a.a).toBe(true);
      expect(a.q.length).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("미리 확인한 답변 모음 — 고르기", () => {
  it("모음에 적힌 질문은 자기 답을 고르거나, 애매하면 고르지 않는다(남의 답은 절대 안 고른다)", () => {
    for (const a of ANSWERS) {
      for (const q of a.q) {
        const m = matchAnswer(q);
        if (m) expect(m.answer.id, `"${q}"`).toBe(a.id);
      }
      expect(matchAnswer(a.q[0])?.answer.id, `대표 질문 "${a.q[0]}"`).toBe(a.id);
    }
  });
  it("모음에 없는 표현도 같은 질문이면 고른다(2026-11-15 손으로 만든 질문)", () => {
    const cases: [string, string][] = [
      ["선순위가 뭔데요", "senior"],
      ["버팀목 자격 조건", "beotimmok-who"],
      ["근생 빌라 보증 되나요", "house-types"],
      ["녹음해도 불법 아니죠?", "recording"],
      ["HUG 돈 언제 줘요", "payout-time"],
      ["만기 두달전 주말이면", "deadline-weekend"],
      ["깡통전세 기준", "deposit-ratio"],
      ["부채비율이 뭐예요?", "debt-ratio"],
      ["계약을 했어요", "contracted"],
    ];
    for (const [q, id] of cases) expect(matchAnswer(q)?.answer.id, q).toBe(id);
  });
  it("핵심어만 스친 다른 질문은 고르지 않는다", () => {
    expect(matchAnswer("다가구인데 보증료 얼마예요")).toBeNull();
    expect(matchAnswer("녹음 파일 HUG에 어떻게 내요")?.answer.id).not.toBe("recording");
    expect(matchAnswer("카카오뱅크 전세대출 금리 알려줘")).toBeNull();
  });
  it("금액이 들어간 질문은 계산 쪽(AI)으로 넘긴다", () => {
    expect(matchAnswer("수도권 빌라 보증금 2억 공시가격 1억 8천인데 보증료 얼마예요?")).toBeNull();
  });
  it("전세와 상관없는 말·너무 짧은 말은 고르지 않는다", () => {
    expect(matchAnswer("안녕하세요")).toBeNull();
    expect(matchAnswer("네")).toBeNull();
    expect(matchAnswer("오늘 날씨 어때요")).toBeNull();
  });
});
