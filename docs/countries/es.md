# 스페인 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `es` (작업 폴더 `../cal-wt/es`, rates `src/rates/es/`, lib `src/lib/es/`, 테스트 `src/lib/__tests__/es-*.test.ts`) |
| 판 | `es` — 주소 `/es/`, 도구 목록 `src/data/es/tools.ts` |
| 페이지 언어 | Español — `<html lang="es-ES">` |
| 조사표 칸 | 스페인 |
| 자동완성 | `--hl es --gl es` |
| 허용 출처 | agenciatributaria.gob.es(sede.agenciatributaria.gob.es) · boe.es · seg-social.es · hacienda.gob.es |
| 주의 | 자치주(comunidades autónomas)마다 세율이 다른 세금은 국가 몫만 계산하거나 자치주를 고르게 한다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·싱가포르 회차와 같은 이유). 독립 스페인판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 보류(공유 파일 충돌 — 다음 회차 재시도) | — | `/es/tools/percent/`·`/es/` 홈·`src/data/es/tools.ts`·`src/lib/es/number.ts`(+`es-number.test.ts`)·`src/scripts/percent.ts`(ES 사전 + 사전별 parse·fmt) 를 만들어 빌드·테스트(156 파일) 통과했지만, push 직전 main 에 대만판 번체 사전(21acd6d)이 같은 `percent.ts` 에 들어와 rebase 충돌 → abort. 작업은 이 작업 폴더의 로컬 브랜치 `wip/es-percent`(e049fbe 공유 스크립트 · e73b28c 페이지)에 남김 — 다음 회차는 새 main 에서 `percent.ts` 만 다시 고치고 나머지 파일은 그 브랜치에서 가져온다. 숫자 표기 근거: RD 2032/2009 Anexo cap. III 2.8(쉼표 소수점 우선, 점도 허용)·2.9(세 자리 공백, 점·쉼표로 나누지 않음, 네 자리면 공백 없음) https://www.boe.es/buscar/act.php?id=BOE-A-2010-927 (확인 2026-10-20) — 조사표 54행 '소수점 표기 원문 미확인'은 스페인에 대해선 이 원문으로 풀림(조사표는 안 고침). 기존 `parseNumber` 는 쉼표를 지워 `12,5` 를 125 로 읽으므로 ES 사전만 쓰는 파서가 꼭 필요. 자동완성 `keywords/es-percent-2026-10-20.csv`(hl es·gl es, 79개)는 브랜치에 있음 |
