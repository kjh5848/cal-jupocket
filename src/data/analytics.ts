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
