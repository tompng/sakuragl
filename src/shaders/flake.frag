varying float col;
varying vec2 coord;
void main() {
  gl_FragColor = vec4(col * vec3(0.8), 1);
  gl_FragColor.r += 0.2 * col / (1.0 + 4.0 * dot(coord, coord));
}
