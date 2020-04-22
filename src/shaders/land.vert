varying vec3 vNormal;
varying float vDecay;

float height(vec2 p) {
  p += 2.0 * sin(mat2(0.43,0.31,0.29,-0.53) * p);
  float x = p.x + 2.0 * sin(dot(vec2(0.35,0.51),p));
  float z = 1.0 + dot(vec2(0.2), cos(mat2(0.21,0.31,0.32,-0.13) * p));
  return (abs(sin(0.2 * x)) - 0.2) * z / 2.0;
}


void main() {
  vec2 xy = (modelMatrix * vec4(position, 1)).xy;
  float z = height(xy);
  float d = 0.001;
  float zdx = height(xy + vec2(d, 0)) - z;
  float zdy = height(xy + vec2(0, d)) - z;
  vNormal = normalize(vec3(-zdx, -zdy, d));
  vec4 globalPosition = vec4(xy, z, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  vDecay = max(0.0, 1.0 - distance(globalPosition.xyz, cameraPosition) / 16.0);
}
