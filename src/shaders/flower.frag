uniform sampler2D texture;
varying vec3 vNormal;
varying vec2 vCoord;
varying vec2 vOffset;
varying float vDecay;
const vec3 light = vec3(0.48,0.6,0.64);

void main() {
  vec3 normal = normalize(vNormal);
  float ndot = gl_FrontFacing ? dot(light, normal) : dot(light, -normal);
  float a = vCoord.y == 0.0 ? 1.0 : vCoord.y == 1.0 ? ndot * 0.4 + 0.6 : max(
    ndot * 0.4 + 0.6,
    -ndot * 0.4 + 0.4
  );
  gl_FragColor = texture2D(texture, vCoord + (gl_FrontFacing ? vOffset : - vOffset) / 4.0) + vec4(0.1, 0.1, 0.1, 0);
  gl_FragColor.rgb *= a * vDecay;
}