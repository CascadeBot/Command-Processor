class Color {
  rgb = 0;

  r() {

  }

  g() {

  }

  b() {

  }

  hex() {

  }

  /*constructor(rgb) {
    this.rgb = rgb;
  }*/

  constructor(rRgbHex, g, b) {
    if (typeof rRgbHex == "string") {
      // TODO convert from hex to rgb
      return;
    }
    if (typeof rRgbHex == "number" && typeof g == "number" && typeof b == "number") {
      // TODO combine r g b values into combined rgb number
      return;
    }
    // Assume rRgbHex is the combined rgb number TODO bad assumption?
    this.rgb = rRgbHex;
  }

  /*constructor(hex) {
  }*/
}

return {
  Color
}
