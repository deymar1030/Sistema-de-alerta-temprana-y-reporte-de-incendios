// CO2 no es CO; GAS_LEL no es humo. Son variables independientes.
export const TIPOS_SENSOR = ['TEMPERATURA', 'HUMEDAD', 'CO2', 'GAS_LEL', 'HUMO', 'CO'];
export const normalizarVariable = (valor) => String(valor).trim().toUpperCase();
