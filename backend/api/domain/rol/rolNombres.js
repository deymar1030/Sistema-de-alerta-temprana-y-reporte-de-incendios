// nombre_rol no tiene CHECK en bd.sql (es texto libre creado a mano via
// crear-usuario.js), asi que estos son los valores que el equipo acordo
// usar. Si la fila real en la tabla `rol` no coincide exactamente con
// estos strings, requireRole() rechaza con 403 a quien deberia pasar.
export const RolNombres = Object.freeze({
  JEFE_INSTITUCION: "JEFE_INSTITUCION",
  OPERATIVO: "OPERATIVO",
  CIUDADANO: "CIUDADANO",
});
