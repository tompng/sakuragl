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
import grassVertexShader from './shaders/grass.vert'
import grassFragmentShader from './shaders/grass.frag'
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
const riverInterval = 16
const height = 2

export function landZ(x: number, y: number) {
  const { position, width } = riverParam(x)
  const t = ((y - position.y) / riverInterval % 1 + 1) % 1
  const s = width / 2 / riverInterval
  if (s < t && t < 1 - s) {
    const u = (t - s) / (1 - 2 * s)
    return 4 * height * u * (1 - u)
  } else {
    const u = (t <= s ? t + s : t + s - 1) / s / 2
    const depth = height * 2 * s / (1 - 2 * s)
    return - 4 * depth * u * (1 - u)
  }
}

function generateGrassGeometry(baseX: number, baseY: number, size = 1, count = 1024) {
  const positions: number[] = []
  const rels: number[] = []
  const normals: number[] = []
  const thresholds: number[] = []
  for (let i = 0; i < count; i++) {
    const t = (count - i) / count
    const x = baseX + size * Math.random()
    const y = baseY + size * Math.random()
    const z = landZ(x, y)
    const d = 0.01
    const zdx = (landZ(x + d, y) - landZ(x - d, y)) / 2 / d
    const zdy = (landZ(x, y + d) - landZ(x, y - d)) / 2 / d
    const nr = Math.sqrt(1 + zdx ** 2 + zdy ** 2)
    const nx = -zdx / nr, ny = -zdy / nr, nz = 1 / nr
    positions.push(x, y, z, x, y, z, x, y, z)
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz)
    rels.push(-1, 0, 1, 0, 0, 1)
    thresholds.push(t, t, t)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('rel', new BufferAttribute(new Float32Array(rels), 2))
  geometry.setAttribute('threshold', new BufferAttribute(new Float32Array(thresholds), 1))
  return geometry
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

function generateLandGeometry(xfrom: number, xto: number, xres: number, wres: number) {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  function addPoint(rparam: RiverParam, wi: number) {
    const t = wi / wres
    const x = rparam.position.x
    const y = rparam.position.y + riverInterval * t
    const d = 0.01
    const zdx = (landZ(x + d, y) - landZ(x - d, y)) / 2 / d
    const zdy = (landZ(x, y + d) - landZ(x, y - d)) / 2 / d
    positions.push(x, y, landZ(x, y))
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

class Cache<T> {
  elements = new Map<string, { timer: number, data: T }>()
  timeout: number
  release?: (data: T) => void
  constructor({ timeout, release }: { timeout?: number, release?: (data: T) => void } = {}) {
    this.timeout = timeout || 1000
    this.release = release
  }
  forEach(func: (data: T) => void) {
    this.elements.forEach(ref => func(ref.data))
  }
  get(name: string, func: () => T) {
    let ref = this.elements.get(name)
    const timer = setTimeout(() => this.delete(name), this.timeout)
    if (ref) {
      clearTimeout(ref.timer)
      ref.timer = timer
    } else {
      ref = { data: func(), timer }
      this.elements.set(name, ref)
    }
    return ref.data
  }
  delete(name: string) {
    const ref = this.elements.get(name)
    if (!ref) return
    this.elements.delete(name)
    this.release?.(ref.data)
  }
}

export class Land {
  riverShader: ShaderMaterial
  landShader: ShaderMaterial
  grassShader: ShaderMaterial
  cachedMeshes = new Cache<Mesh>({ release: mesh => this.deleteMesh(mesh) })
  cachedGeometries = new Cache<BufferGeometry>({ release: geom => geom.dispose() })
  riverUniforms = { time: { value: 0 }, texture: { value: waveTexture } }
  grassUniforms = { time: { value: 0 }, texture: { value: waveTexture }}
  constructor(public scene: Scene, public camera: Camera) {
    this.riverShader = new ShaderMaterial({
      uniforms: this.riverUniforms,
      vertexShader: riverVertexShader,
      fragmentShader: riverFragmentShader,
      transparent: true
    })
    this.landShader = new ShaderMaterial({
      uniforms: {},
      vertexShader: landVertexShader,
      fragmentShader: landFragmentShader,
    })
    this.grassShader = new ShaderMaterial({
      uniforms: this.grassUniforms,
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
    })
  }
  deleteMesh(mesh: Mesh) {
    this.scene.remove(mesh)
  }
  update(time: number) {
    this.cachedMeshes.forEach(mesh => { mesh.visible = false })
    this.riverUniforms.time.value = 0.05 * time
    this.riverShader.needsUpdate = true
    this.grassUniforms.time.value = 0.05 * time
    this.grassShader.needsUpdate = true
    const { x: cameraX, y: cameraY, z: cameraZ } = this.camera.position
    const grassFar = 4, grassNear = 2
    for (let x = Math.floor(cameraX - grassFar); x < cameraX + grassFar; x++) {
      for (let y = Math.floor(cameraY - grassFar); y < cameraY + grassFar; y++) {
        const distances = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].map(([x, y]) => 
          Math.sqrt((x - cameraX) ** 2 + (y - cameraY) ** 2 + (landZ(x, y) - cameraZ) ** 2)
        )
        const minDistance = Math.min(...distances)
        const polygons = Math.floor(1024 * Math.min(1, (grassFar - minDistance) / (grassFar - grassNear)))
        if (polygons < 0) continue
        const grassKey = `g/${x}/${y}`
        const grassGeom = this.cachedGeometries.get(grassKey, () => generateGrassGeometry(x, y, 1, 512))
        grassGeom.setDrawRange(0, 3 * polygons)
        const grassMesh = this.cachedMeshes.get(grassKey, () => {
          const m = new Mesh(grassGeom, this.grassShader)
          this.scene.add(m)
          return m
        })
        grassMesh.visible = true
      }
    }
    const maxDistance = 16
    const xInterval = 2
    for (let x = Math.floor((cameraX - maxDistance) / xInterval) * xInterval; x < cameraX + maxDistance; x += xInterval) {
      const landKey = `l/${x}`
      const riverKey = `r/${x}`
      const landGeom = this.cachedGeometries.get(landKey, () => generateLandGeometry(x, x + xInterval, 8, 32))
      const riverGeom = this.cachedGeometries.get(riverKey, () => generateRiverGeometry(x, x + xInterval, 32, 32))
      for (let y = Math.floor((cameraY - maxDistance) / riverInterval) * riverInterval; y < cameraY + maxDistance; y += riverInterval) {
        const landMesh = this.cachedMeshes.get(`${landKey}/${y}`, () => {
          const m = new Mesh(landGeom, this.landShader)
          m.position.y = y
          this.scene.add(m)
          return m
        })
        landMesh.visible = true
      }
      const riverMesh = this.cachedMeshes.get(riverKey, () => {
        const m = new Mesh(riverGeom, this.riverShader)
        this.scene.add(m)
        return m
      })
      riverMesh.position.y = Math.round(cameraY / riverInterval) * riverInterval
      riverMesh.visible = true
    }
  }
}
