attribute float size;
varying float vDecay;
varying float radius;
void main() {
  vec4 globalPosition = modelMatrix * vec4(position, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  float dist = distance(globalPosition.xyz, cameraPosition);
  vDecay = 1.0 - dist / 16.0;
  float r = 400.0 * size / dist;
  gl_PointSize = ceil(r);
  radius = r / gl_PointSize;
}