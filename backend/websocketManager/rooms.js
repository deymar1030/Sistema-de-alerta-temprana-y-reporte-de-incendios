export const rooms = {
  usuario: (id_usuario) => `usuario:${id_usuario}`,
  rol: (nombre_rol) => `rol:${nombre_rol}`,
  institucion: (id_institucion) => `institucion:${id_institucion}`,
  sensor: (id_sensor) => `sensor:${id_sensor}`,
  predio: (id_predio) => `predio:${id_predio}`,
  chatGlobal: () => `chat:global`,
  chatCategoria: (categoria) => `chat:categoria:${categoria}`,
};
