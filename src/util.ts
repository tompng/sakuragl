export class Random {
  y: number
  constructor(seed = 0x7fffffff * Math.random()) {
    this.y = Math.floor(seed) || 1
  }
  next() {
    return this.y = (48271 * this.y) % 0x7fffffff
  }
  int(n) {
    return this.next() % n
  }
  float() {
    return 2 * this.next() / 0x7fffffff - 1
  }
  float01() {
    return this.next() / 0x7fffffff
  }
  smooth(n: number, e0 = 0.9) {
    const base = []
    const out = []
    for (let i = 0; i < n; i++) {
      base[i] = this.float()
      out[i] = 0
    }
    let s = 0
    for (let k = 0; k < 2; k++) {
      const e = e0 ** (k + 1)
      const scale = 1 / (1 - e ** n)
      const c = 2 - 3 * k
      let s = 0
      for (let i = 0; i < n; i++) s = s * e + base[i]
      s *= scale
      for (let i = 0; i < n; i++) out[i] += c * (s = s * e + base[i])
      s = 0
      for (let i = n - 1; i >= 0; i--) s = s * e + base[i]
      s *= scale
      for (let i = n - 1; i >= 0; i--) {
        out[i] += c * (s *= e)
        s += base[i]
      }
    }
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