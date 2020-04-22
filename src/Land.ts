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
import landVertexShader from './shaders/land.vert'
import landFragmentShader from './shaders/land.frag'
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
  const v = 1 / (1 + width)
  const rv = Math.sqrt(1 + dx ** 2)
  const down = { x, y: y - width / 2, dx: dx - wdx / 2 }
  const up = { x, y: y + width / 2, dx: dx + wdx / 2 }
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

function generateLandGeometry(xfrom: number, xto: number, riverInterval: number, height: number, xres: number, wres: number) {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  function addPoint(rparam: RiverParam, wi: number) {
    const t = wi / wres
    const s = rparam.width / 2 / riverInterval
    const y = rparam.position.y + riverInterval * t
    let z: number
    let zdx: number, zdy: number
    const depth = height * 2 * s / (1 - 2 * s)
    if (s < t && t < 1 - s) {
      const u = (t - s) / (1 - 2 * s)
      z = 4 * height * u * (1 - u)
      zdy = 4 * height * (1 - 2 * u) * height / riverInterval / (1 - 2 * s)
      zdx = 0//4 * height * (1 - 2 * u) * 
    } else {
      const u = (t <= s ? t + s : t + s - 1) / s / 2
      const c = - 4 * depth
      z = c * u * (1 - u)
      zdy = c * (1 - 2 * u) / riverInterval / s / 2
      zdx = 0//c * (1 - 2 * u) * (t <= s ? t : t - 1) * riverInterval
    }
    positions.push(rparam.position.x, y, z)
    const nr = Math.sqrt(1 + zdx ** 2 + zdy ** 2)
    normals.push(-zdx / nr, -zdy / nr, 1 / nr)
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
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
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
  riverShader: ShaderMaterial
  riverMesh: Mesh
  landShader: ShaderMaterial
  landMeshU: Mesh
  landMeshD: Mesh
  riverUniforms = { time: { value: 0 }, texture: { value: waveTexture } }
  constructor() {
    const riverGeometry = generateRiverGeometry(-8, 8, 128, 32)
    this.riverShader = new ShaderMaterial({
      uniforms: this.riverUniforms,
      vertexShader: riverVertexShader,
      fragmentShader: riverFragmentShader,
      transparent: true
    })
    const riverInterval = 8
    const landGeometry = generateLandGeometry(-8, 8, riverInterval, 1, 128, 32)
    this.landShader = new ShaderMaterial({
      uniforms: {},
      vertexShader: landVertexShader,
      fragmentShader: landFragmentShader,
    })
    this.riverMesh = new Mesh(
      riverGeometry,
      this.riverShader
    )
    this.landMeshU = new Mesh(
      landGeometry,
      this.landShader
    )
    this.landMeshD = new Mesh(
      landGeometry,
      this.landShader
    )
    this.landMeshD.position.y = -riverInterval
  }
  update() {
    const time = performance.now() / 1000
    this.riverUniforms.time.value = 0.05 * time
    this.riverShader.needsUpdate = true
  }
}
