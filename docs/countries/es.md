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
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /es/tools/percent/ · /es/ 홈 | 지난 회차 보류(공유 파일 충돌)를 이어받아 `wip/es-percent` 에서 페이지 커밋을 cherry-pick, `src/scripts/percent.ts` 는 main 잠금을 먼저 잡고 새 main 의 `NUM` 사전 구조 위에 ES 사전·`es: { parse: parseNumberEs, fmt: formatNumberEs }` 만 더해 다시 고침(따로 커밋, `--shared`). 스페인판 첫 도구 — `src/pages/es/index.astro`(LocaleHome)·`src/data/es/tools.ts`(ko 짝 /tools/percent/). 숫자 표기 `src/lib/es/number.ts`(쉼표 소수점·다섯 자리 이상 공백 천 단위, 1.500·12.5 입력도 읽음, 테스트 `es-number.test.ts`). 근거 RD 2032/2009 Anexo cap. III 2.8·2.9 https://www.boe.es/buscar/act.php?id=BOE-A-2010-927 (확인 2026-10-20) — 조사표 54행 '소수점 표기 원문 미확인'은 스페인에 대해선 이 원문으로 풀림(조사표는 안 고침). 소제목은 자동완성 `keywords/es-percent-2026-10-20.csv`(hl es·gl es, 79개): porcentaje de un número fórmula / regla de 3 / aumento o disminución / descuento / ganancia de un producto / notas / Excel. 제도 숫자 안 씀, 통화 기호 위치는 원문 미확인이라 'euros' 말만 씀 |
| 2026-10-21 | 날짜 계산(#76·#75) | 단위 | 발행 | /es/tools/date-diff/ | 한국어판 lib(date-calc)·`src/scripts/date-diff.ts` 공유, 스크립트에 ES 사전만 더함(main 잠금, `--shared`). 표기 `src/lib/es/date-format.ts`('martes, 20 de octubre de 2026'·mes/meses 복수·숫자는 es/number, 테스트 `es-date-format.test.ts`). 업무일(공휴일 빼기)·시간 환산은 안 넣음 — 결과는 'De lunes a viernes'로만 부르고 'días hábiles'라 하지 않음. 근거 Ley 39/2015 art. 30(30.2 hábiles = 토·일·festivos 제외, 30.4 개월 기간은 같은 날·없으면 말일 = 계산기와 같음, 30.5·30.7 은 계산 안 함) https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565 (확인 2026-10-21). 소제목은 자동완성 `keywords/es-date-diff-2026-10-21.csv`(hl es·gl es, 62개 — 중남미·SQL 말 버림): días entre dos fechas online·días corridos / sumar·restar días / años meses y días·por semanas / días hábiles españa / Excel(SIFECHA·FECHA.MES·DIAS.LAB) |
