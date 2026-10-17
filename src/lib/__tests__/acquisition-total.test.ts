import { describe, it, expect } from "vitest";
import { acquisitionTotal, acquisitionPage, surchargeTimes } from "../acquisition-total";

describe("취득세 합계", () => {
  it("아파트 5억원(85㎡ 이하) — 취득세 1% + 교육세 0.1%, 농특세 비과세", () => {
    const x = acquisitionTotal(500_000_000, "house", { smallArea: true });
    expect(x.acq).toBe(5_000_000);
    expect(x.edu).toBe(500_000);
    expect(x.rural).toBe(0);
    expect(x.total).toBe(5_500_000);
  });
  it("85㎡ 초과면 농특세 0.2%", () => expect(acquisitionTotal(500_000_000, "house").rural).toBe(1_000_000));
  it("오피스텔·토지·상가 4.6% — 4% + 0.4% + 0.2%", () => {
    const x = acquisitionTotal(300_000_000, "officetel");
    expect(x.acq).toBe(12_000_000);
    expect(x.edu).toBe(1_200_000);
    expect(x.rural).toBe(600_000);
    expect(x.total).toBe(13_800_000);
  });
  it("중과 8%·12% — 4% + 2% × 2·4, 교육세 0.4%", () => {
    expect(acquisitionTotal(500_000_000, "house8").acq).toBe(40_000_000);
    expect(acquisitionTotal(500_000_000, "house12").acq).toBe(60_000_000);
    expect(acquisitionTotal(500_000_000, "house12").edu).toBe(2_000_000);
    expect(acquisitionTotal(500_000_000, "house12").rural).toBeNull();
  });
  it("생애최초 — 200만원 한도, 소형 300만원, 12억원 초과는 없음", () => {
    expect(acquisitionTotal(500_000_000, "house", { firstHome: "general" }).relief).toBe(2_000_000);
    expect(acquisitionTotal(150_000_000, "house", { firstHome: "general" }).relief).toBe(1_500_000);
    expect(acquisitionTotal(500_000_000, "house", { firstHome: "small" }).relief).toBe(3_000_000);
    expect(acquisitionTotal(1_300_000_000, "house", { firstHome: "general" }).relief).toBe(0);
  });
  it("증여·상속받은 85㎡ 이하 주택도 농특세 비과세 — 시행령 제4조 ⑤는 원인을 가리지 않는다", () => {
    expect(acquisitionTotal(500_000_000, "gift", { house: true, smallArea: true }).rural).toBe(0);
    expect(acquisitionTotal(500_000_000, "inheritance", { house: true, smallArea: true }).rural).toBe(0);
    expect(acquisitionTotal(500_000_000, "gift", { smallArea: true }).rural).toBe(1_000_000);
    expect(acquisitionTotal(500_000_000, "gift", { house: true }).rural).toBe(1_000_000);
  });
});

describe("주택 유상거래 중과 판정 — 제13조의2 제1항", () => {
  it("조정대상지역: 1주택 표준 · 2주택 8% · 3주택 이상 12%", () => {
    expect(surchargeTimes(1, true, false)).toBe(0);
    expect(surchargeTimes(2, true, false)).toBe(2);
    expect(surchargeTimes(3, true, false)).toBe(4);
  });
  it("조정대상지역 밖: 2주택까지 표준 · 3주택 8% · 4주택 이상 12%", () => {
    expect(surchargeTimes(2, false, false)).toBe(0);
    expect(surchargeTimes(3, false, false)).toBe(2);
    expect(surchargeTimes(4, false, false)).toBe(4);
  });
  it("법인은 12%", () => expect(surchargeTimes(1, false, true)).toBe(4));
});

describe("취득세 계산기 한 장 — roberin 같은 입력 대조(2026-10-18)", () => {
  const P = (price: number, o: Parameters<typeof acquisitionPage>[1]) => acquisitionPage(price, o);
  it("주택 매매 — 85㎡ 이하/초과", () => {
    expect(P(300_000_000, { cause: "housePaid", smallArea: true }).total).toBe(3_300_000);
    expect(P(500_000_000, { cause: "housePaid", smallArea: true }).total).toBe(5_500_000);
    expect(P(500_000_000, { cause: "housePaid" }).total).toBe(6_500_000);
    expect(P(750_000_000, { cause: "housePaid", smallArea: true }).total).toBe(16_500_000);
    expect(P(750_000_000, { cause: "housePaid" }).total).toBe(18_000_000);
    expect(P(900_000_000, { cause: "housePaid", smallArea: true }).total).toBe(29_700_000);
    expect(P(1_200_000_000, { cause: "housePaid" }).total).toBe(42_000_000);
  });
  it("6.5억은 roberin(9,533,334)과 다르다 — 세율을 넷째자리에서 끊는다", () => {
    expect(P(650_000_000, { cause: "housePaid", smallArea: true }).total).toBe(9_509_500);
  });
  it("증여·상속 주택", () => {
    expect(P(500_000_000, { cause: "gift", house: true, smallArea: true }).total).toBe(19_000_000);
    expect(P(500_000_000, { cause: "gift", house: true }).total).toBe(20_000_000);
    expect(P(500_000_000, { cause: "inheritanceOther", house: true, smallArea: true }).total).toBe(14_800_000);
    expect(P(500_000_000, { cause: "inheritanceOther", house: true }).total).toBe(15_800_000);
  });
  it("중과 — 농특세는 확인 안 함(null)", () => {
    const a = P(500_000_000, { cause: "housePaid", smallArea: true, houses: 2, regulated: true });
    expect([a.acq, a.edu, a.rural, a.total, a.times]).toEqual([40_000_000, 2_000_000, null, 42_000_000, 2]);
    expect(P(500_000_000, { cause: "housePaid", houses: 3, regulated: true }).acq).toBe(60_000_000);
    expect(P(500_000_000, { cause: "housePaid", corporate: true }).acq).toBe(60_000_000);
    expect(P(500_000_000, { cause: "housePaid", smallArea: true, houses: 2 }).total).toBe(5_500_000);
  });
  it("상가·토지는 주택 체크와 상관없이 농특세 0.2%", () => {
    expect(P(300_000_000, { cause: "paidOther", house: true, smallArea: true }).total).toBe(13_800_000);
  });
  it("0원이면 모두 0", () => expect(P(0, { cause: "housePaid" }).total).toBe(0));
});
