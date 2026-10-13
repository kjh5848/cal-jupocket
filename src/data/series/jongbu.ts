/**
 * 종부세 시리즈 — 2026-10-13. 12월 1~15일 납부철 대비.
 * 자동완성 '종부세'(17, 네이버 10 + 구글 15 중복 제외)를 허브(기존 43번 글) + 7편으로 묶었다.
 * 네이버 30일 검색량(2026-10-13): 종부세 9,170 · 종합부동산세 8,000 · 기준 6,870 · 계산기 5,530.
 *   뜻·종부세란·보유세 차이 → 허브(기존 /guide/comprehensive-property-tax/ 를 같은 주소로 고쳐 씀)
 *   기준·대상·대상자 → 기준
 *   계산·계산기·과세표준 → 계산기
 *   세율·종부세율 → 세율
 *   납부기간·납부시기 → 납부기간
 *   공동명의 → 공동명의
 *   다주택자 종부세·1가구2주택종부세 → 다주택자
 *   개편·개편안 → 개편(2026-09-30 시행령 개정만 확정, 개편안 숫자는 쓰지 않는다)
 * 근거: 종합부동산세법 제7조~제10조의2·제12조~제16조·제20조, 시행령, 농어촌특별세법 제5조.
 */
import type { Series } from "./types";

export const jongbuSeries: Series = {
  id: "jongbu",
  cluster: "localtax",
  hub: { slug: "comprehensive-property-tax", keyword: "종부세", label: "종부세" },
  items: [
    { slug: "jongbu-criteria", keyword: "종부세 기준", label: "종부세 기준·대상" },
    { slug: "jongbu-calculator", keyword: "종부세 계산기", label: "종부세 계산기" },
    { slug: "jongbu-rate", keyword: "종부세 세율", label: "종부세 세율" },
    { slug: "jongbu-payment", keyword: "종부세 납부기간", label: "종부세 납부기간" },
    { slug: "jongbu-joint", keyword: "종부세 공동명의", label: "종부세 공동명의" },
    { slug: "jongbu-multi-home", keyword: "다주택자 종부세", label: "다주택자 종부세" },
    { slug: "jongbu-reform", keyword: "종부세 개편", label: "종부세 개편" },
  ],
};
