import {
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Scene,
} from 'three'
import * as THREE from 'three'
import { FlowerAttributes, generateBouquetParamList, generateBouquets, generateGeometry, mergeAttributes, cloneAttributes, transformAttributes } from './Flower'

type FlowerPosition = { start: Point3D, xyrot: number, zrot: number, drift: number, index: number }
export type Point3D = { x: number; y: number; z: number }
function normalize({ x, y, z }: Point3D) {
  const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  if (r === 0) return { x: 0, y: 0, z: 0 }
  return { x: x / r, y: y / r, z: z / r }
}
function dot(p: Point3D, q: Point3D) {
  return p.x * q.x + p.y * q.y + p.z * q.z
}
function cross(p: Point3D, q: Point3D) {
  return {
    x: p.y * q.z - p.z * q.y,
    y: p.z * q.x - p.x * q.z,
    z: p.x * q.y - p.y * q.x
  }
}

function randomCross(p: Point3D) {
  const cosz = p.z
  const sinz = Math.sqrt(p.x ** 2 + p.y ** 2)
  const cosxy = sinz === 0 ? 1 : p.x / sinz
  const sinxy = sinz === 0 ? 0 : p.y / sinz
  const th = 2 * Math.PI * Math.random()
  const x = Math.cos(th)
  const y = Math.sin(th)
  const x2 = cosz * x
  const z2 = -sinz * x
  const x3 = x2 * cosxy - y * sinxy
  const y2 = x2 * sinxy + y * cosxy
  return { x: x3, y: y2, z: z2 }
}
function branchRandomCross(p: Point3D) {
  const crs = randomCross(p)
  const horizontal = cross(p, { x: 0, y: 0, z: 1 })
  const d = dot(crs, horizontal)
  const ratio = 4 * (1 + p.z) * (1 - p.z)
  return normalize({
    x: crs.x + ratio * d * horizontal.x,
    y: crs.y + ratio * d * horizontal.y,
    z: crs.z + ratio * d * horizontal.z
  })
}
function dir2rotation(dir: Point3D) {
  return {
    zrot: Math.acos(dir.z),
    xyrot: Math.atan2(dir.y, dir.x)
  }
}
export class Branch {
  _children: Branch[] | null = null
  length: number
  crs: Point3D
  sectionDrift: number
  constructor(public start: Point3D, public dir: Point3D, public age: number, public prev: { dir: Point3D, crs: Point3D }, public drift = 0) {
    this.dir = normalize(this.dir)
    this.dir.z -= 0.005
    if (this.dir.z < -0.1) this.dir.z = -0.1
    this.dir = normalize(this.dir)
    this.length = 0.06 * (1 + 0.04 * age)
    this.sectionDrift = this.length / (1 + this.age) ** 2 / 2
    const cdot = dot(prev.crs, this.dir)
    this.crs = normalize({
      x: prev.crs.x - cdot * this.dir.x,
      y: prev.crs.y - cdot * this.dir.y,
      z: prev.crs.z - cdot * this.dir.z
    })
  }
  get end() {
    const { start, dir, length } = this
    return {
      x: start.x + length * dir.x,
      y: start.y + length * dir.y,
      z: start.z + length * dir.z
    }
  }
  get children() {
    if (!this._children) {
      if (this.age === 0) return this._children = []
      const { x: dx, y: dy, z: dz } = this.dir
      const { x: cx, y: cy, z: cz } = branchRandomCross(this.dir)
      const c1 = 0.5 + 0.5 * Math.random()
      const c2 = -0.5 * Math.random() * (this.age % 3 === 1 ? 1 : 0.5)
      const d1 = { x: dx + c1 * cx, y: dy + c1 * cy, z: dz + c1 * cz }
      const d2 = { x: dx + c2 * cx, y: dy + c2 * cy, z: dz + c2 * cz }
      this._children = [new Branch(this.end, d2, this.age - 1, { dir: this.dir, crs: this.crs }, this.drift + this.sectionDrift)]
      if (this.age >= 3 && this.age % 3 === 1) this._children.push(new Branch(this.end, d1, this.age - 2, { dir: this.dir, crs: this.crs }, this.drift + this.sectionDrift))
    }
    return this._children
  }
  attributes(n: number, minAge: number, attributes: { positions: number[]; normals: number[]; drifts: number[] } = { positions: [], normals: [], drifts: [] }) {
    const { positions, normals, drifts } = attributes
    const { start, end, dir, age } = this
    if (age < minAge) return attributes
    const w1 = 0.0025 * (age + 1)
    const w2 = 0.0025 * age
    function rounds(point: Point3D, dir: Point3D, c: Point3D, r: number) {
      const s = cross(dir, c)
      return [...new Array(n)].map((_, i) => {
        const th = 2 * Math.PI * (i + (r === 0 ? 0.5 : 0)) / n
        const cos = Math.cos(th)
        const sin = Math.sin(th)
        return [
          {
            x: point.x + r * (c.x * cos + s.x * sin),
            y: point.y + r * (c.y * cos + s.y * sin),
            z: point.z + r * (c.z * cos + s.z * sin)
          },
          {
            x: c.x * cos + s.x * sin,
            y: c.y * cos + s.y * sin,
            z: c.z * cos + s.z * sin
          }
        ]
      })
    }
    const prevs = rounds(start, this.prev.dir, this.prev.crs, w1)
    const nexts = rounds(end, this.dir, this.crs, w2)
    prevs.forEach(([p, pn], i) => {
      const [q, qn] = prevs[(i + 1) % prevs.length]
      const [r, rn] = nexts[i]
      positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z)
      normals.push(pn.x, pn.y, pn.z, qn.x, qn.y, qn.z, rn.x, rn.y, rn.z)
      drifts.push(this.drift, this.drift, this.drift + this.sectionDrift)
    })
    if (w2 !== 0) {
      nexts.forEach(([p, pn], i) => {
        const [q, qn] = prevs[(i + 1) % prevs.length]
        const [r, rn] = nexts[(i + 1) % nexts.length]
        positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z)
        normals.push(pn.x, pn.y, pn.z, qn.x, qn.y, qn.z, rn.x, rn.y, rn.z)
        drifts.push(this.drift + this.sectionDrift, this.drift, this.drift + this.sectionDrift)
      })
    }
    this.children.forEach(c => c.attributes(n, minAge, attributes))
    return attributes
  }
  collectFlowerPositions(positions: FlowerPosition[] = []) {
    if (this.age <= 2) {
      const m = 2
      for (let n = 1; n < m; n++) {
        positions.push({
          start: {
            x: this.start.x + this.length * this.dir.x * n / m,
            y: this.start.y + this.length * this.dir.y * n / m,
            z: this.start.z + this.length * this.dir.z * n / m
          },
          ...dir2rotation(branchRandomCross(this.dir)),
          drift: this.drift + this.sectionDrift * n / m,
          index: positions.length
        })
      }
      if (this.children.length === 0) {
        positions.push({ start: this.end, ...dir2rotation(this.dir), drift: this.drift + this.sectionDrift, index: positions.length })
      }
    }
    this.children.forEach(c => c.collectFlowerPositions(positions))
    return positions
  }
}
const bparamlist = generateBouquetParamList(4)
const bouquets = generateBouquets(bparamlist)
const bouquetGeometries = bouquets.map(levels => levels.map(generateGeometry))
type Range = Record<'x' | 'y' | 'z', { min: number; max: number; size: number; center: number }>
type Section = { identifier: number; center: Point3D; radius: number; levelGeometries: BufferGeometry[]; positions: FlowerPosition[] }

