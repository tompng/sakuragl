varying vec2 vCoord;
varying float viewZ;
const float pi = 3.141592653589793;
void main() {
  vec3 nview = normalize(position);
  vCoord = vec2(0.5) + nview.xy * acos(nview.z) / length(nview.xy) / pi;
  viewZ = nview.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
}

