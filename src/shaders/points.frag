varying float col;
varying float dist;
void main() {
  vec2 t = 2.0 * gl_PointCoord.xy - vec2(1);
  float c = clamp(6.0 * (1.0-dot(t, t)), 0.0, 1.0);
  gl_FragColor = vec4(col * c * vec3(0.4, 0.3, 0.3), 1);
}
