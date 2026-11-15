import { describe, it, expect } from "vitest";
import { relevantKb } from "../hug-chat-core";

describe("relevantKb — 질문과 가까운 자료를 먼저 짚는다", () => {
  it("반송·공시송달 → 연락두절", () => {
    expect(relevantKb("갱신거절 내용증명이 반송되면 어떻게 해야 해요?")).toContain("landlord-gone");
  });
  it("반전세 상한 → 전월세전환", () => {
    expect(relevantKb("반전세면 월세 있는데 상한을 어떻게 계산해요?")).toContain("rent-conversion");
  });
  it("이행청구 서류 → HUG 청구", () => {
    expect(relevantKb("HUG 이행청구 서류가 뭐예요")).toContain("after-accident");
  });
});
