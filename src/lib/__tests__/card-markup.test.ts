import { describe, it, expect } from "vitest";
import { parseMarkup } from "../card-markup";

describe("parseMarkup", () => {
  it("강조가 없으면 통째로 한 토큰", () => {
    expect(parseMarkup("하한 41만원")).toEqual([
      { text: "하한 41만원", emphasis: "none" },
    ]);
  });

  it("형광펜을 잡아낸다", () => {
    expect(parseMarkup("보험료율 [[9% → 9.5%]]")).toEqual([
      { text: "보험료율 ", emphasis: "none" },
      { text: "9% → 9.5%", emphasis: "mark" },
    ]);
  });

  it("경고를 잡아낸다", () => {
    expect(parseMarkup("지역가입자 {{전액 본인 부담}}")).toEqual([
      { text: "지역가입자 ", emphasis: "none" },
      { text: "전액 본인 부담", emphasis: "warn" },
    ]);
  });

  it("둘을 섞어 쓸 수 있다", () => {
    expect(parseMarkup("[[659만원]] 넘으면 {{안 늘어남}}")).toEqual([
      { text: "659만원", emphasis: "mark" },
      { text: " 넘으면 ", emphasis: "none" },
      { text: "안 늘어남", emphasis: "warn" },
    ]);
  });

  it("뒤에 남은 평문을 잃지 않는다", () => {
    expect(parseMarkup("상한 [[659만원]]으로 인상")).toEqual([
      { text: "상한 ", emphasis: "none" },
      { text: "659만원", emphasis: "mark" },
      { text: "으로 인상", emphasis: "none" },
    ]);
  });

  it("한 줄에 형광펜이 여러 번 나와도 된다", () => {
    expect(parseMarkup("[[가]]와 [[나]]")).toHaveLength(3);
  });

  it("닫히지 않은 표시는 평문으로 둔다", () => {
    expect(parseMarkup("상한 [[659만원")).toEqual([
      { text: "상한 [[659만원", emphasis: "none" },
    ]);
  });

  it("빈 문자열", () => {
    expect(parseMarkup("")).toEqual([]);
  });
});
