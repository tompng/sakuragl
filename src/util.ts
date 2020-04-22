type N3 = [number, number, number]

export function cross([x1, y1, z1]: N3, [x2, y2, z2]: N3): N3 {
  return [
    y1 * z2 - y2 * z1,
    z1 * x2 - z2 * x1,
    x1 * y2 - x2 * y1
  ]
}

export function normalize([x, y, z]: N3): N3 {
  const r = Math.sqrt(x * x + y * y + z * z)
  return [x / r, y / r, z / r]
}

export function interpolate(arr: number[], t: number) {
  t = (t % arr.length + arr.length) % arr.length
  const ti = Math.floor(t)
  t -= ti
  return arr[ti % arr.length] * (1 - t) + t * arr[(ti + 1) % arr.length]
}

export function periodicSmooth(array: number[], scale: number) {
  const size = array.length
  const out = new Array(size).fill(0)
  let weight = 0
  for (let k = 0; k < 2; k++) {
    const ex = Math.exp(-(k + 1) / scale)
    const exs = 1 / (1 - ex ** size)
    const c = 2 - 3 * k
    weight += (2 / (1 - ex) - 1) * c
    let s = 0
    for (let i = 0; i < size; i++) s = s * ex + array[i]
    s *= exs
    for (let i = 0; i < size; i++) out[i] += c * (s = s * ex + array[i])
    s = 0
    for (let i = size - 1; i >= 0; i--) s = s * ex + array[i]
    s *= exs
    for (let i = size - 1; i >= 0; i--) {
      out[i] += c * (s *= ex)
      s += array[i]
    }
  }
  for (let i = 0; i < size; i++) out[i] /= weight
  return out
}

export class Random {
  y: number
  constructor(seed?: number) {
    this.y = Math.floor(seed || 0) || Math.floor(1 + 0x7fffffff * Math.random())
  }
  next() {
    return this.y = (48271 * this.y) % 0x7fffffff
  }
  int(n: number) {
    return this.next() % n
  }
  float() {
    return 2 * this.next() / 0x7fffffff - 1
  }
  float01() {
    return this.next() / 0x7fffffff
  }
  smooth(n: number, scale = 10) {
    const base: number[] = []
    for (let i = 0; i < n; i++) base[i] = this.float()
    const out = periodicSmooth(base, scale)
    let sum = 0
    out.forEach(v => { sum += v })
    const avg = sum / n
    let sum2 = 0
    for (let i = 0; i < n; i++) {
      const v = out[i] - avg
      out[i] = v
      sum2 += v * v
    }
    const vscale = 1 / Math.sqrt(sum2 / n)
    for (let i = 0; i < n; i++) out[i] *= vscale
    return out
  }
}

;(window as any).Random = Random