function rotate({ x, y, z }: Point3D, axis: Point3D, angle: number) {
  let { x: ax, y: ay, z: az } = axis
  const ar = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2)
  ax /= ar
  ay /= ar
  az /= ar
  const theta = angle === undefined ? ar : angle
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const dot = x * ax + y * ay + z * az
  x -= dot * ax
  y -= dot * ay
  z -= dot * az
  const bx = y * az - z * ay
  const by = z * ax - x * az
  const bz = x * ay - y * ax
  return {
    x: dot * ax + x * cos - bx * sin,
    y: dot * ay + y * cos - by * sin,
    z: dot * az + z * cos - bz * sin
  }
}

function particleGeometryFromPositions(flowerPositions: FlowerPosition[], eachFlower: boolean) {
  const positions: number[] = []
  const sizes: number[] = []
  flowerPositions.forEach(({ start, xyrot, zrot, index, drift }) => {
    const bparams = bparamlist[index % bouquets.length]
    const stemLength = 0.075
    if (eachFlower) {
      bparams.forEach(bparam => {
        const p = rotate(
          { x: 0, y: 0, z: stemLength },
          { x: -Math.sin(bparam.xyrot), y: Math.cos(bparam.xyrot), z: 0 },
          bparam.zrot
        )
        const q = rotate(p, { x: -Math.sin(xyrot), y: Math.cos(xyrot), z: 0 }, zrot)
        positions.push(start.x + q.x, start.y + q.y, start.z + q.z)
        sizes.push(0.04)
      })
    } else {
      const p = rotate(
        { x: 0, y: 0, z: stemLength },
        { x: -Math.sin(xyrot), y: Math.cos(xyrot), z: 0 },
        zrot
      )
      positions.push(start.x + p.x, start.y + p.y, start.z + p.z)
      sizes.push(0.07)
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('size', new BufferAttribute(new Float32Array(sizes), 1))
  return geometry
}

function geometryFromPositions(positions: FlowerPosition[], level: number) {
  const attributes: FlowerAttributes = {
    positions: [],
    normals: [],
    coords: [],
    coordOffsets: [],
    drifts: []
  }
  positions.forEach(({ start, xyrot, zrot, index, drift }) => {
    const attrs = cloneAttributes(bouquets[index % bouquets.length][level])
    transformAttributes(attrs, { axis: { x: -Math.sin(xyrot), y: Math.cos(xyrot), z: 0 }, angle: zrot, translate: start, drift: drift })
    mergeAttributes(attributes, attrs)
  })
  const geometry = generateGeometry(attributes)
  const xs = positions.map(p => p.start.x)
  const ys = positions.map(p => p.start.y)
  const zs = positions.map(p => p.start.z)
  const xmin = Math.min(...xs), xmax = Math.max(...xs)
  const ymin = Math.min(...ys), ymax = Math.max(...ys)
  const zmin = Math.min(...zs), zmax = Math.max(...zs)
  const safe = 0.1
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3((xmin + xmax) / 2, (ymin + ymax) / 2, (zmin + zmax) / 2),
    Math.hypot(xmax - xmin, ymax - ymin, zmax - zmin) / 2 + safe
  )
  geometry.computeBoundingSphere()
  return geometry
}

import flowerParticleVertexShader from './shaders/flowerParticle.vert'
import flowerParticleFragmentShader from './shaders/flowerParticle.frag'
const flowerParticleMaterial = new THREE.ShaderMaterial({
  vertexShader: flowerParticleVertexShader,
  fragmentShader: flowerParticleFragmentShader,
  transparent: true
})


export class TreeFlower {
  range: Range
  pointGeometries: BufferGeometry[] = []
  triangleGeometries: BufferGeometry[] = []
  sections: Section[] = []
  constructor(public positions: FlowerPosition[]) {
    const xs = positions.map(p => p.start.x)
    const ys = positions.map(p => p.start.y)
    const zs = positions.map(p => p.start.z)
    const rangeOf = (a: number[]) => {
      const min = Math.min(...a)
      const max = Math.max(...a)
      return { min, max, size: max - min, center: (min + max) / 2 }
    }
    this.range = { x: rangeOf(xs), y: rangeOf(ys), z: rangeOf(zs) }
    this.pointGeometries = [false, true].map(detail => particleGeometryFromPositions(positions, detail))
    this.triangleGeometries = [0, 1].map(level => geometryFromPositions(positions, level))
    const segsize = 0.5
    const xsegs = Math.ceil((this.range.x.size) / segsize)
    const ysegs = Math.ceil((this.range.y.size) / segsize)
    const zsegs = Math.ceil((this.range.z.size) / segsize)
    const secs: (Section | undefined)[] = []
    const self = this
    ;(window as any).debug = (e: string) => eval(e)
    positions.forEach(pos => {
      const xi = Math.min(xsegs - 1, Math.floor((pos.start.x - this.range.x.min) * xsegs / this.range.x.size))
      const yi = Math.min(ysegs - 1, Math.floor((pos.start.y - this.range.y.min) * ysegs / this.range.y.size))
      const zi = Math.min(zsegs - 1, Math.floor((pos.start.z - this.range.z.min) * zsegs / this.range.z.size))
      const si = zi * xsegs * ysegs + yi * xsegs + xi
      let sec = secs[si]
      if (!sec) {
        secs[si] = sec = {
          identifier: si,
          center: {
            x: this.range.x.center,
            y: this.range.y.center,
            z: this.range.z.center
          },
          radius: Math.hypot(this.range.x.size / xsegs, this.range.y.size / ysegs, this.range.z.size / zsegs) / 2,
          levelGeometries: [],
          positions: []
        }
        this.sections.push(sec)
      }
      sec.positions.push(pos)
    })
  }
  update(scene: THREE.Scene, camera: THREE.Camera, material: THREE.ShaderMaterial, position: Point3D, oldMeshes: Map<string | BufferGeometry, THREE.Mesh | THREE.Points>, newMeshes: Map<string | BufferGeometry, THREE.Mesh | THREE.Points>) {
    const { x: cx, y: cy, z: cz } = camera.position
    const { x, y, z } = position
    const dist1d = ({ min, max }: { min: number, max: number }, cam: number) => (
      min < cam && cam < max ? 0 : Math.min(Math.abs(cam - min), Math.abs(cam - max))
    )
    const distance = Math.hypot(
      dist1d(this.range.x, cx - x),
      dist1d(this.range.y, cy - y),
      dist1d(this.range.z, cz - z)
    )
    const geometryOf = ({ positions, levelGeometries }: Section, level: number) => {
      const geometry = levelGeometries[level]
      if (geometry) return geometry
      return levelGeometries[level] = geometryFromPositions(positions, level)
    }
    const threshold0 = 0.5
    const threshold1 = 1
    const threshold2 = 2.5
    const threshold3 = 4
    const threshold4 = 7
    const threshold5 = 9
    const wind: Point3D = {
      x: material.uniforms.wind.value.x || 0,
      y: material.uniforms.wind.value.y || 0,
      z: material.uniforms.wind.value.z || 0,
    }
    const set = (geometry: BufferGeometry, material: THREE.Material, particle: boolean = false) => {
      let mesh = oldMeshes.get(geometry)
      if (!mesh) {
        mesh = particle ? new THREE.Points(geometry, material) : new THREE.Mesh(geometry, material)
        mesh.position.x = position.x
        mesh.position.y = position.y
        mesh.position.z = position.z
      }
      newMeshes.set(geometry, mesh)
    }
    if (distance > threshold5) {
      set(this.pointGeometries[0], flowerParticleMaterial, true)
    } else if (distance > threshold4) {
      set(this.pointGeometries[1], flowerParticleMaterial, true)
    } else if (distance > threshold3) {
      set(this.triangleGeometries[0], material)
    } else if (distance > threshold2) {
      set(this.triangleGeometries[1], material)
    } else {
      this.sections.forEach(section => {
        const { center, radius, positions } = section
        const distance = Math.hypot(cx - x - center.x, cy - y - center.y, cz - z - center.z)
        if (distance - radius > threshold3) {
          set(geometryOf(section, 0), material)
        } else if (distance - radius > threshold2) {
          set(geometryOf(section, 1), material)
        } else if (distance - radius > threshold1) {
          set(geometryOf(section, 2), material)
        } else {
          positions.forEach(({ start, xyrot, zrot, index, drift }) => {
            const distance = Math.hypot(cx - x - start.x, cy - y - start.y, cz - z - start.z)
            const level = distance < threshold0 ? 4 : distance < threshold1 ? 3 : 2
            const key = `${index}_${level}`
            let mesh = oldMeshes.get(key)
            if (!mesh) {
              mesh = new THREE.Mesh(bouquetGeometries[index % bouquetGeometries.length][level], material)
              mesh.rotateOnAxis(new THREE.Vector3(-Math.sin(xyrot), Math.cos(xyrot), 0), zrot)
            }
            mesh.position.x = x + start.x + drift * wind.x
            mesh.position.y = y + start.y + drift * wind.y
            mesh.position.z = z + start.z + drift * wind.z
            newMeshes.set(key, mesh)
          })
        }
      })
    }
    newMeshes.forEach((mesh, key) => {
      if (!oldMeshes.has(key)) scene.add(mesh)
    })
    oldMeshes.forEach((mesh, key) => {
      if (!newMeshes.has(key)) scene.remove(mesh)
    })
    oldMeshes = newMeshes
  }
}

export class TreeBase {
  branch: Branch
  flowers: TreeFlower
  constructor(age: number = Math.floor(12 + 12 * Math.random())) {
    this.branch = new Branch(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      age,
      {
        dir: { x: 0, y: 0, z: 1 },
        crs: { x: 1, y: 0, z: 0 },
      }
    )
    this.flowers = new TreeFlower(this.branch.collectFlowerPositions())
  }
  branchGeometries: BufferGeometry[] = []
  branchGeometry(level: number) {
    let geometry = this.branchGeometries[level]
    if (geometry) return geometry
    const n = [3, 6, 12, 24][level]
    const age = [6, 4, 2, 0][level]
    const attributes = this.branch.attributes(n, age)
    geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(attributes.positions), 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(attributes.normals), 3))
    geometry.setAttribute('drift', new THREE.BufferAttribute(new Float32Array(attributes.drifts), 1))
    return this.branchGeometries[level] = geometry
  }
}

