import { describe, expect, it } from "vitest";
import rates from "../../rates/retirement-loan-2026.json";
import {
  collateralLimit,
  collateralOnly,
  limitPercent,
  narrowerWhenWithdrawing,
  reasons,
} from "../retirement-loan";

describe("퇴직연금 담보대출 한도", () => {
  it("시행령 제2조 제2항 제1호의 100분의 50을 그대로 쓴다", () => {
    expect(limitPercent).toBe(50);
  });

  it("적립금의 절반", () => {
    expect(collateralLimit(60_000_000)).toBe(30_000_000);
    expect(collateralLimit(0)).toBe(0);
  });

  it("홀수 원은 올리지 않고 버린다 — 한도를 넘기면 안 된다", () => {
    expect(collateralLimit(1_000_001)).toBe(500_000);
  });

  it("음수 적립금은 0으로 막는다", () => {
    expect(collateralLimit(-1)).toBe(0);
  });
});

describe("사유 표", () => {
  it("시행령 제2조 제1항의 7개 호를 모두 담는다", () => {
    expect(reasons).toHaveLength(7);
    expect(reasons.map((r) => r.clause)).toEqual([
      "제2조 제1항 제1호",
      "제2조 제1항 제1호의2",
      "제2조 제1항 제2호",
      "제2조 제1항 제3호",
      "제2조 제1항 제4호",
      "제2조 제1항 제4호의2",
      "제2조 제1항 제5호",
    ]);
  });

  it("담보제공은 7개 호 전부에 열려 있다", () => {
    expect(reasons.every((r) => r.collateral === "yes")).toBe(true);
  });

  it("대학등록금·혼례비·장례비는 담보대출로만 열린다", () => {
    const only = collateralOnly();
    expect(only.map((r) => r.key)).toEqual(["tuitionWeddingFuneral"]);
  });

  it("의료비와 휴업·재난은 중도인출 쪽이 더 좁다", () => {
    expect(narrowerWhenWithdrawing().map((r) => r.key)).toEqual([
      "medical",
      "disaster",
    ]);
  });
});

describe("근거", () => {
  it("확인일과 법령 버전이 적혀 있다", () => {
    expect(rates.verifiedOn).toBe("2026-09-21");
    expect(rates.lawVersion).toContain("법률 제21475호");
    expect(rates.lawVersion).toContain("대통령령 제36220호");
  });

  it("출처가 법령 원문이다", () => {
    expect(rates.sources.length).toBeGreaterThan(0);
    expect(rates.sources.every((s) => s.url.includes("law.go.kr"))).toBe(true);
  });

  it("금리와 DSR 은 확인하지 않은 것으로 적어 둔다", () => {
    const text = rates.notVerified.join(" ");
    expect(text).toContain("금리");
    expect(text).toContain("DSR");
  });
});
