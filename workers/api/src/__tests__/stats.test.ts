import { describe, it, expect } from "vitest";
import { cleanEvent, foldDays } from "../stats";

describe("사용 집계 이벤트 거르기", () => {
  it("hug_ 로 시작하는 이름만 받는다", () => {
    expect(cleanEvent({ n: "hug_open" })).toEqual({ n: "hug_open", k: "", page: "" });
    expect(cleanEvent({ n: "page_view" })).toBeNull();
    expect(cleanEvent({ n: "hug_OPEN" })).toBeNull();
    expect(cleanEvent(null)).toBeNull();
  });
  it("키·페이지가 이상하면 비운다", () => {
    expect(cleanEvent({ n: "hug_guide", k: "a b<script>", page: "https://x" })).toEqual({ n: "hug_guide", k: "", page: "" });
    expect(cleanEvent({ n: "hug_guide", k: "landlord-gone", page: "/jeonse-chat/" })).toEqual({ n: "hug_guide", k: "landlord-gone", page: "/jeonse-chat/" });
  });
  it("질문 문장은 미리 준비한 답으로 답했을 때만, 500자까지 받는다", () => {
    expect(cleanEvent({ n: "hug_chat_answer", k: "bank", q: "  보증료 얼마예요  " })?.q).toBe("보증료 얼마예요");
    expect(cleanEvent({ n: "hug_guide", k: "x", q: "몰래 넣은 글" })?.q).toBeUndefined();
    expect(cleanEvent({ n: "hug_chat_answer", k: "bank", q: "가".repeat(900) })?.q).toHaveLength(500);
  });
});

describe("날짜별로 접기", () => {
  it("users·active 는 따로, 나머지는 이벤트 합계로 모으고 최근 날짜가 먼저다", () => {
    const d = foldDays([
      { day: "2026-11-21", name: "users", key: "", n: 3 },
      { day: "2026-11-21", name: "active", key: "", n: 2 },
      { day: "2026-11-21", name: "hug_guide", key: "a", n: 1 },
      { day: "2026-11-21", name: "hug_guide", key: "b", n: 4 },
      { day: "2026-11-22", name: "users", key: "", n: 1 },
    ]);
    expect(d.map((x) => x.day)).toEqual(["2026-11-22", "2026-11-21"]);
    expect(d[1]).toEqual({ day: "2026-11-21", users: 3, active: 2, events: { hug_guide: 5 } });
  });
});

describe("깨진 글자", () => {
  it("글자가 깨져 온 질문 문장은 받지 않는다(이벤트 횟수는 센다)", () => {
    const ev = cleanEvent({ n: "hug_chat_answer", k: "bank", q: "\uFFFD\uFFFD 반송되면 어떻게 해요?" });
    expect(ev?.n).toBe("hug_chat_answer");
    expect(ev?.q).toBeUndefined();
  });
});
