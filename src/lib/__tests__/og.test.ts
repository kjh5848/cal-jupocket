import { describe, it, expect } from "vitest";
import { ogSlug, ogPath } from "../og";
import { ogPathFor } from "../og-pages";

describe("ogSlug", () => {
  it("루트는 home", () => {
    expect(ogSlug("/")).toBe("home");
  });

  it("한 단계 경로", () => {
    expect(ogSlug("/vat/")).toBe("vat");
  });

  it("두 단계 경로는 하이픈으로 잇는다", () => {
    expect(ogSlug("/guide/vat-filing/")).toBe("guide-vat-filing");
  });

  it("끝 슬래시가 없어도 같다", () => {
    expect(ogSlug("/guide/vat-filing")).toBe(ogSlug("/guide/vat-filing/"));
  });

  it("쿼리와 해시를 무시한다", () => {
    expect(ogSlug("/vat/?a=1#b")).toBe("vat");
  });
});

describe("ogPath", () => {
  it("png 경로를 만든다", () => {
    expect(ogPath("/guide/irp-account/")).toBe("/og/guide-irp-account.png");
  });
});

describe("ogPathFor", () => {
  it("생성된 글은 자기 이미지를 쓴다", () => {
    expect(ogPathFor("/guide/vat-filing/")).toBe("/og/guide-vat-filing.png");
  });

  it("계산기도 자기 이미지를 쓴다", () => {
    expect(ogPathFor("/vat/")).toBe("/og/vat.png");
  });

  it("홈", () => {
    expect(ogPathFor("/")).toBe("/og/home.png");
  });

  it("굽지 않는 페이지는 홈 이미지로 떨어진다 — 깨진 이미지를 내보내지 않는다", () => {
    expect(ogPathFor("/privacy/")).toBe("/og/home.png");
    expect(ogPathFor("/link/")).toBe("/og/home.png");
    expect(ogPathFor("/cards/pension-2026/1/")).toBe("/og/home.png");
  });
});
