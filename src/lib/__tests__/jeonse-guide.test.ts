import { describe, it, expect } from "vitest";
import { plan, nextItem, dateText, termsIn, localAnswer, GUIDES, HOUSE_GUIDES, CONTACT } from "../jeonse-guide";
import { TERMS } from "../../data/jeonse-terms";
import { toDay } from "../date-calc";
import r from "../../rates/hug-jeonse-2026.json";

const d = (s: string) => toDay(s)!;

describe("내 일정 — 날짜·요일·D-day", () => {
  const x = { contract: d("2026-11-10"), start: d("2026-12-20"), moveIn: d("2026-12-20"), end: d("2028-12-19") };
  it("요일을 붙인다", () => {
    expect(dateText(d("2026-12-20"))).toBe("12월 20일(일)");
    expect(dateText(d("2026-11-08"))).toBe("11월 8일(일)");
    expect(dateText(d("2027-12-26"), d("2026-11-08"))).toBe("2027년 12월 26일(일)");
  });
  it("오늘 기준 D-day 와 다음 할 일", () => {
    const items = plan(x, d("2026-11-08"));
    const first = items[0];
    expect(first.key).toBe("pre-limit");
    expect(first.when).toBe("12월 6일(일)");
    expect(first.dday).toBe("D-28");
    expect(nextItem(items)?.key).toBe("pre-limit");
    expect(items.find((i) => i.key === "lease-report")?.when).toBe("12월 10일(목)");
    const later = plan(x, d("2026-12-21"));
    expect(later.find((i) => i.key === "move-in")?.past).toBe(true);
    expect(nextItem(later)?.past).toBe(false);
  });
  it("할 일에 나오는 용어를 찾는다", () => {
    const moveIn = plan(x, d("2026-11-08")).find((i) => i.key === "move-in")!;
    expect(moveIn.terms).toEqual(expect.arrayContaining(["전입신고", "확정일자", "대항력"]));
    expect(termsIn("근저당이 있어요")).toContain("근저당 · 채권최고액");
  });
});

describe("상황 안내", () => {
  const all = [...GUIDES, CONTACT];
  it("출처는 rates 의 URL 이다", () => {
    const urls = new Set(Object.values(r.sources));
    for (const g of all) for (const s of g.sources) expect(urls.has(s.url), `${g.id} ${s.url}`).toBe(true);
  });
  it("id 가 겹치지 않는다", () => {
    expect(new Set(all.map((g) => g.id)).size).toBe(all.length);
  });
  it("집 보는 중 안내 세 가지와 HUG 권고 숫자", () => {
    expect(HOUSE_GUIDES.map((g) => g.id)).toEqual(["house-find", "house-visit", "house-price"]);
    expect(HOUSE_GUIDES[2].steps.join(" ")).toContain(`${r.houseHunting.avoidDepositOverPricePct}%`);
  });
  it("녹음 안내는 법 조항과 판례를 출처로 둔다", () => {
    expect(CONTACT.sources.map((s) => s.name)).toEqual(expect.arrayContaining(["통신비밀보호법 제3조", "대법원 2006도4981 판결"]));
    expect(CONTACT.steps.join(" ")).toContain("내가 빠진");
  });
});

describe("글로 물을 때 — 자료에서 먼저", () => {
  it("용어 뜻", () => {
    expect(localAnswer("대항력이 뭐예요?")).toMatchObject({ kind: "term", term: { t: "대항력" } });
    expect(localAnswer("전입세대확인서가 뭐예요")).toMatchObject({ kind: "term", term: { t: "전입세대확인서" } });
  });
  it("상황", () => {
    expect(localAnswer("집주인이 보증금을 안 돌려줘요")).toMatchObject({ kind: "guide", guide: { id: "not-returned" } });
    expect(localAnswer("통화 녹음해도 되나요?")).toMatchObject({ kind: "guide", guide: { id: "contact" } });
    expect(localAnswer("집 보러 갈 때 뭘 봐야 해요")).toMatchObject({ kind: "guide", guide: { id: "house-visit" } });
    expect(localAnswer("이 집 시세가 적당한지 모르겠어요")).toMatchObject({ kind: "guide", guide: { id: "house-price" } });
  });
  it("계산 질문은 AI·계산기로 넘긴다", () => {
    expect(localAnswer("보증료 얼마예요?")).toBeNull();
    expect(localAnswer("수도권 빌라 2억인데 보증 될까요?")).toBeNull();
  });
  it("용어 목록 전부 이름이 2자 이상으로 잡힌다", () => {
    for (const t of TERMS) expect(termsIn(t.t).length, t.t).toBeGreaterThan(0);
  });
});

describe("용어 — 예시와 아래 단어(2026-11-08)", () => {
  it("모든 용어에 예를 들면이 있다", () => {
    for (const t of TERMS) expect(t.ex, t.t).toBeTruthy();
  });
  it("설명 속 어려운 단어도 용어로 잡힌다(근저당 → 담보·을구·채권)", () => {
    const g = TERMS.find((t) => t.t.startsWith("근저당"))!;
    expect(termsIn(g.d)).toEqual(expect.arrayContaining(["담보", "을구"]));
  });
  it("기초 단어 뜻을 바로 답한다", () => {
    expect(localAnswer("을구가 뭐야?")).toMatchObject({ kind: "term", term: { t: "을구" } });
    expect(localAnswer("담보가 무슨 뜻이에요")).toMatchObject({ kind: "term", term: { t: "담보" } });
  });
  it("'뭐 해야' 상황 질문은 용어로 읽지 않는다", () => {
    expect(localAnswer("보증금 못 받으면 뭐 해야 해요?")).not.toMatchObject({ kind: "term" });
  });
  it("보증한도 예시는 rates 로 계산한 값이다", () => {
    const t = TERMS.find((x) => x.t === "보증한도")!;
    expect(t.ex).toContain(`${r.guarantee.ltvLimitPct}%`);
    expect(t.ex).toContain("2억 2,000만원");
  });
});
