import {
  Scene,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending
} from 'three'


import { loadFileSync } from './loadFileSync'
const vertexShader = loadFileSync('src/shaders/points.vert')
const fragmentShader = loadFileSync('src/shaders/points.frag')

export class PointParticle {
  size: number
  particles: Points
  shader: ShaderMaterial
  uniforms = {
    time: { value: 0 }
  }
  constructor(size: number) {
    this.size = size
    this.shader = particleShader(this.uniforms)
    const geometry = particleGeometry(size)
    this.particles = new Points(geometry, this.shader)
  }
  update() {
    this.uniforms.time.value = 0.1 * performance.now() / 1000
    this.shader.needsUpdate = true
  }
}

function particleShader(uniforms: { time: { value: number }}) {
  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })
}

function particleGeometry(size: number) {
  const points: number[] = []
  const rands: number[] = []
  const offsets: number[] = []
  const geometry = new BufferGeometry()
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < 3; j++) {
      points.push(Math.random())
      rands.push(Math.random())
    }
    offsets.push(Math.random())
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3))
  geometry.setAttribute('random', new BufferAttribute(new Float32Array(rands), 3))
  geometry.setAttribute('offset', new BufferAttribute(new Float32Array(offsets), 1))
  return geometry
}

const sakura = new PointParticle(65536)
export function start(scene: Scene) {
  sakura.particles.position.x = -0.5
  sakura.particles.position.y = -0.5
  sakura.particles.position.z = -0.5
  scene.add(sakura.particles)
}
export function update() {
  sakura.update()
}