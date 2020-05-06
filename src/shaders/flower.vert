attribute vec2 offset;
varying vec3 vNormal;
varying vec2 vCoord;
varying vec2 vOffset;
varying float vDecay;
void main() {
  vec4 globalPosition = modelMatrix * vec4(position, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  vNormal = normalize(modelMatrix * vec4(normal, 0)).xyz;
  float dist = distance(globalPosition.xyz, cameraPosition);
  vDecay = 1.0 - dist / 16.0;
  vCoord = uv;
  vOffset = offset;
}