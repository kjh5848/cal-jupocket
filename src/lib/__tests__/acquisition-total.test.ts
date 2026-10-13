import { describe, it, expect } from "vitest";
import { acquisitionTotal } from "../acquisition-total";

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
});
