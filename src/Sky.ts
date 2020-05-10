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
import vertexShader from './shaders/sky.vert'
import fragmentShader from './shaders/sky.frag'

const canvas = document.createElement('canvas')
canvas.width = canvas.height = 512
const ctx = canvas.getContext('2d')!
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
gradient.addColorStop(0, '#223')
gradient.addColorStop(0.3, '#423')
gradient.addColorStop(0.6, '#223')
gradient.addColorStop(1, '#112')
ctx.fillStyle = gradient
ctx.fillRect(0, 0, canvas.width, canvas.height)
ctx.filter = 'blur(4px)'
for (let i = 0; i < 256; i++) {
  ctx.save()
  ctx.beginPath()
  const x = 512 * Math.random()
  const y = 512 * Math.random()
  const r2 = (x / 256 - 1) ** 2 + ( y / 256 - 1) ** 2
  ctx.translate(x, y)
  ctx.rotate(Math.atan2(y - 256, x - 256))
  ctx.scale(1 - r2, 2 + r2)
  ctx.arc(0, 0, 16, 0, 2 * Math.PI)
  ctx.globalAlpha = 0.01 + 0.02 * Math.random()
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.restore()
}


let texture: Texture | null = null
texture = new Texture(canvas)
texture.magFilter = THREE.LinearFilter
texture.minFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat
texture.needsUpdate = true
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
