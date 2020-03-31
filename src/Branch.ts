import { Random, interpolate, cross, normalize } from './util'

type BranchProps = {
  r1: number
  r2: number
  length: number
  rscale: number
  seed?: number
}

export class Branch {
  r1: number
  r2: number
  length: number
  rscale: number
  seriesX: number[]
  seriesY: number[]
  constructor({ r1, r2, length, rscale, seed }: BranchProps) {
    this.r1 = r1
    this.r2 = r2
    this.length = length
    this.rscale = rscale
    const rand = new Random(seed)
    this.seriesX = rand.smooth(128)
    this.seriesY = rand.smooth(128)
  }
  centerAt(t: number): [number, number] {
    const { rscale, seriesX, seriesY } = this
    const scale = rscale * (t < 0 || t > 1 ? 0 : 16 * (t * (1 - t)) ** 2)
    return [
      scale * (interpolate(seriesX, t * seriesX.length) - seriesX[0]),
      scale * (interpolate(seriesY, t * seriesY.length) - seriesY[0])
    ]
  }
  generateCoords(rLevel: number, zLevel: number): [number[], number[]] {
    const vertices: number[] = []
    const normals: number[] = []
    const { r1, r2, length } = this
    const n1 = Math.ceil(zLevel * r1 / length)
    const n2 = Math.ceil(zLevel * r2 / length)
    const zs: [number, number, number, number][] = []
    for (let j = n1; j > 0; j--) {
      const t = j / n1
      const r = r1 * Math.sqrt(1 - t * t)
      zs.push([0, 0, -t * r1, r])
    }
    for (let j = 0; j <= zLevel; j++) {
      const t = j / zLevel
      const [x, y] = this.centerAt(t)
      zs.push([x, y, length * t, r1 + (r2 - r1) * t])
    }
    for (let j = 1; j <= n2; j++) {
      const t = j / n2
      const r = r2 * Math.sqrt(1 - t * t)
      zs.push([0, 0, length + t * r2, r])
    }
    const vs: [number, number][] = []
    for (let i = 0; i < rLevel; i++) {
      const th = 2 * Math.PI * i / rLevel
      vs.push([Math.cos(th), Math.sin(th)])
    }
    type Ring = [number, number, number, number, number, number][]
    let ring: Ring | null = null
    zs.forEach(([x, y, z, r], zidx) => {
      const prev = ring
      if (r === 0) {
        ring = [[x, y, z, 0, 0, zidx ? +1 : -1]]
      } else {
        ring = vs.map(([cos, sin]) => {
          const [xp, yp, zp, rp] = zs[zidx - 1] || zs[zidx]
          const [xn, yn, zn, rn] = zs[zidx + 1] || zs[zidx]
          const [nx, ny, nz] = normalize(cross(
            [-sin, cos, 0],
            [
              (xn - xp) + (rn - rp) * cos,
              (yn - yp) + (rn - rp) * sin,
              zn - zp
            ]
          ))
          return [x + r * cos, y + r * sin, z, nx, ny, nz]
        })
      }
      if (!prev) return
      for (let i = 0; i < rLevel; i++) {
        const [x0, y0, z0, nx0, ny0, nz0] = prev[i % prev.length]
        const [x1, y1, z1, nx1, ny1, nz1] = prev[(i + 1) % prev.length]
        const [x2, y2, z2, nx2, ny2, nz2] = ring[i % ring.length]
        const [x3, y3, z3, nx3, ny3, nz3] = ring[(i + 1) % ring.length]
        if (prev.length !== 1) {
          vertices.push(x0, y0, z0, x1, y1, z1, x2, y2, z2)
          normals.push(nx0, ny0, nz0, nx1, ny1, nz1, nx2, ny2, nz2)
        }
        if (ring.length !== 1) {
          vertices.push(x1, y1, z1, x3, y3, z3, x2, y2, z2)
          normals.push(nx1, ny1, nz1, nx3, ny3, nz3, nx2, ny2, nz2)
        }
      }
    })
    if (r2 === 0)(window as any).foo = zs
    return [vertices, normals]
  }
}
