/**
 * ads.txt 가 틀리면 광고가 조용히 멈춘다.
 *
 * 없으면 "승인되지 않은 판매자"로 분류되고, 퍼블리셔 ID가 태그와 다르면
 * 있으나 마나다. 눈으로는 확인하기 어려운 한 줄이라 여기서 지킨다.
 */
import { describe, it, expect } from "vitest";
import { GA4_MEASUREMENT_ID, GA4_ENABLED, isValidGa4Id } from "../../data/analytics";
import { PUBLISHER_ID, SELLER_ID, GOOGLE_TAG_ID, adsTxt } from "../../data/adsense";
import { slotFor, AD_SLOTS } from "../../data/adsense";

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

/**
 * GA4 는 로더가 조용히 안 붙어도 눈에 띄지 않는다 — 한 달 뒤에야
 * "데이터가 왜 없지" 하고 알게 된다. 형식과 배선을 여기서 지킨다.
 */
describe("GA4", () => {
  it("측정 ID 형식이 맞다", () => {
    expect(isValidGa4Id(GA4_MEASUREMENT_ID)).toBe(true);
    expect(GA4_ENABLED).toBe(true);
  });

  it("틀린 ID 는 걸러진다 — 오타로 조용히 수집이 멈추는 걸 막는다", () => {
    for (const bad of ["", "G-", "UA-12345-1", "GTM-5S7QR9JF", "G-abc12345", "FELZX20X9E"]) {
      expect(isValidGa4Id(bad), bad).toBe(false);
    }
  });
});

describe("광고 단위 고르기", () => {
  it("-mid 는 본문 중간 단위", () => {
    expect(slotFor("guide-family-deduction-mid")).toBe(AD_SLOTS.mid);
    expect(slotFor("late-filing-mid")).toBe(AD_SLOTS.mid);
  });

  it("-bottom 과 -result 는 끝 단위", () => {
    expect(slotFor("guide-family-deduction-bottom")).toBe(AD_SLOTS.bottom);
    expect(slotFor("penalty-result")).toBe(AD_SLOTS.bottom);
    expect(slotFor("home-bottom")).toBe(AD_SLOTS.bottom);
  });

  it("라벨이 없으면 광고 요청을 보내지 않는다", () => {
    expect(slotFor(undefined)).toBeNull();
    expect(slotFor("")).toBeNull();
  });

  it("두 단위는 서로 다른 ID다", () => {
    expect(AD_SLOTS.mid).not.toBe(AD_SLOTS.bottom);
    for (const id of Object.values(AD_SLOTS)) {
      expect(id).toMatch(/^\d{10}$/);
    }
  });
});
