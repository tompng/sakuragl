uniform float time;
attribute vec3 center, random;
attribute float offset;
varying float col;
varying float dist;

vec3 rotate(vec3 v, vec3 axis, float th) {
  axis = normalize(axis);
  vec3 vn = axis * dot(v, axis);
  vec3 vc = v - vn;
  vec3 vs = cross(axis, vc);
  return vn + cos(th) * vc - sin(th) * vs;
}
void main(){
  float t = mod(time + offset, 1.0);
  vec3 pos = rotate(position, vec3(random.xy - vec2(0.5), 0), (32.0 + 16.0 * random.x) * t + sin(18.0 * t));
  pos = rotate(pos, random.zxy - vec3(0.5), 4.0 * t);
  vec3 p = center + 0.01 * pos + vec3(0, 0, 1) * t + 0.01 * sin(6.28 * random.yzx + (vec3(8) + 12.0 * random) * t);
  vec4 cpos = modelViewMatrix * vec4(p, 1);
  col = (0.5 / cpos.z / cpos.z) * t * (1.0 - t);
  gl_Position = projectionMatrix * cpos;
}
