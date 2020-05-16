varying vec3 vNormal;
varying float vDecay;
const vec3 light = vec3(0.48,0.6,0.64);

void main() {
  float ndot = dot(light, normalize(vNormal));
  float a = ndot * 0.4 + 0.6;
  gl_FragColor = vec4(0.1, 0.1, 0.1, 1);
  gl_FragColor.rgb *= a * vDecay;
}