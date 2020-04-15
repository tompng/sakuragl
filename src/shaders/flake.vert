uniform float time;
attribute vec3 center, freq1, freq2, freq3, rand1, rand2, rand3, nrand1, nrand2;
varying float col;
varying vec2 coord;
varying vec3 vNormal, vPosition;
const float pi = 3.14159265358979323846;
vec3 rotate(vec3 v, vec3 normalizedAxis, float theta) {
  vec3 vn = normalizedAxis * dot(v, normalizedAxis);
  vec3 vc = v - vn;
  vec3 vs = cross(normalizedAxis, vc);
  return vn + cos(theta) * vc - sin(theta) * vs;
}
void main(){
  vec3 axis1 = normalize(nrand1 * vec3(2, 1, 0));
  float rot1 = 2.0 * pi * (freq2.x + freq2.y) * time + sin(6.0 * pi * (time + rand1.x));
  vec3 axis2 = nrand2;
  float rot2 = 2.0 * pi * (freq1.y + freq1.z) * time;
  vec3 pos = rotate(rotate(position, axis1, rot1), axis2, rot2);
  vec3 norm = rotate(rotate(normal, axis1, rot1), axis2, rot2);
  vec3 p = center + 0.01 * pos + 0.03 * sin(2.0 * pi * (freq1 * time + rand1)) + 0.02 * sin(2.0 * pi * (freq2 * time + rand2)) + 0.01 * sin(2.0 * pi * (freq3 * time + rand3));
  vec4 globalPos = modelViewMatrix * vec4(p, 1);
  col = min(1.0, 0.1 / globalPos.z / globalPos.z);
  coord = position.xy + vec2(1, 0);
  gl_Position = projectionMatrix * globalPos;
  vPosition = globalPos.xyz;
  vNormal = norm;//normalize((modelViewMatrix * vec4(normal, 1)).xyz);
}
