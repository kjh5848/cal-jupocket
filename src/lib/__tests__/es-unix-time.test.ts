import { describe, it, expect } from "vitest";
import { toParts, INT32_MAX } from "../unix-time";
import { esText, relativeTextEs } from "../es/unix-time";
import { formatNumberEs } from "../es/number";

describe("es unix-time", () => {
  it("esText — fecha en letras y hora de 24 h", () => {
    expect(esText(toParts(1_792_380_896_000, 0))).toBe("lunes, 19 de octubre de 2026, 03:34:56");
    expect(esText(toParts(0, 0))).toBe("jueves, 1 de enero de 1970, 00:00:00");
    expect(esText(toParts(-1, 0))).toBe("miércoles, 31 de diciembre de 1969, 23:59:59,999");
    expect(esText(toParts(INT32_MAX * 1000, 0))).toBe("martes, 19 de enero de 2038, 03:14:07");
    expect(esText(toParts(-(INT32_MAX + 1) * 1000, 0))).toBe("viernes, 13 de diciembre de 1901, 20:45:52");
  });

  it("esText — el desfase horario cambia el día mostrado", () => {
    // 2026-10-19 03:34:56 UTC visto en UTC−05:00 → la noche anterior
    expect(esText(toParts(1_792_380_896_000, -300))).toBe("domingo, 18 de octubre de 2026, 22:34:56");
    expect(esText(toParts(1_792_380_896_789, 120))).toBe("lunes, 19 de octubre de 2026, 05:34:56,789");
  });

  it("relativeTextEs", () => {
    expect(relativeTextEs(0)).toBe("ahora");
    expect(relativeTextEs(999)).toBe("ahora");
    expect(relativeTextEs(-1000)).toBe("hace 1 segundo");
    expect(relativeTextEs(12_000)).toBe("dentro de 12 segundos");
    expect(relativeTextEs(60_000)).toBe("dentro de 1 minuto");
    expect(relativeTextEs(-(3 * 86_400 + 4 * 3600 + 5 * 60 + 6) * 1000)).toBe("hace 3 días, 4 horas y 5 minutos");
    expect(relativeTextEs((86_400 + 30) * 1000)).toBe("dentro de 1 día");
    expect(relativeTextEs(200 * 86_400_000 + 3_600_000 + 60_000)).toBe("dentro de 200 días y 1 hora");
    expect(relativeTextEs(-20_000 * 86_400_000)).toBe(`hace ${formatNumberEs(20_000)} días`);
  });
});
