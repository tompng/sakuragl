uniform float time;
attribute vec3 random;
attribute float offset;
varying float col;
varying float dist;
void main(){
  float t = mod(time + offset, 1.0);
  vec3 p = position + vec3(0, 0, 1) * t + 0.01 * sin(6.28 * random.yzx + (vec3(8) + 12.0 * random) * t);
  vec4 cpos = modelViewMatrix * vec4(p, 1);
  gl_PointSize = 4.0;//max(10.0, 1.0 + 10.0 / cpos.z);
  float hira = 0.2 + clamp(sin(t * (132.0 + 35.0*random.x)), 0.0, 0.8);
  col = (0.5 / cpos.z / cpos.z) * t * (1.0 - t) * hira;
  gl_Position = projectionMatrix * cpos;
}
