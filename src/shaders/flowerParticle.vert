attribute float size;
varying float vDecay;
varying float radius2;
void main() {
  vec4 globalPosition = modelMatrix * vec4(position, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  float dist = distance(globalPosition.xyz, cameraPosition);
  vDecay = 1.0 - dist / 16.0;
  float r = 800.0 * size / dist;
  gl_PointSize = ceil(r);
  r /= ceil(r);
  radius2 = r * r;
}