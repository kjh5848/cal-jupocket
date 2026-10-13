/**
 * 자동완성 키워드 시리즈 — 키워드 하나에 글 하나.
 * 시리즈마다 허브 글이 있고, snippet-structure.test.ts 가 모든 시리즈의 글을 대조한다.
 */
export interface SeriesItem {
  slug: string;
  /** 자동완성에 뜬 그대로의 메인 키워드(띄어쓰기만 다른 것은 합쳐서 대표 하나) */
  keyword: string;
  /** 링크허브 라벨(30자 이내) */
  label: string;
}

export interface Series {
  id: string;
  /** clusters.ts 의 클러스터 id */
  cluster: string;
  hub: { slug: string; keyword: string; label: string };
  items: SeriesItem[];
  /** 이 시리즈가 받지만 기존에 있던 글(구조만 맞춘 것) */
  existing?: SeriesItem[];
}

export const seriesHref = (slug: string) => `/guide/${slug}/`;
