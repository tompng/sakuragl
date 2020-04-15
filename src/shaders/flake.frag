varying float vDecay;
varying vec2 vCoord;
varying vec3 vNormal, vPosition;
const vec3 light = vec3(0.48,0.6,0.64);
uniform sampler2D texture;
void main() {
  gl_FragColor = texture2D(texture, vCoord) + vec4(0.1, 0.1, 0.1, 1);
  vec3 normal = normalize(vNormal);
  float ndot = gl_FrontFacing ? dot(light, normal) : dot(light, -normal);
  float a = max(
    ndot * 0.4 + 0.6,
    -ndot * 0.4 + 0.4
  );
  gl_FragColor.rgb *= a * vDecay;
}
