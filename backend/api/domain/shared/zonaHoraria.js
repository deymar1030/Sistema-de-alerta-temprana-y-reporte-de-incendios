// Zona horaria oficial del sistema. Bolivia no tiene horario de verano: UTC-4 fijo.
// La BD guarda instantes en UTC; esto solo decide como se muestran fecha/hora.
export const ZONA_HORARIA = "America/La_Paz";

const formatoFecha = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA, year: "numeric", month: "2-digit", day: "2-digit" });
const formatoHora = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA_HORARIA, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

// Instante -> { fecha: 'YYYY-MM-DD', hora: 'HH:MM:SS' } en hora de Bolivia.
export function fechaHoraBolivia(instante) {
  if (!(instante instanceof Date) || Number.isNaN(+instante)) return { fecha: null, hora: null };
  return { fecha: formatoFecha.format(instante), hora: formatoHora.format(instante) };
}
