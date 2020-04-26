varying vec3 vNormal;
varying float vDecay;
varying vec2 vVelocity;
varying vec2 vCoord;
varying vec3 vPosition;
uniform sampler2D texture;
uniform sampler2D sky;
uniform float time;
const vec3 light = vec3(0.48,0.6,0.64);
const float pi = 3.141592653589793;
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
  vec3 normal = normalize(vNormal + vec3(val.xy - vec2(0.5), 0));
  vec3 nview = reflect(normalize(vPosition - cameraPosition), normal);
  vec2 coord = vec2(0.5) + nview.xy * acos(nview.z) / length(nview.xy) / pi;
  float a = 1.0 - 0.4 * dot(nview, normal);
  gl_FragColor.rgb = (0.8 * texture2D(sky, coord).rgb * a + 0.2 * vec3(val.z))* vDecay;
  gl_FragColor.a = 0.8 * a;
}
