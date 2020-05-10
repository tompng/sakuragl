import {
  BufferGeometry,
  BufferAttribute,
} from 'three'
import * as THREE from 'three'
import { generateBouquets, generateGeometry, transformAttributes } from './Flower'

type Point3D = { x: number; y: number; z: number }
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
  constructor(public start: Point3D, public dir: Point3D, public age: number) {
    this.dir = normalize(this.dir)
    this.dir.z -= 0.05
    if (this.dir.z < -0.1) this.dir.z = -0.1
    this.dir = normalize(this.dir)
    this.length = 0.2 * (1 + age / 20)
    if (age <= 1) this.length = 0.5
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
      if (this.age <= 1) return this._children = []
      const { x: dx, y: dy, z: dz } = this.dir
      const { x: cx, y: cy, z: cz } = branchRandomCross(this.dir)
      const c1 = 0.5 + 0.5 * Math.random()
      const c2 = -0.5 * Math.random()
      const d1 = { x: dx + c1 * cx, y: dy + c1 * cy, z: dz + c1 * cz }
      const d2 = { x: dx + c2 * cx, y: dy + c2 * cy, z: dz + c2 * cz }
      this._children = [
        new Branch(this.end, d1, this.age - 2),
        new Branch(this.end, d2, this.age - 1)
      ]
    }
    return this._children
  }
  positions(positions: number[] = []) {
    const { start, end, dir, age } = this
    const a = randomCross(dir)
    const b = cross(dir, a)
    const w1 = 0.01 * Math.max(1, age)
    const w2 = 0.01 * Math.max(0, age - 1)
    ;[a, b].forEach(c => positions.push(
      start.x - w1 * c.x, start.y - w1 * c.y, start.z - w1 * c.z,
      start.x + w1 * c.x, start.y + w1 * c.y, start.z + w1 * c.z,
      end.x + w2 * c.x, end.y + w2 * c.y, end.z + w2 * c.z,
      start.x - w1 * c.x, start.y - w1 * c.y, start.z - w1 * c.z,
      end.x + w2 * c.x, end.y + w2 * c.y, end.z + w2 * c.z,
      end.x - w2 * c.x, end.y - w2 * c.y, end.z - w2 * c.z,
    ))
    this.children.forEach(c => c.positions(positions))
    return positions
  }
  collectFlowerPositions(positions: { start: Point3D, xyrot: number, zrot: number }[] = []) {
    if (this.age <= 1) {
      const m = 3
      for (let n = 1; n < m; n++) {
        positions.push({
          start: {
            x: this.start.x + this.length * this.dir.x * n / m,
            y: this.start.y + this.length * this.dir.y * n / m,
            z: this.start.z + this.length * this.dir.z * n / m
          },
          ...dir2rotation(branchRandomCross(this.dir))
        })
      }
      if (this.children.length === 0) {
        positions.push({ start: this.end, ...dir2rotation(this.dir) })
      }
    }
    this.children.forEach(c => c.collectFlowerPositions(positions))
    return positions
  }
}
