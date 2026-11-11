// Categorias de institucion habilitadas para certificar que un incendio
// quedo controlado (informe_atencion COMPLETADO -> cierra la alerta).
// Policia, Defensa Civil y otras pueden recibir/atender la notificacion,
// pero solo Bomberos extingue el fuego y puede certificar su control.
export const CATEGORIAS_CIERRE_INCENDIO = Object.freeze(["BOMBEROS"]);
