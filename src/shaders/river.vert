attribute vec2 velocity;
uniform sampler2D texture;
uniform float time;
varying vec3 vNormal;
varying float vDecay;
varying vec3 vPosition;
varying vec2 vVelocity;
varying vec2 vCoord;

void main() {
  vec2 xy = (modelMatrix * vec4(position, 1)).xy;
  vCoord = xy;
  vec3 w = 0.1 * (
    + texture2D(texture, 0.1 * xy - vec2(0.91, 0.41) * time).xyz
    + texture2D(texture, 0.1 * xy + vec2(-0.81, 0.58) * time).xyz
    + texture2D(texture, 0.1 * xy + vec2(-0.09,0.99) * time).xyz
    - vec3(1.5)
  );
  vVelocity = velocity;
  vNormal = normalize(vec3(-w.x, -w.y, 1));
  vPosition = vec3(xy, w.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1);
  float dist = distance(vec3(xy, 0), cameraPosition);
  vDecay = max(0.0, 1.0 - dist / 16.0);
}
