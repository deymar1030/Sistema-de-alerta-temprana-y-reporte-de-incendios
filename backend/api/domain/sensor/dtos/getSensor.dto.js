export class GetSensorDTO {
  static validate(id) {
    if (!id) {
      throw new Error("El id del sensor es obligatorio");
    }
    return id;
  }
}