export const META_PARAMETROS = {
  origen: "PDF DM-OPE-01727092026, Tablas 2-4",
  estado: "referencia, no calibrada",
};

export const CONSTANTES_FORMULA = {
  zrobUmbral: 3.5,
  cusumVentanaLecturas: 20,
  cusumK: 0.5,
};

const CONFIGURACIONES = {
  vivienda: {
    tipo: "vivienda",
    descripcion: "Interior estable; umbrales de referencia",
    ventanaBaseMin: 30,
    umbralZ: 3,
    cusumH: 5,
    umbralConfirmacion: 0.6,
    umbralDescarte: 0.45,
    tiempoMaxEvaluacionMin: 10,
    radioVecindadM: 1000,
    variables: {
      humo: { unidad: "µg/m³", umbralCritico: 500, peso: 0.3, bmax: 100, madMin: 1 },
      co: { unidad: "ppm", umbralCritico: 200, peso: 0.25, bmax: 50, madMin: 1 },
      temperatura: { unidad: "°C", umbralCritico: 70, peso: 0.25, bmax: 10, madMin: 0.1 },
      humedad: { unidad: "%", umbralCritico: null, peso: 0.2, bmax: 10, madMin: 0.5 },
    },
  },
  edificio: {
    tipo: "edificio",
    descripcion: "Interior con varios ambientes; umbrales de referencia",
    ventanaBaseMin: 30,
    umbralZ: 3,
    cusumH: 5,
    umbralConfirmacion: 0.6,
    umbralDescarte: 0.45,
    tiempoMaxEvaluacionMin: 10,
    radioVecindadM: 500,
    variables: {
      humo: { unidad: "µg/m³", umbralCritico: 500, peso: 0.3, bmax: 100, madMin: 1 },
      co: { unidad: "ppm", umbralCritico: 200, peso: 0.25, bmax: 50, madMin: 1 },
      temperatura: { unidad: "°C", umbralCritico: 70, peso: 0.25, bmax: 10, madMin: 0.1 },
      humedad: { unidad: "%", umbralCritico: null, peso: 0.2, bmax: 10, madMin: 0.5 },
    },
  },
  mercado: {
    tipo: "mercado",
    descripcion: "Espacio abierto; mayor variabilidad por sol y viento",
    ventanaBaseMin: 60,
    umbralZ: 3.5,
    cusumH: 6,
    umbralConfirmacion: 0.55,
    umbralDescarte: 0.4,
    tiempoMaxEvaluacionMin: 15,
    radioVecindadM: 500,
    variables: {
      humo: { unidad: "µg/m³", umbralCritico: 300, peso: 0.35, bmax: 100, madMin: 1 },
      co: { unidad: "ppm", umbralCritico: 100, peso: 0.2, bmax: 50, madMin: 1 },
      temperatura: { unidad: "°C", umbralCritico: 80, peso: 0.25, bmax: 10, madMin: 0.1 },
      humedad: { unidad: "%", umbralCritico: null, peso: 0.2, bmax: 10, madMin: 0.5 },
    },
  },
};

function normalizarTipo(tipoPredio) {
  return String(tipoPredio ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function obtenerConfiguracionMotor(tipoPredio) {
  const config = CONFIGURACIONES[normalizarTipo(tipoPredio)];

  if (!config) {
    throw new Error(
      `tipo de predio no soportado: '${tipoPredio}'. Tipos válidos: ${Object.keys(CONFIGURACIONES).join(", ")}`,
    );
  }

  return config;
}
