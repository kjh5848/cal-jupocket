# cal-jupocket

한국형 계산기 사이트. **SERP 틈 니치** 전략으로 만든다 — 네이버·토스·홈택스가
점령한 head 계산기(퇴직금·연봉실수령·부가세 등)를 피하고, 경쟁이 약한 구체
니치(예: 프리랜서 3.3% / 종합소득세 환급)를 깊이로 공략한다.

- 배포 예정: `cal.jupocket.com` (jupocket.com 서브도메인, 단 레포·배포는 독립)
- 스택(예정): Astro + Cloudflare Workers Static Assets + 클라이언트 JS 계산기
  — adsens-static 과 같은 정적 구조 재활용
- 수익: Google AdSense (오도성 광고 없이 정책 준수. 서브도메인 이슈가 루트
  신뢰도에 영향 줄 수 있으므로 깨끗하게 유지)

## 현재 상태: 기획(브레인스토밍) 단계 — 아직 스캐폴딩 전

순서: 키워드 검증 → 설계 문서(docs/) → 승인 → 구현 계획 → Astro 스캐폴딩.

- `docs/keyword-research.md` — 네이버 데이터랩 + SERP 조사 (v1)
- `keywords/` — 네이버 검색광고 키워드도구 CSV 를 여기 넣는다(절대 검색량 교차검증)
- `.env.example` — 네이버 검색광고 API 토큰 자리 (실값은 `.env`, 커밋 금지)
