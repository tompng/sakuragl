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

const sakuraTranslateX = 15 / 16
const deg = 20
const flwcos = Math.cos(Math.PI * deg / 180)
const flwsin = Math.sin(Math.PI * deg / 180)
export function generateRands() {
  return [...new Array(160)].map(() => Math.random())
}
type FlowerParams = {
  triangles: Triangle2D[] | null
  innerCount: number
  innerLevel: number
  stemLevel: number
  stemRLevel: number
}


export const FlowerLevels: FlowerParams[] = [
  {
    triangles: null,
    innerCount: 0,
    innerLevel: 0,
    stemLevel: 0,
    stemRLevel: 0
  },
  {
    triangles: TriangleLevels[0],
    innerCount: 0,
    innerLevel: 0,
    stemLevel: 0,
    stemRLevel: 0
  },
  {
    triangles: TriangleLevels[1],
    innerCount: 0,
    innerLevel: 0,
    stemLevel: 1,
    stemRLevel: 3
  },
  {
    triangles: TriangleLevels[2],
    innerCount: 16,
    innerLevel: 1,
    stemLevel: 5,
    stemRLevel: 3
  },
  {
    triangles: TriangleLevels[3],
    innerCount: 32,
    innerLevel: 4,
    stemLevel: 10,
    stemRLevel: 10
  },
]

export function generateGeometry({ triangles, innerCount, innerLevel, stemLevel, stemRLevel }: FlowerParams, rands: number[]) {
  const positions: number[] = []
  const normals: number[] = []
  const coords: number[] = []
  const coordOffsets: number[] = []
  const zlevels = [-2, 0, 2, -1, 1]
  const geometry = new BufferGeometry()
  let randIndex = 0
  const rand = () => rands[randIndex++]
  const sliceRand = (n: number) => rands.slice(randIndex, randIndex += n)
  const stemLength = 3.5 + rand()
  const rot = 2 * Math.PI * rand()
  if (!triangles) {
    const offset = [0, 0]
    const coord = [0.25, 0.25]
    const normal = [0, 0, 1]
    const r = 1.8
    const position = (i: number) => {
      const th = 2 * Math.PI * i / 3 + rot
      return [r * Math.cos(th), r * Math.sin(th), stemLength]
    }
    coordOffsets.push(...offset, ...offset, ...offset)
    positions.push(...position(0), ...position(1), ...position(2))
    normals.push(...normal, ...normal, ...normal)
    coords.push(...coord, ...coord, ...coord)
  }
  for (let i = 0; i < 5; i++) {
    if (!triangles) continue
    const zlevel = zlevels[i]
    const rotcos = Math.cos(Math.PI * 2 * i / 5 + rot)
    const rotsin = Math.sin(Math.PI * 2 * i / 5 + rot)
    const [cx1, cy1, rz1, cx2, cy2, rz2] = sliceRand(6).map(x => 2 * x - 1)
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
      return [x3, y3, z2 - 1 / 32 + stemLength] as const

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
    const r2 = stemLevel <= 2 ? r / (4 - stemLevel) : r
    return [r2, 1 / l, -r2 / l]
  }
  const stemBend = 0.5
  const stemZFrom = -stemLength
  const addStemPoint = (th: number, z: number) => {
    const [r, nr, nz] = rparam(z)
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    coordOffsets.push(0, 0)
    const b = z * (z - stemZFrom) / stemZFrom / stemZFrom
    positions.push(r * cos + stemBend * b, r * sin, z + stemLength)
    coords.push(z > 0 ? 0 : z ** 2 / 9, 1)
    normals.push(nr * cos, nr * sin, nz)
  }
  const stemZ = (t: number, m: number) => {
    return stemZFrom - stemZFrom * (5 * t / (1 + 4 * t)) + m * t / 8
  }
  for (let i = 0; i < stemRLevel; i++) {
    const th1 = 2 * Math.PI * i / stemRLevel + rot
    const th2 = 2 * Math.PI * (i + 1) / stemRLevel + rot
    for (let j = 0; j < stemLevel; j++) {
      const t1 = j / stemLevel
      const t2 = (j + 1) / stemLevel
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
  for (let i = 0 ;i < innerCount; i++) {
    const th = 2 * Math.PI * (i * 7 % 32) / 32 + rand() / 40
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const r = Math.sqrt(rand())
    const lth = 2 * Math.PI * rand()
    const rmin = 1 / 16
    const rrange = 1 / 3
    const len = 1 / 2 + rand() / 6
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
      const z1 = len * t1 + zoffset + stemLength
      const x2 = cos * r2
      const y2 = sin * r2
      const z2 = len * t2 + zoffset + stemLength
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
    for (let j = 0; j < innerLevel; j++) line(j / innerLevel, (j + 1) / innerLevel)
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(coords), 2))
  geometry.setAttribute('offset', new BufferAttribute(new Int8Array(coordOffsets), 2))
  return geometry
}

type BouquetParam = { x: number; y: number; z: number, xyrot: number, zrot: number }
export function bouquetParams(n: number, theta: number = Math.PI / 3, dtheta: number = Math.PI / 5, ntheta: number = Math.PI / 3) {
  const points: BouquetParam[] = []
  const zmin = Math.cos(theta)
  function randPoint() {
    const z = zmin + (1 - zmin) * Math.random()
    const xyrot = 2 * Math.PI * Math.random()
    const r = Math.sqrt(1 - z ** 2)
    const zrot = Math.acos(z)
    return { x: r * Math.cos(xyrot), y: r * Math.sin(xyrot), z, xyrot, zrot }
  }
  const dotMax = Math.cos(dtheta)
  const dotNear = Math.cos(ntheta)
  points.push(randPoint())
  let failCount = 0
  while (points.length < n) {
    const p = randPoint()
    const count = points.filter(q => p.x * q.x + p.y * q.y + p.z * q.z > dotNear).length
    if (points.every(q => p.x * q.x + p.y * q.y + p.z * q.z < dotMax) && count >= (points.length === 1 ? 1 : 2)) {
      points.push(p)
      failCount = 0
    } else {
      failCount++
      if (failCount > 32) break
    }
  }
  return points
}