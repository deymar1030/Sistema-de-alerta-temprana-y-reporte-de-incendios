export class Validators {
  static isValidId(value) {
    if (typeof value === "number") return Number.isInteger(value) && value > 0;
    if (typeof value === "string") return /^[1-9][0-9]*$/.test(value.trim());
    return false;
  }
}
