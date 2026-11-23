import { RolNombres } from "../rol/rolNombres.js";

// Estados que ya pasaron la validacion del motor (o los creo una institucion).
export const ESTADOS_VALIDADOS = ["CONFIRMADA", "ATENDIDA", "CERRADA"];

// Que alertas puede consultar cada rol:
// - ADMIN y AUDITOR: todas (el admin valida las que estan EN_EVALUACION).
// - JEFE_INSTITUCION / OPERATIVO: solo las enviadas a SU institucion, lo que
//   ocurre recien con el pico critico o la confirmacion (ver distribuirAlerta).
// - Resto (CIUDADANO): solo alertas validadas.
export function alcanceAlertas(usuario) {
  const rol = usuario?.rol?.nombre_rol;
  if (rol === RolNombres.ADMIN || rol === RolNombres.AUDITOR) return { completo: true };
  if (rol === RolNombres.JEFE_INSTITUCION || rol === RolNombres.OPERATIVO) {
    // Sin institucion asignada no hay envios que ver: -1 no coincide con ninguna.
    return { id_institucion: usuario.id_institucion != null ? String(usuario.id_institucion) : "-1" };
  }
  return { estados: ESTADOS_VALIDADOS };
}
