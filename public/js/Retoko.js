
class Retoko {

  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.cache = null;
    this.filters = {};
    this.filtersDeffaults = {
      black: 0,
      white: 255,
      brightness: 0,
      shadows: 0,
      medium: 0,
      lights: 0,
      hue: 0,
      saturation: 1,
      lightness: 1,
      temperature: 6600
    }
  }

  setCache(c = null) {
    let canvas = this.c;
    if (c !== null) canvas = c;
    let ctx = canvas.getContext('2d');
    let iData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.cache = new ImageData(new Uint8ClampedArray(iData.data), iData.width);
  }

  processImage() {
    let imageData = new ImageData(new Uint8ClampedArray(this.cache.data), this.cache.width);
    let data = imageData.data;
    for (let i = 0; i < data.length; i +=  4) {
      let rgb = [data[i], data[i + 1], data[i + 2]];

      if (this.filters.black !== undefined || this.filters.white !== undefined) rgb = this.contrast(rgb);
      if (this.filters.brightness  !== undefined) rgb = this.brightness(rgb);
      if (this.filters.medium      !== undefined) rgb = this.levels(rgb, 128, 64, this.filters.medium);
      if (this.filters.shadows     !== undefined) rgb = this.levels(rgb,  64, 64, this.filters.shadows);
      if (this.filters.lights      !== undefined) rgb = this.levels(rgb, 192, 64, this.filters.lights);
      if (this.filters.temperature !== undefined) rgb = this.temperature(rgb);

      if (this.filters.hue !== undefined || this.filters.saturation !== undefined) {
        let hsl = this.RGBtoHSL(rgb);
        hsl = this.hsl(hsl);
        rgb = this.HSLtoRGB(hsl);
      }

      data[i]     = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
    return imageData;
  }
  
  render() {
    let imageData = this.processImage();
    this.ctx.putImageData(imageData, 0, 0);
  }

  renderHistogram() {
    let imageData = this.processImage();
    let data = imageData.data;
    let map = [];
    for (let i = 0; i < 256; i++) map[i] = 0;

    for (let i = 0; i < data.length; i +=  4) {
      let rgb = [data[i], data[i + 1], data[i + 2]];
      map[rgb[0]]++;
      map[rgb[1]]++;
      map[rgb[2]]++;
    }

    let map2 = map.slice(1, map.length - 1);
    let max = Math.max(...map2);

    let outputCanvas = document.createElement('canvas');
    outputCanvas.width = 256;
    outputCanvas.height = 128;
    let outputCtx = outputCanvas.getContext('2d');

    outputCtx.fillStyle = '#888888';
    for (let i = 0; i < 256; i++) {
      let res = 128 - ((map[i] * 128) / max);
      outputCtx.fillRect(i, res, 1, 128 - res);
    }

    outputCtx.fillStyle = '#444444';
    outputCtx.fillRect(63, 0, 1, 128);
    outputCtx.fillRect(127, 0, 1, 128);
    outputCtx.fillRect(191, 0, 1, 128);

    this.ctx.clearRect(0, 0, this.c.width, this.c.height);
    this.ctx.drawImage(outputCanvas, 0, 0, this.c.width, this.c.height);
  }

  reset() {
    this.ctx.putImageData(this.cache, 0, 0);
  }

  setFilter(name, value) {
    value = Number(value);
    if (value !== this.filtersDeffaults[name]) this.filters[name] = value;
    else delete(this.filters[name]);
  }
  
  contrast(rgb) {
    let black = this.filtersDeffaults.black;
    let white = this.filtersDeffaults.white;
    if (this.filters.black !== undefined) black = this.filters.black;
    if (this.filters.white !== undefined) white = this.filters.white;
    rgb[0] = (255 * rgb[0] - 255 * black) / (white - black);
    rgb[0] = Math.max(0, rgb[0]);
    rgb[0] = Math.min(255, rgb[0]);
    rgb[1] = (255 * rgb[1] - 255 * black) / (white - black);
    rgb[1] = Math.max(0, rgb[1]);
    rgb[1] = Math.min(255, rgb[1]);
    rgb[2] = (255 * rgb[2] - 255 * black) / (white - black);
    rgb[2] = Math.max(0, rgb[2]);
    rgb[2] = Math.min(255, rgb[2]);
    return rgb;
  }

  brightness(rgb) {
    rgb[0] += this.filters.brightness;
    rgb[1] += this.filters.brightness;
    rgb[2] += this.filters.brightness;
    return rgb;
  }

  levels(rgb, point, size, value) {
    for (let i = 0; i < 3; i++) {
      if (rgb[i] < (point - size) || rgb[i] > (point + size)) continue;
      else {
        let end;
        if (rgb[i] <= point) end = point - size;
        else                 end = point + size;
        rgb[i] += ((value * end) - (value * rgb[i])) / (end - point);
        // rgb[i] = Math.max(0, rgb[i]);
        // rgb[i] = Math.min(255, rgb[i]);
      }
    }
    return rgb;
  }

  temperature(rgb) {
    let temp = this.filters.temperature / 100;
    let multR, multG, multB;

    if (temp > 66) {
      multR = (329.698727446 * ((temp - 60) ** -0.1332047592)) / 255;
      rgb[0] = Math.floor(rgb[0] * multR);
    }

    if (temp <= 66) {
      multG = (99.4708025861 * Math.log(temp) - 161.1195681661) / 255;
      rgb[1] = Math.floor(rgb[1] * multG);
    } else {
      multG = (288.1221695283 * ((temp - 60) ** -0.0755148492)) / 255;
      rgb[1] = Math.floor(rgb[1] * multG);
    }

    if (temp <= 19) {
      rgb[2] = 0;
    } else {
      multB = (138.5177312231 * Math.log(temp - 10) - 305.0447927307) / 255;
      rgb[2] = Math.floor(rgb[2] * multB);
    }

    rgb[0] = Math.max(0, rgb[0]);
    rgb[0] = Math.min(255, rgb[0]);
    rgb[1] = Math.max(0, rgb[1]);
    rgb[1] = Math.min(255, rgb[1]);
    rgb[2] = Math.max(0, rgb[2]);
    rgb[2] = Math.min(255, rgb[2]);

    return rgb;
  }

  hsl(hsl) {
    let hue        = this.filtersDeffaults.hue;
    let saturation = this.filtersDeffaults.saturation;
    let lightness  = this.filtersDeffaults.lightness;
    if (this.filters.hue        !== undefined) hue        = this.filters.hue;
    if (this.filters.saturation !== undefined) saturation = this.filters.saturation;
    if (this.filters.lightness  !== undefined) lightness  = this.filters.lightness;
    hsl[0] += hue / 360;
    // hsl[0] = Math.max(0, hsl[0]);
    // hsl[0] = Math.min(1, hsl[0]);
    hsl[1] *= saturation;
    hsl[1] = Math.max(0, hsl[1]);
    hsl[1] = Math.min(1, hsl[1]);
    hsl[2] *= lightness;
    hsl[2] = Math.max(0, hsl[2]);
    hsl[2] = Math.min(1, hsl[2]);
    return hsl;
  }

  RGBtoHSL(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max == min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  HSLtoRGB(hsl) {
    let h = hsl[0];
    let s = hsl[1];
    let l = hsl[2];
    let r, g, b;
    if (s == 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [
      Math.min(Math.floor(r * 256), 255),
      Math.min(Math.floor(g * 256), 255),
      Math.min(Math.floor(b * 256), 255)
    ];
  }

}
