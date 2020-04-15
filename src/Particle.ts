import {
  Scene,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Mesh,
  Texture,
  AdditiveBlending
} from 'three'
import * as THREE from 'three'
import { Point2D, Triangle2D, sakuraOutlineTriangles, sakuraTriangles, createSakuraTexture } from './sakura'
import pointsVertexShader from './shaders/points.vert'
import pointsFragmentShader from './shaders/points.frag'
import flakeVertexShader from './shaders/flake.vert'
import flakeFragmentShader from './shaders/flake.frag'

export class PointParticle {
  mesh: Points
  shader: ShaderMaterial
  uniforms = { time: { value: 0 } }
  constructor(size: number) {
    this.shader = pointsShader(this.uniforms)
    const geometry = PointParticle.generateGeometry(size)
    this.mesh = new Points(geometry, this.shader)
  }
  update() {
    this.uniforms.time.value = 0.1 * performance.now() / 1000 % 1
    this.shader.needsUpdate = true
  }
  static generateGeometry(size: number) {
    const positions: number[] = []
    const randoms: number[] = []
    const offsets: number[] = []
    const geometry = new BufferGeometry()
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < 3; j++) {
        positions.push(Math.random())
        randoms.push(Math.random())
      }
      offsets.push(Math.random())
    }
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('random', new BufferAttribute(new Float32Array(randoms), 3))
    geometry.setAttribute('offset', new BufferAttribute(new Float32Array(offsets), 1))
    return geometry
  }
}

function pointsShader(uniforms: { time: { value: number }}) {
  return new ShaderMaterial({
    uniforms,
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })
}

function flakeShader(uniforms: { time: { value: number }; texture: { value: Texture | null }}) {
  return new ShaderMaterial({
    uniforms,
    vertexShader: flakeVertexShader,
    fragmentShader: flakeFragmentShader,
    side: THREE.DoubleSide,
  })
}

type Vec3Values = [number, number, number][]
type ParticleAttributes = {
  size: number
  center: Vec3Values
  freq1 : Vec3Values
  freq2: Vec3Values
  freq3 : Vec3Values
  rand1: Vec3Values
  rand2: Vec3Values
  rand3: Vec3Values
  nrand1: Vec3Values
  nrand2: Vec3Values
  nrand3: Vec3Values
}

function generateParticleAttributes(size: number): ParticleAttributes {
  type V = { x: number[]; y: number[]; z: number[] }
  const center: Vec3Values = []
  const freq1: Vec3Values = []
  const freq2: Vec3Values = []
  const freq3: Vec3Values = []
  const rand1: Vec3Values = []
  const rand2: Vec3Values = []
  const rand3: Vec3Values = []
  const nrand1: Vec3Values = []
  const nrand2: Vec3Values = []
  const nrand3: Vec3Values = []
  for (let i = 0; i < size; i++) {
    center.push([Math.random(), Math.random(), Math.random()])
    ;[freq1, freq2, freq3].forEach((freq, i) => {
      const n = 4 + 2 * i
      freq.push([Math.floor(n + n * Math.random()), Math.floor(n + n * Math.random()), Math.floor(n + n * Math.random())])
    })
    ;[rand1, rand2, rand3].forEach(rand => {
      rand.push([2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1])
    })
    ;[nrand1, nrand2, nrand3].forEach(nrand => {
      while (true) {
        const x = 2 * Math.random() - 1
        const y = 2 * Math.random() - 1
        const z = 2 * Math.random() - 1
        const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
        if (r > 1) continue
        nrand.push([x / r, y / r, z / r])
        break
      }
    })
  }
  return { size, center, freq1, freq2, freq3, rand1, rand2, rand3, nrand1, nrand2, nrand3 }
}

type PositionedParticleAttribute = { attributes: ParticleAttributes, position: { x: number; y: number; z: number } }
function mergeParticleAttributes(list: PositionedParticleAttribute[]) {
  const attributes: ParticleAttributes = {
    size: 0,
    center: [],
    freq1: [],
    freq2: [],
    freq3: [],
    rand1: [],
    rand2: [],
    rand3: [],
    nrand1: [],
    nrand2: [],
    nrand3: []
  }
  list.forEach(({ attributes: attr, position: { x, y, z }}) => {
    attributes.size += attr.size
    attr.center.forEach(([cx, cy, cz]) => attributes.center.push([cx + x, cy + y, cz + z]))
    ;(['freq1', 'freq2', 'freq3', 'rand1', 'rand2', 'rand3', 'nrand1', 'nrand2', 'nrand3'] as const).forEach(name => {
      attr[name].forEach(v => attributes[name].push(v))
    })
  })
  return attributes
}



