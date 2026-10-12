/**
 * 측정 도구 설정.
 *
 * 측정 ID는 페이지 소스에 그대로 나가는 공개값이라 .env 로 숨길 이유가 없다.
 * 숨기면 오히려 빌드마다 환경변수가 필요해져서 배포가 까다로워진다.
 *
 * 비어 있으면 로더가 아예 렌더되지 않는다 — 속성을 만들기 전에 배선만
 * 해두고, ID가 나오면 여기 한 줄만 채우면 켜진다. 개인정보처리방침의
 * 애널리틱스 문단도 이 값이 있을 때만 나온다(없는 수집을 적어두면 거짓말이
 * 된다).
 */

/**
 * GA4 측정 ID.
 * 계정 "주포켓" > 속성 "jupocket - G4" > 스트림 https://jupocket.com
 */
export const GA4_MEASUREMENT_ID = "G-FELZX20X9E";

/** 형식이 맞는지 — 오타로 조용히 수집이 안 되는 일을 막는다. */
export function isValidGa4Id(id: string): boolean {
  return /^G-[A-Z0-9]{8,12}$/.test(id);
}

export const GA4_ENABLED = isValidGa4Id(GA4_MEASUREMENT_ID);

/**
 * 네이버 애널리틱스 사이트 ID(발급ID).
 * 네이버 애널리틱스 > 사이트정보 > 주포켓 https://jupocket.com/
 *
 * 네이버 서치어드바이저를 열면서 같이 붙였다(2026-10-12). 한국 검색 유입의
 * 절반쯤이 네이버로 들어오는데 GA4 의 네이버 유입은 리퍼러가 잘려 잘 안
 * 잡힌다. 검색어까지 보려면 네이버 쪽 계측이 필요하다.
 */
export const NAVER_ANALYTICS_ID = "1c79a617dc25ff0";

/** 네이버 발급ID 는 소문자 16진수 15자리 안팎이다. */
export function isValidNaverId(id: string): boolean {
  return /^[0-9a-f]{12,20}$/.test(id);
}

export const NAVER_ENABLED = isValidNaverId(NAVER_ANALYTICS_ID);
