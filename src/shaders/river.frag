varying vec3 vNormal;
varying float vDecay;
varying vec2 vVelocity;
varying vec2 vCoord;
uniform sampler2D texture;
uniform float time;
const vec3 light = vec3(0.48,0.6,0.64);

vec3 hoge(vec2 base, float v, float t) {
  float u = t * (1.0 - t) * 4.0;
  return texture2D(texture, base + v * vVelocity * t).rgb * u * u;
}

void main() {
  gl_FragColor = vec4(1);
  vec3 val = (
    + hoge(1.31 * vCoord, 1.2, mod(10.0 * time, 1.0))
    + hoge(1.11 * vCoord, 1.1, mod(10.0 * time + 0.333, 1.0))
    + hoge(0.83 * vCoord, 1.4, mod(10.0 * time - 0.333, 1.0))
  ) / 3.0;
  gl_FragColor.rgb = vec3(0.5 + (val.z - 0.5) * min(length(vVelocity),0.4));
  vec3 normal = normalize(vNormal);
  float a = 0.5 + 0.5 * dot(light, normal);
  gl_FragColor.rgb *= 0.8 * a;
  gl_FragColor.a = 0.8;
}
