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


export class FlakeParticle {
  mesh: Mesh
  uniforms = { time: { value: 0 }, texture: { value: null as null | Texture } }
  shader: ShaderMaterial
  constructor(attrs: ParticleAttributes, triangles: Triangle2D[], texture: Texture) {
    const geometry = FlakeParticle.generateGeometry(attrs, triangles)
    this.uniforms.texture.value = texture
    this.shader = flakeShader(this.uniforms)
    this.mesh = new Mesh(geometry, this.shader)
  }
  update() {
    this.uniforms.time.value = 0.05 * performance.now() / 1000
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
        return 0.04 * (
          + Math.sin(4 * (cx1 * x + cy1 * y) + cc1)
          + Math.sin(4 * (cx2 * x + cy2 * y) + cc2)
          - Math.sin(cc1)
          - Math.sin(cc2)
        ) + cv * (x ** 4 + 2 * x ** 2  * y ** 2+ y ** 4)
      }
      const normal = ({ x, y }: Point2D) => {
        const c1 = Math.cos(4 * (cx1 * x + cy1 * y) + cc1)
        const c2 = Math.cos(4 * (cx2 * x + cy2 * y) + cc2)
        const zdx = 0.16 * (cx1 * c1 + cx2 * c2) + cv * (4 * x ** 3 + 2 * y ** 2 * x)
        const zdy = 0.16 * (cy1 * c1 + cy2 * c2) + cv * (4 * y ** 3 + 2 * x ** 2 * y)
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

const outlineTriangles = sakuraOutlineTriangles(5)
const triangles = sakuraTriangles(3 * 2, 5 * 2, 12 * 2)
const texture = new Texture(createSakuraTexture(512))
texture.magFilter = THREE.LinearFilter
texture.minFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat
texture.needsUpdate = true
const particleAttributes = generateParticleAttributes(1024)
const sakura = new PointParticle(65536)
const sakura2 = new FlakeParticle(particleAttributes, triangles, texture)
export function start(scene: Scene) {
  sakura.mesh.position.x = -0.5
  sakura.mesh.position.y = -0.5
  sakura.mesh.position.z = -0.5
  sakura2.mesh.position.x = -0.5
  sakura2.mesh.position.y = -0.5
  sakura2.mesh.position.z = -0.5
  // scene.add(sakura.mesh)
  scene.add(sakura2.mesh)
  document.body.appendChild(createSakuraTexture(512))
}
export function update() {
  sakura.update()
  sakura2.update()
}