import flowerVertexShader from './shaders/flower.vert'
import flowerFragmentShader from './shaders/flower.frag'
import treeVertexShader from './shaders/tree.vert'
import treeFragmentShader from './shaders/tree.frag'

import { createShadowedSakuraTexture } from './sakura'

const texture = new THREE.Texture(createShadowedSakuraTexture(512))
texture.magFilter = THREE.LinearFilter
texture.minFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat
texture.needsUpdate = true

export class Tree {
  flowerMeshes = new Map<string | BufferGeometry, THREE.Mesh | THREE.Points>()
  branchMesh: THREE.Mesh | null = null
  uniforms = {
    texture: { value: texture },
    wind: { value: new THREE.Vector3(0, 0, 0) }
  }
  flowerMaterial = new THREE.ShaderMaterial({
    vertexShader: flowerVertexShader,
    fragmentShader: flowerFragmentShader,
    uniforms: this.uniforms,
    side: THREE.DoubleSide
  })
  treeMaterial = new THREE.ShaderMaterial({
    vertexShader: treeVertexShader,
    fragmentShader: treeFragmentShader,
    uniforms: this.uniforms
  })
  windRandoms = [...new Array(6)].map(() => 1 + Math.random())
  constructor(public base: TreeBase, public position: Point3D) {}
  removeAll() {
    this.branchMesh?.remove()
    this.flowerMeshes.forEach(mesh => mesh.remove())
    this.flowerMeshes.clear()
    this.branchMesh = null
  }
  update(time: number, scene: Scene, camera: THREE.Camera) {
    const distance = Math.hypot(
      camera.position.x - this.position.x,
      camera.position.y - this.position.y,
      camera.position.z - this.position.z
    )
    if (distance > 16) {
      this.removeAll()
      return
    }
    this.uniforms.wind.value.x = (Math.sin(this.windRandoms[0] * time) - Math.sin(this.windRandoms[1] * time)) / 16
    this.uniforms.wind.value.z = (Math.sin(this.windRandoms[2] * time) - Math.sin(this.windRandoms[3] * time)) / 32
    this.uniforms.wind.value.y = (Math.sin(this.windRandoms[4] * time) - Math.sin(this.windRandoms[5] * time)) / 16
    const level = distance > 8 ? 0 : distance > 6 ? 1 : distance > 4 ? 2 : 3
    const branchGeometry = this.base.branchGeometry(level)
    if (!this.branchMesh || this.branchMesh.geometry !== branchGeometry) {
      this.branchMesh?.remove()
      this.branchMesh = new THREE.Mesh(branchGeometry, this.treeMaterial)
      this.branchMesh.position.x = this.position.x
      this.branchMesh.position.y = this.position.y
      this.branchMesh.position.z = this.position.z
      scene.add(this.branchMesh)
    }
    const newFlowerMeshes = new Map<string | BufferGeometry, THREE.Mesh | THREE.Points>()
    this.base.flowers.update(scene, camera, this.flowerMaterial, this.position, this.flowerMeshes, newFlowerMeshes)
    this.flowerMeshes = newFlowerMeshes
  }
}

