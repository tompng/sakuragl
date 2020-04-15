uniform float time;
attribute vec3 center, freq1, freq2, freq3, rand1, rand2, rand3, nrand1, nrand2;
varying float col;
varying vec2 coord;
const float pi = 3.14159265358979323846;
vec3 rotate(vec3 v, vec3 normalizedAxis, float theta) {
  vec3 vn = normalizedAxis * dot(v, normalizedAxis);
  vec3 vc = v - vn;
  vec3 vs = cross(normalizedAxis, vc);
  return vn + cos(theta) * vc - sin(theta) * vs;
}
void main(){
  vec3 pos = rotate(position, normalize(nrand1 * vec3(2, 1, 0)), 2.0 * pi * (freq2.x + freq2.y) * time + sin(6.0 * pi * (time + rand1.x)));
  pos = rotate(pos, nrand2, 2.0 * pi * (freq1.y + freq1.z) * time);
  vec3 p = center + 0.01 * pos + 0.03 * sin(2.0 * pi * (freq1 * time + rand1)) + 0.02 * sin(2.0 * pi * (freq2 * time + rand2)) + 0.01 * sin(2.0 * pi * (freq3 * time + rand3));
  vec4 cpos = modelViewMatrix * vec4(p, 1);
  col = min(1.0, 0.1 / cpos.z / cpos.z);
  coord = position.xy + vec2(1, 0);
  gl_Position = projectionMatrix * cpos;
}
