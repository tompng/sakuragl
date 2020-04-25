varying float vDecay;
varying vec3 vNormal;
const vec3 light = vec3(0.48,0.6,0.64);
void main() {
  gl_FragColor = vec4(0.5, 0.6, 0.5, 1);
  vec3 normal = normalize(vNormal);
  float ndot = dot(light, normal);
  float a = ndot * 0.5 + 0.5;
  gl_FragColor.rgb *= a * vDecay;
}
