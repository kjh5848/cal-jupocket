/**
 * 국민연금 수령 시점(조기/정상/연기) 선택에 따른 지급률과 손익분기 나이 계산.
 *
 * 지급률은 국민연금공단 고시값(rates/pension-2026.json)을 그대로 쓴다.
 * 손익분기 나이는 "명목 누적 수령액이 역전되는 시점"을 푸는 단순 1차식이며,
 * 물가상승률·연금액 인상·세금은 반영하지 않는다(글에서 이 가정을 명시한다).
 */
import pension from "../rates/pension-2026.json";

/** 조기수령 지급률. yearsEarly는 1~5년. */
export function earlyRate(yearsEarly: number): number {
  const table = pension.earlyPension.ratesByYearsEarly as Record<string, number>;
  const rate = table[String(yearsEarly)];
  if (rate === undefined) {
    throw new Error(`조기수령 지급률이 정의되지 않은 연수: ${yearsEarly}`);
  }
  return rate;
}

/** 연기수령 지급률. yearsDeferred는 1~5년. 1년당 7.2% 가산. */
export function deferredRate(yearsDeferred: number): number {
  const { maxYearsDeferred, increasePerYear } = pension.deferredPension;
  if (yearsDeferred < 1 || yearsDeferred > maxYearsDeferred) {
    throw new Error(`연기 가능 범위를 벗어난 연수: ${yearsDeferred}`);
  }
  // 부동소수점 누적을 막기 위해 소수 넷째 자리에서 정리한다(0.072*5 = 0.36).
  return Math.round((1 + increasePerYear * yearsDeferred) * 10000) / 10000;
}

/**
 * 두 수령 선택의 명목 누적액이 같아지는 나이.
 *
 * 먼저 받기 시작하는 쪽(earlier)은 금액이 적고, 늦게 받는 쪽(later)은 많다.
 * 누적액이 역전되는 나이 x는 다음 식을 풀어 얻는다.
 *   rateEarlier * (x - ageEarlier) = rateLater * (x - ageLater)
 */
export function breakevenAge(
  earlier: { age: number; rate: number },
  later: { age: number; rate: number },
): number {
  const denominator = earlier.rate - later.rate;
  if (denominator === 0) {
    throw new Error("지급률이 같으면 손익분기점이 존재하지 않는다");
  }
  const x =
    (earlier.rate * earlier.age - later.rate * later.age) / denominator;
  return Math.round(x * 10) / 10; // 소수 첫째 자리까지
}

/** 출생연도로 노령연금 지급개시연령과 조기수령 최저연령을 찾는다. */
export function startAgeForBirthYear(birthYear: number): {
  startAge: number;
  earliestAge: number;
} {
  const row = pension.startAgeByBirthYear.find(
    (r) =>
      (r.birthFrom === null || birthYear >= r.birthFrom) &&
      (r.birthTo === null || birthYear <= r.birthTo),
  );
  if (!row) {
    throw new Error(`지급개시연령을 찾을 수 없는 출생연도: ${birthYear}`);
  }
  return { startAge: row.startAge, earliestAge: row.earliestAge };
}
