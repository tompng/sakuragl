uniform sampler2D texture;
varying vec2 vCoord;
varying float viewZ;
void main() {
  gl_FragColor = texture2D(texture, vCoord);
  gl_FragColor.rgb *= clamp(4.0 * viewZ, 0.0, 1.0);
}