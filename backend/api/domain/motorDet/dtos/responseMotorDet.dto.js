function toNumber(v) {
  return v === null || v === undefined ? null : Number(v);
}

export class ResponseParametroVariableDTO {
  constructor({ id_parametro_variable, tipo_variable, umbral_critico }) {
    this.id_parametro_variable = id_parametro_variable;
    this.tipo_variable = tipo_variable;
    this.umbral_critico = umbral_critico;
  }

  static fromEntity(parametro) {
    return new ResponseParametroVariableDTO({
      id_parametro_variable: parametro.id_parametro_variable,
      tipo_variable: parametro.tipo_variable,
      umbral_critico: toNumber(parametro.umbral_critico),
    });
  }
}

export class ResponseMotorDetDTO {
  constructor({
    id_motordet,
    ventana_base_min,
    umbral_z,
    cusum_h,
    umbral_confirmacion,
    umbral_descarte,
    tiempo_max_evaluacion_min,
    radio_vecindad_m,
    parametro_variable = undefined,
  }) {
    this.id_motordet = id_motordet;
    this.ventana_base_min = ventana_base_min;
    this.umbral_z = umbral_z;
    this.cusum_h = cusum_h;
    this.umbral_confirmacion = umbral_confirmacion;
    this.umbral_descarte = umbral_descarte;
    this.tiempo_max_evaluacion_min = tiempo_max_evaluacion_min;
    this.radio_vecindad_m = radio_vecindad_m;
    if (parametro_variable !== undefined) this.parametro_variable = parametro_variable;
  }

  static fromEntity(motorDet) {
    return new ResponseMotorDetDTO({
      id_motordet: motorDet.id_motordet,
      ventana_base_min: motorDet.ventana_base_min,
      umbral_z: toNumber(motorDet.umbral_z),
      cusum_h: toNumber(motorDet.cusum_h),
      umbral_confirmacion: toNumber(motorDet.umbral_confirmacion),
      umbral_descarte: toNumber(motorDet.umbral_descarte),
      tiempo_max_evaluacion_min: motorDet.tiempo_max_evaluacion_min,
      radio_vecindad_m: motorDet.radio_vecindad_m,
      parametro_variable: motorDet.parametro_variable
        ? motorDet.parametro_variable.map((p) => ResponseParametroVariableDTO.fromEntity(p))
        : undefined,
    });
  }
}
