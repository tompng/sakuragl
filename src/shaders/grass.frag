varying float vDecay, color, vNcolor;
void main() {
  gl_FragColor = vec4((vNcolor * vec3(0.5, 0.6, 0.5) + vec3(-0.2,-0.1,-0.2) * color) * vDecay, 1);
}
