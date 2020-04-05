import {
  Scene,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Mesh,
  AdditiveBlending
} from 'three'
import * as THREE from 'three'
import { sakuraOutline, sakuraOutlineTriangles, sakuraTriangles } from './sakura'
import { loadFileSync } from './loadFileSync'
const pointsVertexShader = loadFileSync('src/shaders/points.vert')
const pointsFragmentShader = loadFileSync('src/shaders/points.frag')
const flakeVertexShader = loadFileSync('src/shaders/flake.vert')
const flakeFragmentShader = loadFileSync('src/shaders/flake.frag')

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
    this.uniforms.time.value = 0.1 * performance.now() / 1000
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

function flakeShader(uniforms: { time: { value: number }}) {
  return new ShaderMaterial({
    uniforms,
    vertexShader: flakeVertexShader,
    fragmentShader: flakeFragmentShader,
    blending: AdditiveBlending,
    side: THREE.DoubleSide,
    depthTest: false,
    transparent: true
  })
}

export class FlakeParticle {
  mesh: Mesh
  uniforms = { time: { value: 0 } }
  shader: ShaderMaterial
  constructor(size: number, level: number) {
    const geometry = FlakeParticle.generateGeometry(size, level)
    this.shader = flakeShader(this.uniforms)
    this.mesh = new Mesh(geometry, this.shader)
  }
  update() {
    this.uniforms.time.value = 0.1 * performance.now() / 1000
    this.shader.needsUpdate = true
  }
  static generateGeometry(size: number, level: number) {
    // const triangles = sakuraOutlineTriangles(level)
    const triangles = sakuraTriangles(3, 5, 12)
    const positions: number[] = []
    const centers: number[] = []
    const randoms: number[] = []
    const offsets: number[] = []
    const geometry = new BufferGeometry()
    for (let i = 0; i < size; i++) {
      const center = [Math.random(), Math.random(), Math.random()]
      const random = [Math.random(), Math.random(), Math.random()]
      const offset = Math.random()
      const cx = 2 * Math.random() - 1
      const cy = 2 * Math.random() - 1
      const cc = 2 * Math.PI * Math.random()
      const fz = ({ x, y }: { x: number, y: number }) => {
        return 0.1 * Math.sin(4 * (cx * x + cy * y) + cc)
      }
      for (const [a, b, c] of triangles) {
        positions.push(a.x, a.y, fz(a), b.x, b.y, fz(b), c.x, c.y, fz(c))
        for (let j = 0; j < 3; j++) {
          centers.push(...center)
          randoms.push(...random)
          offsets.push(offset)
        }
      }
    }
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('center', new BufferAttribute(new Float32Array(centers), 3))
    geometry.setAttribute('random', new BufferAttribute(new Float32Array(randoms), 3))
    geometry.setAttribute('offset', new BufferAttribute(new Float32Array(offsets), 1))
    return geometry
  }
}

const sakura = new PointParticle(65536)
const sakura2 = new FlakeParticle(8192, 8)
export function start(scene: Scene) {
  sakura.mesh.position.x = -0.5
  sakura.mesh.position.y = -0.5
  sakura.mesh.position.z = -0.5
  sakura2.mesh.position.x = -0.5
  sakura2.mesh.position.y = -0.5
  sakura2.mesh.position.z = -0.5
  // scene.add(sakura.mesh)
  scene.add(sakura2.mesh)
}
export function update() {
  sakura.update()
  sakura2.update()
}