import {
  Scene,
  Camera,
  BufferGeometry,
  PlaneBufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  Texture
} from 'three'
import * as THREE from 'three'
import vertexShader from './shaders/land.vert'
import fragmentShader from './shaders/land.frag'
import riverVertexShader from './shaders/river.vert'
import riverFragmentShader from './shaders/river.frag'
import { createWaveTexture } from './wave'

type RiverParam = ReturnType<typeof riverParam>
function riverParam(x: number) {
  const yparams = [0.409, 0.313, 0.233, 0.137]
  const wparams = [0.251, 0.173]
  let y = 0, dx = 0
  yparams.forEach((p, i) => {
    y += Math.sin(p * x + i)
    dx += p * Math.cos(p * x + i)
  })
  let width = 1, wdx = 0
  wparams.forEach((p, i) => {
    width += Math.sin(p * x + i) / 3
    wdx += p * Math.cos(p * x + i) / 3
  })
  const v = 1 / width
  const rv = Math.sqrt(1 + dx ** 2)
  const down = { x, y: y - width / 2 }
  const up = { x, y: y + width / 2 }
  const position = { x, y }
  const velocity = { x: v / rv, y: v * dx / rv }
  return {
    position,
    velocity,
    width,
    down,
    up
  }
}

function generateRiverGeometry(xfrom: number, xto: number, xres: number, wres: number, safe = 0.1) {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const velocities: number[] = []
  function addPoint(rparam: RiverParam, wi: number) {
    const tu = (1 + 2 * safe) * wi / wres - safe
    const td = 1 - tu
    const v = tu < 0 || tu > 1 ? 0 : tu * td * 4
    positions.push(rparam.position.x, td * rparam.down.y + tu * rparam.up.y, 0)
    velocities.push(v * rparam.velocity.x, v * rparam.velocity.y)
  }
  for (let xi = 0; xi < xres; xi++) {
    const x0 = xfrom + (xto - xfrom) * xi / xres
    const x1 = xfrom + (xto - xfrom) * (xi + 1) / xres
    const r0 = riverParam(x0)
    const r1 = riverParam(x1)
    for (let wi = 0; wi < wres; wi++) {
      addPoint(r0, wi)
      addPoint(r1, wi)
      addPoint(r1, wi + 1)
      addPoint(r0, wi)
      addPoint(r1, wi + 1)
      addPoint(r0, wi + 1)
    }
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('velocity', new BufferAttribute(new Float32Array(velocities), 2))
  return geometry
}


const waveTexture = new Texture(createWaveTexture(256, 8))
waveTexture.magFilter = THREE.LinearFilter
waveTexture.minFilter = THREE.LinearFilter
waveTexture.format = THREE.RGBFormat
waveTexture.wrapS = THREE.RepeatWrapping
waveTexture.wrapT = THREE.RepeatWrapping
waveTexture.needsUpdate = true

export class Land {
  geometry: BufferGeometry
  shader: ShaderMaterial
  mesh: Mesh
  uniforms = { time: { value: 0 }, texture: { value: waveTexture } }
  constructor() {
    this.geometry = generateRiverGeometry(-8, 8, 128, 32)
    this.shader = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: riverVertexShader,
      fragmentShader: riverFragmentShader,
      transparent: true
    })
    const mesh = new Mesh(
      this.geometry,
      this.shader
    )
    this.mesh = mesh
  }
  update() {
    const time = performance.now() / 1000
    this.uniforms.time.value = 0.05 * time
    this.shader.needsUpdate = true
  }
}
