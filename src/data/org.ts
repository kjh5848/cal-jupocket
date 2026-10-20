/**
 * 사이트를 운영하는 주체 — 구조화 데이터(Organization)가 같은 @id 를 가리키게 한 곳에 둔다.
 * 홈은 전체 Organization 을, 글·소개 페이지는 @id 로 그것을 가리킨다. 이름이 여러 군데
 * 따로 적혀 있으면 검색엔진·AI 가 같은 운영자로 묶지 못한다.
 */
import { liveSocials } from "./social";

export const ORG_ID = (siteUrl: string) => `${siteUrl}/#org`;

export function organization(siteUrl: string) {
  return {
    "@type": "Organization",
    "@id": ORG_ID(siteUrl),
    name: "주포켓",
    alternateName: "jupocket",
    url: `${siteUrl}/`,
    logo: `${siteUrl}/icon-512.png`,
    /** 숫자를 어떻게 확인하는지 — /about/ */
    publishingPrinciples: `${siteUrl}/about/`,
    sameAs: liveSocials.map((s) => s.url),
  };
}
