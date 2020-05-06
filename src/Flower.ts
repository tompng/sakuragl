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
      return [x3, y3, z2] as const

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
    const coord = ({ x, y }: Point2D) => {
      return [(x + 1) / 4 + (upShadow ? 1 : 0) / 2, (y + 1) / 4 + (downShadow ? 0 : 1) / 2]
      // return [(x + 1) / 2, (y + 1) / 2]
    }
    for (const [a, b, c] of triangles) {
      const offset = [upShadow ? 1 : 0, downShadow ? 0 : 1]
      coordOffsets.push(...offset, ...offset, ...offset)
      positions.push(...position(a), ...position(b), ...position(c))
      normals.push(...normal(a), ...normal(b), ...normal(c))
      coords.push(...coord(a), ...coord(b), ...coord(c))
    }
  }
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(coords), 2))
  geometry.setAttribute('offset', new BufferAttribute(new Int8Array(coordOffsets), 2))
  return geometry
}
