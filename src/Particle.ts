import {
  Scene,
  Camera,
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
type Point3D = { x: number; y: number; z: number }

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

function flakeShader(uniforms: { time: { value: number }; texture: { value: Texture | null } }) {
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

type PositionedParticleAttribute = { attributes: ParticleAttributes, position: Point3D }
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




function generateFlakeGeometry(attrs: ParticleAttributes, triangles: Triangle2D[], size: number) {
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
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(size / 2, size / 2, size / 2), size * Math.sqrt(3) / 2 + 0.14)
  return geometry
}

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
  smallGeometryBoxes: BufferGeometry[][][][]
  largeGeometryBoxes: BufferGeometry[][][][]
  uniforms: { time: { value: number }, texture: { value: Texture } }
  shader: ShaderMaterial
  meshes: Mesh[] = []
  constructor(texture: Texture, density: number = 256) {
    this.uniforms = { time: { value: 0 }, texture: { value: texture } }
    this.shader = flakeShader(this.uniforms)
    const attributes = [...Array(8)].map(() => generateParticleAttributes(density))
    const smallBoxAttributes = box(4, () => attributes[Math.floor(attributes.length * Math.random())])
    function merge(boxAttrs: ParticleAttributes[][][], i: number, j: number, k: number, size: number) {
      const list: PositionedParticleAttribute[] = []
      eachBox(size, (x, y, z) => {
        list.push({ position: { x, y, z }, attributes: boxAttrs[i + x][j + y][k + z] })
      })
      return mergeParticleAttributes(list)
    }
    const largeBoxAttributes = box(2, (i, j, k) => merge(smallBoxAttributes, 2 * i, 2 * j, 2 * k, 2))
    const triangles0 = sakuraOutlineTriangles(2)
    const triangles1 = sakuraOutlineTriangles(5)
    const triangles2 = sakuraTriangles(3, 5, 12)
    const triangles3 = sakuraTriangles(6, 10, 24)
    const t1geom = new Map<ParticleAttributes, BufferGeometry>()
    const t2geom = new Map<ParticleAttributes, BufferGeometry>()
    const t3geom = new Map<ParticleAttributes, BufferGeometry>()
    this.smallGeometryBoxes = [
      mapBox(smallBoxAttributes, attrs => {
        let g = t1geom.get(attrs)
        if (!g) t1geom.set(attrs, g = generateFlakeGeometry(attrs, triangles1, 1))
        return g
      }),
      mapBox(smallBoxAttributes, attrs => {
        let g = t2geom.get(attrs)
        if (!g) t2geom.set(attrs, g = generateFlakeGeometry(attrs, triangles2, 1))
        return g
      }),
      mapBox(smallBoxAttributes, attrs => {
        let g = t3geom.get(attrs)
        if (!g) t3geom.set(attrs, g = generateFlakeGeometry(attrs, triangles3, 1))
        return g
      })
    ]
    this.largeGeometryBoxes = [
      mapBox(largeBoxAttributes, attrs => generateFlakeGeometry(attrs, triangles0, 2)),
      mapBox(largeBoxAttributes, attrs => generateFlakeGeometry(attrs, triangles1, 2))
    ]
  }
  update(scene: Scene, camera: Camera) {
    const time = performance.now() / 1000
    this.uniforms.time.value = 0.05 * time
    this.shader.needsUpdate = true
    let meshIndex = 0
    const prepareMesh = (geometry: BufferGeometry, { x, y, z }: Point3D) => {
      let mesh = this.meshes[meshIndex]
      if (mesh) {
        mesh.geometry = geometry
        mesh.visible = true
      } else {
        mesh = new Mesh(geometry, this.shader)
        scene.add(mesh)
        this.meshes[meshIndex] = mesh
      }
      mesh.position.x = x
      mesh.position.y = y
      mesh.position.z = z
      meshIndex++
    }
    const threshold0 = 0.5
    const threshold1 = 1
    const threshold2 = 2
    const threshold3 = 4.2
    const wind = time + 0.5 * (Math.sin(0.0133 * time + 1) + Math.sin(0.0173 * time + 2))
    let baseX = 0.1 * wind + 0.02 * (Math.sin(0.0113 * time + 3) + Math.sin(0.0181 * time + 4))
    let baseY = 0.2 * wind + 0.02 * (Math.sin(0.0143 * time + 5) + Math.sin(0.0163 * time + 6))
    let baseZ = -0.1 * time + 0.02 * (Math.sin(0.0127 * time + 7) + Math.sin(0.0151 * time + 8))
    const { x: cx, y: cy, z: cz } = camera.position
    const baseSize = 4
    baseX += Math.round((cx - baseX - baseSize / 2) / baseSize) * baseSize
    baseY += Math.round((cy - baseY - baseSize / 2) / baseSize) * baseSize
    baseZ += Math.round((cz - baseZ - baseSize / 2) / baseSize) * baseSize
    const distance = ({ x, y, z }: Point3D, size: number) => {
      const r = Math.sqrt((x + size / 2 - cx) ** 2 + (y + size / 2 - cy) ** 2 + (z + size / 2 - cz) ** 2)
      const dr = size * Math.sqrt(3) / 2
      return { min: r - dr, max: r + dr }
    }

    const setLarge = (position: Point3D, i: number, j: number, k: number) => {
      const { min } = distance(position, 2)
      if (threshold3 < min) return
      if (threshold2 < min) {
        prepareMesh(this.largeGeometryBoxes[0][i][j][k], position)
      } else if (threshold1 < min) {
        prepareMesh(this.largeGeometryBoxes[1][i][j][k], position)
      } else {
        const { x, y, z } = position
        eachBox(2, (ii, jj, kk) => setSmall({ x: x + ii, y: y + jj, z: z + kk }, 2 * i + ii, 2 * j + jj, 2 * k + kk))
      }
    }
    let n = 0
    const setSmall = (position: Point3D, i: number, j: number, k: number) => {
      const { min } = distance(position, 1)
      if (min < threshold0) {
        prepareMesh(this.smallGeometryBoxes[2][i][j][k], position)
      } else if (min < threshold1) {
        prepareMesh(this.smallGeometryBoxes[1][i][j][k], position)
      } else if (min < threshold2){
        prepareMesh(this.smallGeometryBoxes[0][i][j][k], position)
      }
    }
    eachBox(9, (i, j, k) => {
      setLarge({
        x: baseX + (i - 4) * 2,
        y: baseY + (j - 4) * 2,
        z: baseZ + (k - 4) * 2
      }, i % 2, j % 2, k % 2)
    })
    for (let i = meshIndex; i < this.meshes.length; i++) {
      this.meshes[i].visible = false
    }
  }
}

const particle = new SakuraParticle(texture, 64)
;(window as any).particle = particle
export function start(scene: Scene) {
}
export function update(scene: Scene, camera: Camera) {
  ;(window as any).scene = scene
  ;(window as any).camera = camera
  particle.update(scene, camera)
}