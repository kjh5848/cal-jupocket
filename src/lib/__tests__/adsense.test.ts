/**
 * ads.txt 가 틀리면 광고가 조용히 멈춘다.
 *
 * 없으면 "승인되지 않은 판매자"로 분류되고, 퍼블리셔 ID가 태그와 다르면
 * 있으나 마나다. 눈으로는 확인하기 어려운 한 줄이라 여기서 지킨다.
 */
import { describe, it, expect } from "vitest";
import { PUBLISHER_ID, SELLER_ID, GOOGLE_TAG_ID, adsTxt } from "../../data/adsense";

describe("ads.txt", () => {
  it("태그의 퍼블리셔 ID와 같은 계정을 가리킨다", () => {
    expect(PUBLISHER_ID).toMatch(/^ca-pub-\d{16}$/);
    expect(SELLER_ID).toBe(PUBLISHER_ID.replace("ca-", ""));
    expect(adsTxt()).toContain(SELLER_ID);
  });

  it("ads.txt 표기에는 ca- 접두가 붙지 않는다", () => {
    const line = adsTxt().split("\n").find((l) => l.startsWith("google.com"))!;
    expect(line).not.toContain("ca-pub");
    expect(line).toContain("pub-");
  });

  it("IAB 형식 한 줄 — 필드 네 개, DIRECT, 구글 인증기관 ID", () => {
    const line = adsTxt().split("\n").find((l) => l.startsWith("google.com"))!;
    const fields = line.split(",").map((f) => f.trim());
    expect(fields).toHaveLength(4);
    expect(fields[0]).toBe("google.com");
    expect(fields[1]).toBe(SELLER_ID);
    expect(fields[2]).toBe("DIRECT");
    expect(fields[3]).toBe(GOOGLE_TAG_ID);
  });

  it("주석은 # 로 시작하고 마지막은 줄바꿈으로 끝난다", () => {
    for (const l of adsTxt().split("\n")) {
      if (l === "" || l.startsWith("#")) continue;
      expect(l).toMatch(/^google\.com,/);
    }
    expect(adsTxt().endsWith("\n")).toBe(true);
  });
});
