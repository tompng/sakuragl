import {
  Scene,
  Camera,
  BufferGeometry,
  PlaneBufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  SphereBufferGeometry,
  Mesh,
  Texture
} from 'three'
import * as THREE from 'three'
import skyImage from './images/sky.png'
import vertexShader from './shaders/sky.vert'
import fragmentShader from './shaders/sky.frag'

const image = new Image()
image.src = skyImage
let texture: Texture | null = null
image.onload = () => {
  texture = new Texture(image)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.format = THREE.RGBFormat
  texture.needsUpdate = true
}
export function getTexture() { return texture }
export class Sky {
  mesh: Mesh
  uniforms = { texture: { value: texture } }
  shader: ShaderMaterial
  constructor() {
    const geometry = new SphereBufferGeometry(24)
    this.shader = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      side: THREE.DoubleSide
    })
    this.mesh = new Mesh(geometry, this.shader)
  }
  update(camera: Camera) {
    this.mesh.position.x = camera.position.x
    this.mesh.position.y = camera.position.y
    this.mesh.position.z = camera.position.z
    if (this.uniforms.texture.value || !texture) return
    this.uniforms.texture.value = texture
    this.shader.needsUpdate = true
  }
}
