varying float col;
varying vec2 coord;
varying vec3 vNormal, vPosition;
const vec3 light = vec3(0.48,0.6,0.64);
void main() {
  gl_FragColor = vec4(vec3(0.8), 1);
  gl_FragColor.r += 0.4 / (1.0 + 4.0 * dot(coord, coord));
  vec3 normal = normalize(vNormal);
  if (!gl_FrontFacing) normal = -normal;
  float a = dot(light, normal) * 0.4 + 0.6;
  gl_FragColor.rgb *= col * a;
}
