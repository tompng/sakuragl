uniform float time;
attribute vec3 center, freq1, freq2, freq3, rand1, rand2, rand3, nrand1, nrand2;
varying float vDecay;
varying vec2 vCoord;
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
  float rot1 = 2.0 * pi * dot(freq2, vec3(1)) * time + sin(6.0 * pi * (time + rand1.x));
  vec3 axis2 = nrand2;
  vec4 globalCenter = modelMatrix * vec4(center + 0.06 * sin(2.0 * pi * (freq1 * time + rand1)) + 0.04 * sin(2.0 * pi * (freq2 * time + rand2)) + 0.02 * sin(2.0 * pi * (freq3 * time + rand3)), 1);
  float dist = distance(globalCenter.xyz, cameraPosition);
  float rot2 = 2.0 * pi * dot(freq1, vec3(1)) * time;
  vec3 rpos = rotate(rotate(position, axis1, rot1), axis2, rot2);
  vec3 norm = rotate(rotate(normal, axis1, rot1), axis2, rot2);
  vec4 globalPosition = globalCenter + modelMatrix * vec4(0.02 * clamp(4.0 * (4.0 - dist), 0.0, 1.0) * rpos, 0);
  vDecay = 1.0 - dist / 16.0;
  vCoord = vec2(0.5) + 0.5 * position.xy;
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
  vPosition = globalPosition.xyz;
  vNormal = normalize((modelViewMatrix * vec4(normal, 1)).xyz);
}
