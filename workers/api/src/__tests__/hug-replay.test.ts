import { describe, it, expect } from "vitest";
import { CASES, replay, shown, kindOf } from "./hug-rehearsal";
import rec from "./fixtures/hug-recorded.json";

const answers = rec.answers as Record<string, unknown>;

// 녹화본(hug-recorded.json)을 가짜 AI 로 돌려 서버 파이프라인이 기대대로 답하는지 본다 — 실제 AI 호출 없음
describe("HUG 상담 리허설 — 녹화된 모델 답 재생", () => {
  for (const c of CASES) {
    it(`${c.id} → ${c.expect.kind}`, async () => {
      expect(answers[c.id], "녹화본이 없다 — scripts/hug-rehearsal.ts 로 다시 녹화").toBeDefined();
      const { status, body } = await replay(c, answers[c.id]);
      expect(status).toBe(200);
      const kind = kindOf(body);
      const text = shown(body);
      if (c.expect.kind === "check") expect(kind).toBe("check");
      if (c.expect.kind === "kb") expect(kind).toBe("kb");
      if (c.expect.kind === "refuse") expect(kind).toBe("refuse");
      if (c.expect.kind === "ask") {
        expect(body.lines).toBeUndefined();
        expect(["ask", "kb"]).toContain(kind);
      }
      for (const s of c.expect.contains ?? []) expect(text).toContain(s);
      for (const s of c.expect.notContains ?? []) expect(text).not.toContain(s);
    });
  }
});

describe("가짜 AI — 서버 안전장치", () => {
  const villa = CASES.find((c) => c.id === "ready-villa")!;
  it("지어낸 숫자를 쓴 답은 버리고, 두 번째도 그러면 정해진 안내로", async () => {
    const bad = { reply: "보증료는 약 37만원이에요.", cite: ["premium"], check: null };
    const r = await replay({ ...villa, turns: ["보증료 얼마예요?"] }, [bad, bad]);
    expect(r.calls).toBe(2);
    expect(shown(r.body)).not.toContain("37만원");
    expect(kindOf(r.body)).toBe("fallback");
  });
  it("집값을 근저당 칸에 넣으면 다시 시키고, 고친 답으로 계산한다", async () => {
    const swapped = { reply: "계산해 봤어요.", cite: [], check: { type: "row", capital: true, deposit: 2e8, senior: 1.8e8, basis: "public", price: 1.8e8 } };
    const fixed = { ...swapped, check: { ...swapped.check, senior: 0 } };
    const r = await replay(villa, [swapped, fixed]);
    expect(r.calls).toBe(2);
    expect(shown(r.body)).toContain("736,000원");
  });
  it("AI 사용량 초과면 429 로 '쉬어요'", async () => {
    const env = {
      DB: { prepare: () => ({ bind: () => ({ first: async () => ({ n: 1 }), run: async () => ({}) }) }) },
      AI: { run: async () => { throw new Error("4006: daily free allocation"); } },
    } as never;
    const { hugChat } = await import("../hug-chat");
    const r = await hugChat({ messages: [{ role: "user", content: "보증료 얼마예요?" }] }, env, { ip: "x", day: "2026-11-08" });
    expect(r.status).toBe(429);
  });
});