export class Forest {
  panels = new Map<string, Tree[]>()
  panelSize = 4

  constructor(public bases: TreeBase[], public zfunc: (x: number, y: number) => number) {}
  update(time: number, scene: Scene, camera: THREE.Camera) {
    const { x: cx, y: cy, z: cz } = camera.position
    const x0 = Math.floor((cx - 16) / this.panelSize) * this.panelSize
    const y0 = Math.floor((cy - 16) / this.panelSize) * this.panelSize
    const existings = new Set<string>()
    for (let x = x0; x < cx + 16; x += this.panelSize) {
      for (let y = y0; y < cy + 16; y += this.panelSize) {
        const key = x + '_' + y
        existings.add(key)
        if (this.panels.has(key)) continue
        this.panels.set(key, this.createPanel(x, y))
      }
    }
    this.panels.forEach((trees, key) => {
      if (existings.has(key)) {
        trees.forEach(t => t.update(time, scene, camera))
      } else {
        this.panels.delete(key)
        trees.forEach(t => t.removeAll())
      }
    })
  }
  createPanel(px: number, py: number) {
    const trees: Tree[] = []
    for (let i = 0; i < 8; i++) {
      const a = Math.cos(1234 * px + 2345 * py + 3456 * i)
      const b = Math.cos(4567 * a + 5678 * px + 6789 * py)
      const x = px + this.panelSize * ((b + 1) * 1234 % 1)
      const y = py + this.panelSize * ((b + 1) * 2345 % 1)
      const z = this.zfunc(x, y) - 0.05
      if (z < 0) continue
      const idx = Math.floor(this.bases.length * ((b + 1) * 3456 % 1))
      trees.push(new Tree(this.bases[idx], { x, y, z }))
    }
    return trees
  }
}
