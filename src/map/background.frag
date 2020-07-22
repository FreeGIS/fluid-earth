precision mediump float;

#pragma glslify: equirectangular = require(./projections/equirectangular.glsl)
#pragma glslify: mercator = require(./projections/mercator.glsl)
#pragma glslify: equalEarth = require(./projections/equalEarth.glsl)
#pragma glslify: orthographic = require(./projections/orthographic.glsl)

uniform vec2 u_canvasResolution;
uniform float u_canvasRatio;
uniform float u_lon0;
uniform float u_lat0;
uniform float u_zoom;

uniform sampler2D u_texture;

const float PI = radians(180.0);
const float PI_2 = radians(90.0);

void main() {
  // "display" coordinates are my convention here, where they correspond to
  // points on a graph with (0,0) in the center of the canvas, which is pi units
  // high when zoom = 1 and has width units proportional to height units (unlike
  // clip coordinates)
  vec2 position = 2.0 * gl_FragCoord.xy / u_canvasResolution - 1.0;
  vec2 displayCoord = vec2(u_canvasRatio * PI_2, PI_2) * position;
  displayCoord = displayCoord / u_zoom;

  // longitude and latitude, respectively, in degrees, where positive latitudes
  // correspond to the northern hemisphere, and positive longitudes are east of
  // the prime meridian -- these should be the outputs of the inverse map
  // projection equation for whichever projection we're currently using
  vec2 lonLat;
  orthographic(displayCoord, radians(vec2(u_lon0, u_lat0)), lonLat);

  // prevent textureCoord from overflowing by keeping longitude in [-PI, PI]
  // and latitude in [-PI_2, PI_2]
  lonLat.x = mod(lonLat.x + PI, 2.0 * PI) - PI;
  lonLat.y = mod(lonLat.y + PI_2, PI) - PI_2;

  // also image needs to flipped vertically for some reason
  lonLat = lonLat * vec2(1, -1);

  // convert to texture coordinates on a image of a plate carrée map projection,
  // where (0,0) is the bottom left corner and (1,1) is the top right corner
  // (despite the image having an aspect ratio of 2:1, because that's just how
  // textures work in WebGL)
  vec2 textureCoord = (lonLat + vec2(PI, PI_2)) / vec2(2.0 * PI, PI);

  if (textureCoord.x <= 1.0 &&
      textureCoord.x >= 0.0 &&
      textureCoord.y <= 1.0 &&
      textureCoord.y >= 0.0) {
    gl_FragColor = texture2D(u_texture, textureCoord);
  } else {
    gl_FragColor = vec4(0, 0, 0, 0); // transparent
  }
}