export class FlakeParticle {
  mesh: Mesh
  uniforms = { time: { value: 0 }, texture: { value: null as null | Texture } }
  shader: ShaderMaterial
  constructor(geometry: BufferGeometry, texture: Texture) {
    this.uniforms.texture.value = texture
    this.shader = flakeShader(this.uniforms)
    this.mesh = new Mesh(geometry, this.shader)
  }
  update() {
    this.uniforms.time.value = 0.05 * performance.now() / 1000 / 4
    this.shader.needsUpdate = true
  }
  static generateGeometry(attrs: ParticleAttributes, triangles: Triangle2D[]) {
    const positions: number[] = []
    const normals: number[] = []
    const centers: number[] = []
    const freq1s: number[] = []
    const freq2s: number[] = []
    const freq3s: number[] = []
    const rand1s: number[] = []
    const rand2s: number[] = []
    const rand3s: number[] = []
    const nrand1s: number[] = []
    const nrand2s: number[] = []
    const geometry = new BufferGeometry()
    for (let i = 0; i < attrs.size; i++) {
      const cx1 = 2 * Math.random() - 1
      const cy1 = 2 * Math.random() - 1
      const cx2 = 2 * Math.random() - 1
      const cy2 = 2 * Math.random() - 1
      const cc1 = 2 * Math.PI * Math.random()
      const cc2 = 2 * Math.PI * Math.random()
      const cv = 0.4 * Math.random()
      const fz = ({ x, y }: Point2D) => {
        return 0.08 * (
          + Math.sin(4 * (cx1 * x + cy1 * y) + cc1)
          + Math.sin(4 * (cx2 * x + cy2 * y) + cc2)
          - Math.sin(cc1)
          - Math.sin(cc2)
        ) + cv * (x ** 4 + 2 * x ** 2  * y ** 2+ y ** 4)
      }
      const normal = ({ x, y }: Point2D) => {
        const c1 = Math.cos(4 * (cx1 * x + cy1 * y) + cc1)
        const c2 = Math.cos(4 * (cx2 * x + cy2 * y) + cc2)
        const zdx = 0.32 * (cx1 * c1 + cx2 * c2) + cv * (4 * x ** 3 + 2 * y ** 2 * x)
        const zdy = 0.32 * (cy1 * c1 + cy2 * c2) + cv * (4 * y ** 3 + 2 * x ** 2 * y)
        const r = Math.sqrt(1 + zdx ** 2 + zdy ** 2)
        return [-zdx / r, -zdy / r, 1 / r] as const
      }
      for (const [a, b, c] of triangles) {
        positions.push(a.x, a.y, fz(a), b.x, b.y, fz(b), c.x, c.y, fz(c))
        normals.push(...normal(a), ...normal(b), ...normal(c))
        for (let j = 0; j < 3; j++) {
          centers.push(...attrs.center[i])
          freq1s.push(...attrs.freq1[i])
          freq2s.push(...attrs.freq2[i])
          freq3s.push(...attrs.freq3[i])
          rand1s.push(...attrs.rand1[i])
          rand2s.push(...attrs.rand2[i])
          rand3s.push(...attrs.rand3[i])
          nrand1s.push(...attrs.nrand1[i])
          nrand2s.push(...attrs.nrand2[i])
        }
      }
    }
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('center', new BufferAttribute(new Float32Array(centers), 3))
    geometry.setAttribute('freq1', new BufferAttribute(new Float32Array(freq1s), 3))
    geometry.setAttribute('freq2', new BufferAttribute(new Float32Array(freq2s), 3))
    geometry.setAttribute('freq3', new BufferAttribute(new Float32Array(freq3s), 3))
    geometry.setAttribute('rand1', new BufferAttribute(new Float32Array(rand1s), 3))
    geometry.setAttribute('rand2', new BufferAttribute(new Float32Array(rand2s), 3))
    geometry.setAttribute('rand3', new BufferAttribute(new Float32Array(rand3s), 3))
    geometry.setAttribute('nrand1', new BufferAttribute(new Float32Array(nrand1s), 3))
    geometry.setAttribute('nrand2', new BufferAttribute(new Float32Array(nrand2s), 3))
    return geometry
  }
}

