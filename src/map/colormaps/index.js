import { color } from 'd3-color';
import * as d3 from 'd3-scale-chromatic';

import {
  thermal,
  ice,
} from './cmocean.js';

import {
  temp,
  precip_6h,
  total_cloud_water,
  total_precipitable_water,
  mean_sea_level_pressure,
  so2_mass,
  carbon_monoxide_surface,
  dust_mass,
  total_column_ozone,
  currents,
  sea_surface_temp,
} from './fever.js';

// Enums for colormaps
//
// lut stands for LookUp Table, used to construct a texture

let colormaps = {
  /////////////////////////////////////////////////////////////////////////////
  // Sequential (Multi-Hue)
  /////////////////////////////////////////////////////////////////////////////
  TURBO: {
    name: 'turbo',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateTurbo) }
  },
  VIRIDIS: {
    name: 'viridis',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateViridis) }
  },
  INFERNO: {
    name: 'inferno',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateInferno) }
  },
  MAGMA: {
    name: 'magma',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateMagma) }
  },
  PLASMA: {
    name: 'plasma',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolatePlasma) }
  },
  CIVIDIS: {
    name: 'cividis',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateCividis) }
  },
  WARM: {
    name: 'warm',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateWarm) }
  },
  COOL: {
    name: 'cool',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateCool) }
  },
  CUBEHELIX_DEFAULT: {
    name: 'cubehelix default',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3(d3.interpolateCubehelixDefault) }
  },
  BU_GN: {
    name: 'BuGn',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeBuGn, 9) }
  },
  BU_PU: {
    name: 'BuPu',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeBuPu, 9) }
  },
  GN_BU: {
    name: 'GnBu',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeGnBu, 9) }
  },
  OR_RD: {
    name: 'OrRd',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeOrRd, 9) }
  },
  PU_BU_GN: {
    name: 'PuBuGn',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemePuBuGn, 9) }
  },
  PU_RD: {
    name: 'PuRd',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemePuRd, 9) }
  },
  RD_PU: {
    name: 'RdPu',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeRdPu, 9) }
  },
  YL_GN_BU: {
    name: 'YlGnBu',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeYlGnBu, 9) }
  },
  YL_GN: {
    name: 'YlGn',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeYlGn, 9) }
  },
  YL_OR_BR: {
    name: 'YlOrBr',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeYlOrBr, 9) }
  },
  YL_OR_RD: {
    name: 'YlOrRd',
    type: 'sequential (multi-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeYlOrRd, 9) }
  },
  /////////////////////////////////////////////////////////////////////////////
  // Sequential (Single-Hue)
  /////////////////////////////////////////////////////////////////////////////
  BLUES: {
    name: 'blues',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeBlues, 9) }
  },
  GREENS: {
    name: 'greens',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeGreens, 9) }
  },
  GREYS: {
    name: 'greys',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeGreys, 9) }
  },
  ORANGES: {
    name: 'oranges',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeOranges, 9) }
  },
  PURPLES: {
    name: 'purples',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemePurples, 9) }
  },
  REDS: {
    name: 'reds',
    type: 'sequential (single-hue)',
    get lut() { return lutFromD3Scheme(d3.schemeReds, 9) }
  },
  /////////////////////////////////////////////////////////////////////////////
  // Diverging
  /////////////////////////////////////////////////////////////////////////////
  BR_BG: {
    name: 'BrBG',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeBrBG, 11) }
  },
  PR_GN: {
    name: 'PRGn',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemePRGn, 11) }
  },
  PI_YG: {
    name: 'PiYG',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemePiYG, 11) }
  },
  PU_OR: {
    name: 'PuOr',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemePuOr, 11) }
  },
  RD_BU: {
    name: 'RdBu',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeRdBu, 11) }
  },
  RD_GY: {
    name: 'RdGy',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeRdGy, 11) }
  },
  RD_YL_BU: {
    name: 'RdYlBu',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeRdYlBu, 11) }
  },
  RD_YL_GN: {
    name: 'RdYlGn',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeRdYlGn, 11) }
  },
  SPECTRAL: {
    name: 'Spectral',
    type: 'diverging',
    get lut() { return lutFromD3Scheme(d3.schemeSpectral, 11) }
  },
  /////////////////////////////////////////////////////////////////////////////
  // Cyclical
  /////////////////////////////////////////////////////////////////////////////
  RAINBOW: {
    name: 'rainbow',
    type: 'cyclical',
    get lut() { return lutFromD3(d3.interpolateRainbow) }
  },
  SINEBOW: {
    name: 'sinebow',
    type: 'cyclical',
    get lut() { return lutFromD3(d3.interpolateSinebow) }
  },
  /////////////////////////////////////////////////////////////////////////////
  // cmocean colormaps
  /////////////////////////////////////////////////////////////////////////////
  THERMAL: {
    name: 'thermal',
    type: 'cmocean',
    lut: thermal,
  },
  ICE: {
    name: 'ice',
    type: 'cmocean',
    lut: ice,
  },
  /////////////////////////////////////////////////////////////////////////////
  // FEVer original colormaps
  /////////////////////////////////////////////////////////////////////////////
  TEMP:{
    name: 'temperature',
    type: 'FEVer 1 original',
    get lut() { return convert(temp) }
  },

  SEA_SURFACE_TEMP:{
    name: 'sea_surface_temp',
    type: 'FEVer 1 original',
    get lut() { return convert(sea_surface_temp) }
  },

  PERCIP_6H:{
    name: 'precip_6h',
    type: 'FEVer 1 original',
    get lut() { return convert(precip_6h) }
  },

  TOTAL_CLOUD:{
    name: 'total_cloud_water',
    type: 'FEVer 1 original',
    get lut(){ return convert(total_cloud_water) }
  },

  TOTAL_PRECIP:{
    name: 'total_precipitable_water',
    type: 'FEVer 1 original',
    get lut(){ return convert(total_precipitable_water) }
  },

  MEAN_SEA_LEVEL_PRESSURE:{
    name: 'mean_sea_level_pressure',
    type: 'FEVer 1 original',
    get lut() { return convert(mean_sea_level_pressure) }
  },

  SO2_MASS:{
    name: 'sulfur_dioxide_mass',
    type: 'FEVer 1 original',
    get lut() { return convert(so2_mass) }
  },

  CO_SURFACE:{
    name: 'carbon_monoxide_surface',
    type: 'FEVer 1 original',
    get lut() { return convert(carbon_monoxide_surface) }
  },

  DUST_MASS:{
    name: 'dust_mass',
    type: 'FEVer 1 original',
    get lut() { return convert(dust_mass) }
  },

  COLUMN_OZONE:{
    name:'total_column_ozone',
    type: 'FEVer 1 original',
    get lut() { return convert(total_column_ozone) }
  },

  CURRENTS:{
    name: 'currents',
    type: 'FEVer 1 original',
    get lut() { return convert(currents) }
  },
};

export let types = new Set();

for (let prop in colormaps) {
  let colormap = colormaps[prop];

  types.add(colormap.type);

  // don't add reversed maps for custom colormaps
  if (colormap.type === 'cmocean' ||
      colormap.type === 'FEVer 1 original') {
    continue;
  }

  colormaps[prop + '_REVERSED'] = {
    name: colormap.name + ' (reversed)',
    type: colormap.type,
    get lut() {
      let flippedLut = colormap.lut.slice();
      flippedLut.reverse();
      return flippedLut;
    }
  };
}

export default Object.freeze(colormaps);

function convert(oldArr) {
  return oldArr.map(color => color.map(x => x / 255));
}

function lutFromD3(interpolationFunction) {
  return Array.from({ length: 256 }, (_, i) => {
    let c = color(interpolationFunction(i / 255));
    return [c.r, c.g, c.b].map(x => x / 255);
  });
}

function lutFromD3Scheme(scheme, kmax) {
  return scheme[kmax].map(hex => {
    let c = color(hex);
    return [c.r, c.g, c.b].map(x => x / 255);
  });
}
