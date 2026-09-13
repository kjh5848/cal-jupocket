/**
 * 애드센스 계정 값 한 곳.
 *
 * 로더 스크립트(AdSenseHead)·광고 단위(AdSlot)·ads.txt 세 군데가 같은
 * 퍼블리셔 ID를 쓴다. 따로 적어두면 계정이 바뀔 때 한 곳이 남고, ads.txt
 * 쪽이 남으면 "승인되지 않은 판매자"로 광고가 통째로 멈춘다.
 *
 * 태그 안에서는 `ca-` 접두가 붙고 ads.txt 에서는 붙지 않는다 — 같은 값의
 * 표기 차이라 여기서 한 번만 변환한다.
 */
export const PUBLISHER_ID = "ca-pub-5677538881877371";

/** ads.txt 에 쓰는 표기(ca- 없음). */
export const SELLER_ID = PUBLISHER_ID.replace(/^ca-/, "");

/**
 * Google 의 인증기관 ID. 계정과 무관한 고정값이라 바꾸지 않는다.
 * https://support.google.com/adsense/answer/12171612
 */
export const GOOGLE_TAG_ID = "f08c47fec0942fa0";

/**
 * ads.txt 본문.
 *
 * DIRECT = 우리가 이 재고를 직접 판다는 뜻이다. 재판매를 끼우지 않으므로
 * 한 줄이면 끝난다.
 */
export function adsTxt(): string {
  return [
    "# https://jupocket.com — Google AdSense",
    "# 값은 src/data/adsense.ts 한 곳에서 만든다.",
    `google.com, ${SELLER_ID}, DIRECT, ${GOOGLE_TAG_ID}`,
    "",
  ].join("\n");
}
