attribute vec2 velocity;
uniform sampler2D texture;
uniform float time;
varying vec3 vNormal;
varying float vDecay;
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
  vec4 globalPosition = vec4(xy, w.z, 1);
  gl_Position = projectionMatrix * viewMatrix * globalPosition;
}
