varying vec3 vNormal;
varying float vDecay;

void main() {
  vNormal = normal;
  vec4 globalPosition = modelMatrix * vec4(position, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  vDecay = max(0.0, 1.0 - distance(globalPosition.xyz, cameraPosition) / 16.0);
}
