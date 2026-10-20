# 프랑스 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `fr` (작업 폴더 `../cal-wt/fr`, rates `src/rates/fr/`, lib `src/lib/fr/`, 테스트 `src/lib/__tests__/fr-*.test.ts`) |
| 판 | `fr` — 주소 `/fr/`, 도구 목록 `src/data/fr/tools.ts` |
| 페이지 언어 | Français — `<html lang="fr-FR">` |
| 조사표 칸 | 프랑스 |
| 자동완성 | `--hl fr --gl fr` |
| 허용 출처 | impots.gouv.fr · service-public.gouv.fr(service-public.fr) · legifrance.gouv.fr · urssaf.fr · economie.gouv.fr |
| 주의 | 소득세는 가구 단위(quotient familial) — 계산이 개인 단위인 한국 도구와 짝이 되기 어렵다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 프랑스판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 보류(공유 파일 충돌 — 다음 회차 재시도) | — | `/fr/tools/percent/`·`/fr/` 홈·`src/data/fr/tools.ts` 를 만들고 빌드·vitest 0 까지 갔으나, push 직전 rebase 에서 공유 스크립트 `src/scripts/percent.ts` 가 대만 회차(21acd6d, ZH_HANT 사전)와 충돌 → 규칙대로 abort. 작업은 로컬 브랜치 **`wip/fr-percent`**(커밋 a3bef14 공유 스크립트 + 67fdd2d 페이지)에 남김 — 다음 회차는 새 main 에서 이 두 커밋을 cherry-pick 하고 `pickLang({ ko, ja, en, "zh-Hant": …, fr: FR })` 로 사전 줄만 합치면 됨. 내용: FR 사전 + 프랑스어판만 숫자 읽기·쓰기를 `src/lib/fr/number.ts`(쉼표·점 둘 다 소수점, 공백·% 지움, 소수점 둘이면 NaN / 표기 Intl fr-FR) + `fr-number.test.ts` 로(한국 `parseNumber` 는 "12,5" 를 125 로 읽음). 자동완성 `keywords/fr-percent-2026-10-20.csv`(hl fr, gl fr) — pourcentage d'un nombre formule·par rapport à un autre·au total / pourcentage d'évolution formule·entre deux valeurs·années / coefficient multiplicateur·réciproque·successive / remise·réduction·solde·inversé / augmentation prix·salaire / excel. TVA·brut/net 숫자 안 씀, 금액은 'euros'. 참고: calc-ui 틀의 `num()` 은 천 단위 쉼표 전제 — 프리셋·소계를 쓰는 프랑스판 도구가 오면 기초 필요 |
