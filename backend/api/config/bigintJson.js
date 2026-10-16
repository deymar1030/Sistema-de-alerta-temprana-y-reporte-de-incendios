// Permite serializar valores BigInt en respuestas JSON (JSON.stringify no los
// soporta de forma nativa). Se ejecuta por su efecto secundario al importarse.
if (typeof BigInt.prototype.toJSON !== "function") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}
