/**
 * 날짜 계산기 일본어판 표기 + 일본어판 본문이 기대는 계산 규칙.
 * 민법 第140条(初日不算入) — 기본값(종료일 − 시작일)이 초일 불산입, '종료일 포함'이 양끝 넣기.
 * 민법 第143条 第2項 단서 — 응당일이 없는 달이면 그 달 말일(본문은 이 말일 규칙까지만 말한다).
 */
import { describe, it, expect } from "vitest";
import { toDay, span, shift } from "../date-calc";
import { labelJa, spanTextJa, ddayJa } from "../date-format-ja";

const d = (s: string) => toDay(s)!;

describe("일본어 표기", () => {
  it("날짜 + 요일", () => {
    expect(labelJa(d("2026-10-19"))).toBe("2026年10月19日（月）");
    expect(labelJa(d("2027-01-03"))).toBe("2027年1月3日（日）");
  });
  it("년·か月·日, 0인 칸은 뺀다", () => {
    expect(spanTextJa({ years: 1, months: 2, restDays: 3 })).toBe("1年2か月3日");
    expect(spanTextJa({ years: 0, months: 2, restDays: 0 })).toBe("2か月");
    expect(spanTextJa({ years: 0, months: 0, restDays: 0 })).toBe("0日");
  });
  it("あと · 今日 · 前", () => {
    expect(ddayJa(d("2026-10-31"), d("2026-10-19"))).toBe("あと12日");
    expect(ddayJa(d("2026-10-19"), d("2026-10-19"))).toBe("今日");
    expect(ddayJa(d("2026-10-16"), d("2026-10-19"))).toBe("3日前");
  });
});

describe("본문 예시가 계산과 맞다", () => {
  it("10月1日〜10月3日: 初日不算入 2日, 両端入れ 3日", () => {
    expect(span(d("2026-10-01"), d("2026-10-03"), false).days).toBe(2);
    expect(span(d("2026-10-01"), d("2026-10-03"), true).days).toBe(3);
  });
  it("1月1日〜12月31日 両端入れ = 1年", () => {
    const s = span(d("2026-01-01"), d("2026-12-31"), true);
    expect(spanTextJa(s)).toBe("1年");
  });
  it("응당일이 없으면 그 달 말일", () => {
    expect(labelJa(shift(d("2027-01-31"), 1, "month"))).toBe("2027年2月28日（日）");
    expect(labelJa(shift(d("2028-01-31"), 1, "month"))).toBe("2028年2月29日（火）");
  });
  it("2026年10月19日〜12月31日: 73日 · 平日 53日", () => {
    const s = span(d("2026-10-19"), d("2026-12-31"), false);
    expect(s.days).toBe(73);
    expect(s.weekdays).toBe(53);
  });
});
