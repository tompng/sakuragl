attribute vec2 rel;
attribute float threshold;
uniform sampler2D texture;
uniform float time;
varying float vDecay, color, vNcolor;
const vec3 light = vec3(0.48,0.6,0.64);

void main() {
  float dist = distance(position, cameraPosition);
  vDecay = max(0.0, 1.0 - dist / 16.0);
  float w = clamp(0.0, 1.0, 4.0 + threshold - dist);
  vec2 d = normalize(vec2(position.y - cameraPosition.y, cameraPosition.x - position.x));
  vec3 globalPosition = position + vec3(w * d * rel.x * 0.01, 0.1 * rel.y);
  if (rel.y > 0.0) {
    globalPosition.xy += 0.05 * (texture2D(texture, 0.5 * position.xy - vec2(time)).xy - vec2(0.5));
  }
  gl_Position = projectionMatrix * viewMatrix * vec4(globalPosition, 1);
  vNcolor = 0.5 + 0.5 * dot(light, normal);
  color = rel.y;
}
