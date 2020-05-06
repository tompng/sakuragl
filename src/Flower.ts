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
import { Point2D, Triangle2D, TriangleLevels, createSakuraTexture } from './sakura'

type FlowerAttrs = number[]
const sakuraTranslateX = 15 / 16
const deg = 20
const flwcos = Math.cos(Math.PI * deg / 180)
const flwsin = Math.sin(Math.PI * deg / 180)
export function generateGeometry(attrs: FlowerAttrs, triangles: Triangle2D[], rot: number = 0) {
  const positions: number[] = []
  const normals: number[] = []
  const coords: number[] = []
  const coordOffsets: number[] = []
  const zlevels = [-2, 0, 2, -1, 1]
  const geometry = new BufferGeometry()
  for (let i = 0; i < 5; i++) {
    const zlevel = zlevels[i]
    const rotcos = Math.cos(Math.PI * 2 * i / 5 + rot)
    const rotsin = Math.sin(Math.PI * 2 * i / 5 + rot)
    const [cx1, cy1, rz1, cx2, cy2, rz2] = attrs.slice(6 * i, 6 * i + 6)
    const cc1 = Math.PI * rz1
    const cc2 = Math.PI * rz2
    const fz = ({ x, y }: Point2D) => {
      return 0.04 * (
        + Math.sin(6 * (cx1 * x + cy1 * y) + cc1)
        + Math.sin(6 * (cx2 * x + cy2 * y) + cc2)
        - Math.sin(cc1)
        - Math.sin(cc2)
      )
    }
    const position = (p: Point2D) => {
      const x = p.x + sakuraTranslateX
      const y = p.y
      const r = Math.sqrt(x ** 2 + y ** 2)
      const t = Math.abs(Math.atan2(y, x)) * 5 / Math.PI
      const fzscale = r * (t > 1 ? 0 : (1 - t ** 2) ** 2)
      const z = fzscale * fz(p) + zlevel / 32 * (1 - 1 / (1 + 8 * r)) + 0.1 * r ** 2
      const r2 = r * flwcos - z * flwsin
      const z2 = r * flwsin + z * flwcos
      const x2 = r2 * x / r
      const y2 = r2 * y / r
      const x3 = x2 * rotcos - y2 * rotsin
      const y3 = x2 * rotsin + y2 * rotcos
      return [x3, y3, z2 - 1 / 32] as const

    }
    const normal = ({ x, y }: Point2D) => {
      const d = 0.01
      const xp = position({ x: x + d, y })
      const xm = position({ x: x - d, y })
      const yp = position({ x, y: y + d })
      const ym = position({ x, y: y - d })
      const a = xp.map((v, i) => v - xm[i])
      const b = yp.map((v, i) => v - ym[i])
      const nx = a[1] * b[2] - a[2] * b[1]
      const ny = a[2] * b[0] - a[0] * b[2]
      const nz = a[0] * b[1] - a[1] * b[0]
      const nr = Math.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
      return [nx / nr, ny / nr, nz / nr] as const
    }
    const upShadow = zlevels[(i + 1) % 5] > zlevel
    const downShadow = zlevels[(i + 4) % 5] > zlevel
    const coord = ({ x, y }: Point2D) => [(x + 2) / 4, (y + 2) / 4]
    const offset = [upShadow ? 1 : -1, downShadow ? -1 : 1]
    for (const [a, b, c] of triangles) {
      coordOffsets.push(...offset, ...offset, ...offset)
      positions.push(...position(a), ...position(b), ...position(c))
      normals.push(...normal(a), ...normal(b), ...normal(c))
      coords.push(...coord(a), ...coord(b), ...coord(c))
    }
  }
  const rparam = (z: number) => {
    const e = Math.exp(-16 * (z + 1))
    const e2 = Math.exp(8 * z)
    const r = (z + 6) / 80 + 1 / (1 + e) / 8 + e2 / 8
    const d = 1 / 80 + 2 * e / (1 + e) ** 2 + e2
    const l = Math.sqrt(1 + d ** 2)
    return [r, 1 / l, -r / l]
  }
  const stemBend = 0.5
  const stemZFrom = -3
  const addStemPoint = (th: number, z: number) => {
    const [r, nr, nz] = rparam(z)
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    coordOffsets.push(0, 0)
    positions.push(r * cos -stemBend * z * (z - stemZFrom) / stemZFrom / stemZFrom, r * sin, z)
    coords.push(z > 0 ? 0 : z ** 2 / 9, 1)
    normals.push(nr * cos, nr * sin, nz)
  }
  const stemZ = (t: number, m: number) => {
    return stemZFrom - stemZFrom * (5 * t / (1 + 4 * t)) + m * t / 8
  }
  for (let i = 0; i < 10; i++) {
    const th1 = 2 * Math.PI * i / 10 + rot
    const th2 = 2 * Math.PI * (i + 1) / 10 + rot
    for (let j = 0; j < 10; j++) {
      const t1 = j / 10
      const t2 = (j + 1) / 10
      const m1 = i % 2
      const m2 = 1 - m1
      addStemPoint(th1, stemZ(t1, m1))
      addStemPoint(th2, stemZ(t1, m2))
      addStemPoint(th2, stemZ(t2, m2))
      addStemPoint(th1, stemZ(t1, m1))
      addStemPoint(th2, stemZ(t2, m2))
      addStemPoint(th1, stemZ(t2, m1))
    }
  }
  for (let i = 0 ;i < 32; i++) {
    const th = 2 * Math.PI * i / 32 + Math.random() / 40
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const r = Math.sqrt(Math.random())
    const lth = 2 * Math.PI * Math.random()
    const rmin = 1 / 16
    const rrange = 1 / 3
    const len = 1 / 2 + Math.random() / 6
    const lw = 1 / 64
    const lc = lw * Math.cos(lth) / 2
    const ls = lw * Math.sin(lth) / 2
    const zoffset = -1 / 32
    const add = (x: number, y: number, z: number, t: number) => {
      coordOffsets.push(0, 0)
      positions.push(x, y, z)
      coords.push(t, 0)
      normals.push(0, 0, 0)
    }
    const line = (t1: number, t2: number) => {
      const r1 = r * (rmin + rrange * (t1 + t1 * (1 - t1) / 2))
      const r2 = r * (rmin + rrange * (t2 + t2 * (1 - t2) / 2))
      const x1 = cos * r1
      const y1 = sin * r1
      const z1 = len * t1 + zoffset
      const x2 = cos * r2
      const y2 = sin * r2
      const z2 = len * t2 + zoffset
      add(x1 - lc, y1 - ls, z1, t1)
      add(x1 + lc, y1 + ls, z1, t1)
      add(x2 + lc, y2 + ls, z2, t2)
      add(x1 - lc, y1 - ls, z1, t1)
      add(x2 + lc, y2 + ls, z2, t2)
      add(x2 - lc, y2 - ls, z2, t2)
      add(x1 + ls, y1 - lc, z1, t1)
      add(x1 - ls, y1 + lc, z1, t1)
      add(x2 - ls, y2 + lc, z2, t2)
      add(x1 + ls, y1 - lc, z1, t1)
      add(x2 - ls, y2 + lc, z2, t2)
      add(x2 + ls, y2 - lc, z2, t2)
    }
    for (let j = 0; j < 4; j++) line(j / 4, (j + 1) / 4)
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(coords), 2))
  geometry.setAttribute('offset', new BufferAttribute(new Int8Array(coordOffsets), 2))
  return geometry
}
