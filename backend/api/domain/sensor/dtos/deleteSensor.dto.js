export class DeleteSensorDTO {
  static validate(id) {
    if (!id) {
      throw new Error("El id del sensor es obligatorio para eliminar");
    }
    return id;
  }
}