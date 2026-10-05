// Nombres de las rooms de Socket.IO, en un solo lugar para no repetir el
// formato en connectionManager.js y notifier.js (docs/GuiaTiempoReal.md §3).
export const rooms = {
  usuario: (id_usuario) => `usuario:${id_usuario}`,
  institucion: (id_institucion) => `institucion:${id_institucion}`,
  sensor: (id_sensor) => `sensor:${id_sensor}`,
  predio: (id_predio) => `predio:${id_predio}`,
};
