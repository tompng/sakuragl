import {
  BufferGeometry,
  BufferAttribute,
} from 'three'
import { Point2D, Triangle2D, TriangleLevels } from './sakura'

type Point3D = { x: number; y: number; z: number }

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

type FlowerAttributes = {
  positions: number[]
  normals: number[]
  coords: number[]
  coordOffsets: number[]
}

export function generateAttributes({ triangles, innerCount, innerLevel, stemLevel, stemRLevel }: FlowerParams, rands: number[]): FlowerAttributes {
  const positions: number[] = []
  const normals: number[] = []
  const coords: number[] = []
  const coordOffsets: number[] = []
  const zlevels = [-2, 0, 2, -1, 1]
  let randIndex = 0
  const rand = () => rands[randIndex++]
  const sliceRand = (n: number) => rands.slice(randIndex, randIndex += n)
  const stemLength = 3.5 + 0.5 * rand()
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
      const tratio = stemRLevel >= 10 ? 1 : 0.9
      const t1 = j / stemLevel * tratio
      const t2 = (j + 1) / stemLevel * tratio
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
  return { positions, normals, coords, coordOffsets }
}

export function generateGeometry({ positions, normals, coords, coordOffsets }: FlowerAttributes) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(coords), 2))
  geometry.setAttribute('offset', new BufferAttribute(new Int8Array(coordOffsets), 2))
  return geometry
}

export function cloneAttributes(attributes: FlowerAttributes) {
  return {
    positions: [...attributes.positions],
    normals: [...attributes.normals],
    coords: [...attributes.coords],
    coordOffsets: [...attributes.coordOffsets]
  }
}

export function mergeAttributes(base: FlowerAttributes, adds: FlowerAttributes) {
  base.positions.push(...adds.positions)
  base.normals.push(...adds.normals)
  base.coords.push(...adds.coords)
  base.coordOffsets.push(...adds.coordOffsets)
}

export function transformAttributes(attributes: { positions: number[], normals: number[] }, transform: { axis?: Point3D, angle?: number, translate?: Point3D }) {
  const { positions, normals } = attributes
  const { axis, angle, translate } = transform
  if (axis) {
    let { x: ax, y: ay, z: az } = axis
    const ar = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2)
    ax /= ar
    ay /= ar
    az /= ar
    const theta = angle === undefined ? ar : angle
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const rotate = (array: number[]) => {
      for (let i = 0; i < array.length; i+= 3) {
        let x = array[i]
        let y = array[i + 1]
        let z = array[i + 2]
        const dot = x * ax + y * ay + z * az
        x -= dot * ax
        y -= dot * ay
        z -= dot * az
        const bx = y * az - z * ay
        const by = z * ax - x * az
        const bz = x * ay - y * ax
        array[i] = dot * ax + x * cos - bx * sin
        array[i + 1] = dot * ay + y * cos - by * sin
        array[i + 2] = dot * az + z * cos - bz * sin
      }
    }
    rotate(positions)
    rotate(normals)
  }
  if (translate) {
    const { x, y, z } = translate
    for (let i = 0; i < positions.length; i+= 3) {
      positions[i] += x
      positions[i + 1] += y
      positions[i + 2] += z
    }
  }
}

type BouquetParam = { x: number; y: number; z: number, xyrot: number, zrot: number }
export function bouquetParams(n: number, theta: number = Math.PI * 2 / 5, dtheta: number = Math.PI / 4): BouquetParam[] {
  const points: Point3D[] = []
  const randratio = 1.2
  const dlength = 2 * Math.sin(dtheta / 2)
  let zn = Math.floor(Math.PI / dtheta * randratio)
  for (let i = 0; i <= zn; i++ ) {
    const randz = (Math.PI / zn - dtheta) / 2
    const zthbase = Math.PI * i / zn
    const zthrange = Math.PI / zn - dtheta
    const rmin = Math.sin(zthbase < Math.PI ? zthbase - zthrange : zthbase + zthrange)
    let xyn = 1
    let xythrange = 0
    if (dlength / rmin / 2 <= 1) {
      const drtheta = 2 * Math.asin(dlength / rmin / 2)
      xyn = Math.floor(2 * Math.PI / drtheta * randratio)
      xythrange = 2 * Math.PI / xyn - drtheta
    }
    const xyth0 = 2 * Math.PI * Math.random()
    for (let j = 0; j < xyn; j++) {
      const zth = zthbase + zthrange * (Math.random() - 0.5)
      const xyth = xyth0 + 2 * Math.PI * j / xyn + xythrange * Math.random()
      const z = Math.cos(zth)
      const r = Math.sin(zth)
      points.push({ x: r * Math.cos(xyth), y: r * Math.sin(xyth), z })
    }
  }
  const rotx = 2 * Math.PI * Math.random()
  const rotz = 2 * Math.PI * Math.random()
  const cosx = Math.cos(rotx), sinx = Math.sin(rotx)
  const cosz = Math.cos(rotz), sinz = Math.sin(rotz)
  return points.map(p => {
    const _y = p.y * cosx - p.z * sinx
    const z = p.y * sinx + p.z * cosx
    const x = p.x * cosz - _y * sinz
    const y = p.x * sinz + _y * cosz
    return { x, y, z, xyrot: Math.atan2(x, y), zrot: Math.acos(z) }
  }).filter(p => p.zrot < theta).slice(0, n)
}

export function generateBouquets(n: number) {
  const randsList = [...new Array(16)].map(generateRands)
  const flowerAttributeLevels = FlowerLevels.map(params =>
    randsList.map(rands => generateAttributes(params, rands))
  )
  return [...new Array(n)].map(() => {
    const bparams = bouquetParams(6 + 4 * Math.random())
    const flowerIndices = bparams.map(() => Math.floor(randsList.length * Math.random()))
    return FlowerLevels.map((_, level) => {
      const attributes: FlowerAttributes = {
        normals: [],
        positions: [],
        coords: [],
        coordOffsets: []
      }
      bparams.forEach((bparam, i) => {
        const attrs = cloneAttributes(flowerAttributeLevels[level][flowerIndices[i]])
        transformAttributes(attrs,
          {
            axis: { x: -Math.sin(bparam.xyrot), y: Math.cos(bparam.xyrot), z: 0 },
            angle: bparam.zrot
          }
        )
        mergeAttributes(attributes, attrs)
      })
      return attributes
    })
  })
}
