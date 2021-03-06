varying float vDecay;
varying float radius;
void main() {
  vec2 t = (2.0 * gl_PointCoord.xy - vec2(1)) / radius;
  float a = clamp(2.0 - 2.0 * dot(t, t), 0.0, 1.0);
  gl_FragColor = vec4(vec3(0.95, 0.8, 0.8) * vDecay, a * 0.5);
}