const sakura = new PointParticle(65536)

// const triangles = sakuraOutlineTriangles(2)
const triangles = sakuraTriangles(6, 10, 24)
const texture = new Texture(createSakuraTexture(512))
texture.magFilter = THREE.LinearFilter
texture.minFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat
texture.needsUpdate = true

function box<T>(n: number, f: (i: number, j: number, k: number) => T): T[][][] {
  return [...new Array(n)].map((_, i) =>
    [...new Array(n)].map((_, j) =>
      [...new Array(n)].map((_, k) =>
        f(i, j, k)
      )
    )
  )
}
function eachBox(n: number, f: (i: number, j: number, k: number) => void) {
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) f(i, j, k)
}
function mapBox<T, U>(box: T[][][], f: (t: T, i: number, j: number, k: number) => U): U[][][] {
  return box.map((yzs, i) => yzs.map((zs, j) => zs.map((t, k) => f(t, i, j, k))))
}
function flatMapBox<T, U>(box: T[][][], f: (t: T, i: number, j: number, k: number) => U): U[] {
  const result: U[] = []
  box.forEach((yzs, i) => yzs.forEach((zs, j) => zs.forEach((t, k) => {
    result.push(f(t, i, j, k))
  })))
  return result
}

class SakuraParticle {
  smallFlakeBoxes: BufferGeometry[][][][]
  mediumFlakeBoxes: BufferGeometry[][][][]
  largeFlakes: BufferGeometry[]
  uniforms: { time: { value: number }, texture: { value: Texture } }
  shader: ShaderMaterial
  constructor(density: number = 256, texture: Texture) {
    this.uniforms = { time: { value: 0 }, texture: { value: texture } }
    this.shader = flakeShader(this.uniforms)
    const smallBoxAttributes = box(4, () => generateParticleAttributes(density))
    function merge(boxAttrs: ParticleAttributes[][][], i: number, j: number, k: number, size: number) {
      const list: PositionedParticleAttribute[] = []
      eachBox(size, (x, y, z) => {
        list.push({ position: { x, y, z }, attributes: boxAttrs[i + x][j + y][k + z] })
      })
      return mergeParticleAttributes(list)
    }
    const mediumBoxAttributes = box(2, (i, j, k) => merge(smallBoxAttributes, 2 * i, 2 * j, 2 * k, 2))
    const largeAttributes = merge(mediumBoxAttributes, 0, 0, 0, 2)
    const triangles0 = sakuraOutlineTriangles(2)
    const triangles1 = sakuraOutlineTriangles(5)
    const triangles2 = sakuraTriangles(3, 5, 12)
    const triangles3 = sakuraTriangles(6, 10, 24)
    this.smallFlakeBoxes = [
      mapBox(smallBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles0)),
      mapBox(smallBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles1)),
      mapBox(smallBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles2)),
      mapBox(smallBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles3))
    ]
    this.mediumFlakeBoxes = [
      mapBox(mediumBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles0)),
      mapBox(mediumBoxAttributes, attrs => FlakeParticle.generateGeometry(attrs, triangles1))
    ]
    this.largeFlakes = [
      FlakeParticle.generateGeometry(largeAttributes, triangles0),
      FlakeParticle.generateGeometry(largeAttributes, triangles1)
    ]
  }
  attach(scene: Scene) {

  }
  update(camera: THREE.Camera) {
    this.uniforms.time.value = 0.05 * performance.now() / 1000 / 4
    this.shader.needsUpdate = true
  }
}

const particleAttributes = generateParticleAttributes(256)


const sakuraGeometry = FlakeParticle.generateGeometry(particleAttributes, triangles)
const sakura2 = new FlakeParticle(sakuraGeometry, texture)

export function start(scene: Scene) {
  sakura2.mesh.position.x = -0.5
  sakura2.mesh.position.y = -0.5
  sakura2.mesh.position.z = -0.5
  scene.add(sakura2.mesh)
}
export function update() {
  sakura.update()
  sakura2.update()
}