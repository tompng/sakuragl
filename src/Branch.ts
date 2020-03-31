import { Random, interpolate } from './util'

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
  centerAt(t: number) {
    const { rscale, seriesX, seriesY } = this
    const scale = rscale * (t < 0 || t > 1 ? 0 : 16 * (t * (1 - t)) ** 2)
    return [
      scale * (interpolate(seriesX, t * seriesX.length) - seriesX[0]),
      scale * (interpolate(seriesY, t * seriesY.length) - seriesY[0])
    ]
  }
  generateVertices(rLevel: number, zLevel: number) {
    const vertices: number[] = []
    const { r1, r2, length } = this
    const add = (ta: number, tb: number, ra: number, rb: number) => {
      const [xa, ya] = this.centerAt(ta)
      const [xb, yb] = this.centerAt(tb)
      for (let i = 0; i < rLevel; i++) {
        const th1 = 2 * Math.PI * i / rLevel
        const th2 = 2 * Math.PI * (i + 1) / rLevel
        const c1 = Math.cos(th1), s1 = Math.sin(th1)
        const c2 = Math.cos(th2), s2 = Math.sin(th2)
        if (ra) vertices.push(
          xa + ra * c1, ya + ra * s1, length * ta,
          xa + ra * c2, ya + ra * s2, length * ta,
          xb + rb * c1, yb + rb * s1, length * tb
        )
        if (rb) vertices.push(
          xa + ra * c2, ya + ra * s2, length * ta,
          xb + rb * c2, yb + rb * s2, length * tb,
          xb + rb * c1, yb + rb * s1, length * tb
        )
      }
    }
    
    const n1 = Math.ceil(zLevel * r1 / length)
    const n2 = Math.ceil(zLevel * r2 / length)
    for (let j = 0; j < n1; j++) {
      const ua = j / n1
      const ub = (j + 1) / n1
      const ra = r1 * Math.sqrt(1 - ua * ua)
      const rb = r1 * Math.sqrt(1 - ub * ub)
      add(-ub * r1 / length, -ua * r1 / length, rb, ra)
    }
    for (let j = 0; j < zLevel; j++) {
      const ta = j / zLevel
      const tb = (j + 1) / zLevel
      const ra = r1 + (r2 - r1) * ta
      const rb = r1 + (r2 - r1) * tb
      add(ta, tb, ra, rb)
    }
    for (let j = 0; j < n2; j++) {
      const ua = j / n2
      const ub = (j + 1) / n2
      const ra = r2 * Math.sqrt(1 - ua * ua)
      const rb = r2 * Math.sqrt(1 - ub * ub)
      add(1 + ua * r2 / length, 1 + ub * r2 / length, ra, rb)
    }
    return vertices
  }
}
