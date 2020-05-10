export type Point2D = { x: number; y: number }
export type Polar2D = { r: number; th: number }
export type Triangle2D = [Point2D, Point2D, Point2D]
export function sakuraRadius(th: number) {
  return 0.5 + th / 5 - 1 / 4 / (4 * th + 1) ** 4 + Math.cos(2 * th) / 10
}

const sakuraXOffset = 0.35
export function sakuraHalfPolarCoords(n: number): Polar2D[] {
  const coords: Polar2D[] = []
  for (let i = 0; i <= n; i++) {
    const th = Math.PI * (i / n) ** 1.25
    const r = sakuraRadius(th)
    coords.push({ r, th })
  }
  return coords
}

export function sakuraHalfOutline(n: number): Point2D[] {
  return sakuraHalfPolarCoords(n).map(({ r, th }) => ({
    x: sakuraXOffset + r * Math.cos(th),
    y: r * Math.sin(th)
  }))
}

export function sakuraOutline(n: number): Point2D[] {
  const coords = sakuraHalfOutline(n)
  for (let i = n - 1; i > 0; i--) {
    const { x, y } = coords[i]
    coords.push({ x, y: -y })
  }
  return coords
}

export function sakuraOutlineTriangles(n: number): Triangle2D[] {
  const outline = sakuraOutline(n)
  const triangles: Triangle2D[] = []
  for (let i = 1; i < outline.length - 1; i++) {
    triangles.push([outline[0], outline[i], outline[i + 1]])
  }
  return triangles
}

export function sakuraTriangles(nRadial: number, nInner: number, nOuter: number = nInner): Triangle2D[] {
  const coords: Point2D[] = sakuraOutline(nOuter)
  const triangles: Triangle2D[] = []
  let outer = coords
  for (let i = nRadial - 1; i >= 0; i--) {
    let n = Math.ceil(i * nInner / nRadial) * 2
    if (n <= 4 && i > 0) continue
    const r = i / nRadial
    const inner: Point2D[] = []
    for (let j = 0; j <= n; j++) {
      const { x, y } = coords[n === 0 ? 0 : Math.round(j * (coords.length - 1) / n)]
      inner.push({ x: sakuraXOffset + r * (x - sakuraXOffset), y: r * y })
    }
    let a = 0, b = 0
    const tmp: any[] = []
    while (true) {
      if (a + 1 < outer.length && (b + 1 >= inner.length || (a + 1) / (outer.length - 1) < (b + 1) / (inner.length - 1))) {
        triangles.push([inner[b], outer[a], outer[a + 1]])
        tmp.push({ a1: a, a2: a + 1, b })
        a += 1
      } else if (b + 1 < inner.length) {
        triangles.push([inner[b + 1], inner[b], outer[a]])
        tmp.push({ a, b1: b, b2: b + 1 })
        b += 1
      } else {
        break
      }
    }
    if (r === 0) break
    outer = inner
  }
  return triangles
}

export function renderSakura(ctx: CanvasRenderingContext2D, size: number, upShadow = false, downShadow = false) {
  const outline = sakuraOutline(128)
  const baseColor = '#fdd'
  ctx.save()
  ctx.fillStyle = baseColor
  ctx.fillRect(-1, -1, 2, 2)
  const start = { x: sakuraXOffset - sakuraRadius(Math.PI), y: 0 }
  const lmin = 0.1
  const lvary = 0.1
  const vdist = 0.1
  function includes({ x, y }: Point2D) {
    const x2 = x - sakuraXOffset
    const r = Math.sqrt(x2 ** 2 + y ** 2)
    const th = Math.atan2(Math.abs(y), x - sakuraXOffset)
    return r < sakuraRadius(th)
  }
  function outlinePath() {
    ctx.beginPath()
    outline.forEach(({ x, y }, i) => i == 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
    ctx.closePath()
  }
  function vein(p: Point2D, t1: number, t2: number, r: number, ac: [Point2D, Point2D][]) {
    const l0 = vdist / (t2 - t1) - r
    const r2 = r + Math.max(l0, lmin) + lvary * Math.random()
    const th = t1 + (t2 - t1) * Math.random()
    const q = { x: start.x + r2 * Math.cos(th), y: r2 * Math.sin(th) }
    if (includes(q)) {
      ac.push([p, q])
      const tc = ((t1 + t2) / 2 + th) / 2
      vein(q, t1, tc, r2, ac)
      vein(q, tc, t2, r2, ac)
    } else {
      let r3 = r2
      let q3 = q
      while (r3 > r) {
        r3 -= 0.01
        const q4 = { x: start.x + r3 * Math.cos(th), y: r3 * Math.sin(th) }
        if (includes(q4)) {
          ac.push([p, q3])
          break
        }
        q3 = q4
      }
    }
  }
  const veins: [Point2D, Point2D][] = []
  const n = 4
  const range = 5 / 12 * Math.PI
  for (let i = 0; i < n; i++) {
    const t1 = 2 * range * i / n - range
    const t2 = 2 * range * (i + 1) / n - range
    vein(start, t1, t2, 0, veins)
  }
  ctx.save()
  ctx.beginPath()
  veins.forEach(([p, q]) => {
    const dx = q.x - p.x
    const dy = q.y - p.y
    ctx.moveTo(p.x, p.y)
    const a = 0.1 * (2 * Math.random() - 1)
    const b = 0.1 * (2 * Math.random() - 1)
    ctx.bezierCurveTo(
      p.x + dx / 3 + a * dy,
      p.y + dy / 3 - a * dx,
      p.x + dx * 2/ 3 + b * dy,
      p.y + dy * 2/ 3 - b * dx,
      q.x, q.y
    )
  })
  ctx.lineWidth = 0.01
  ctx.strokeStyle = 'white'
  ctx.lineCap = ctx.lineJoin = 'round'
  ctx.filter = `blur(${2 * size / 512}px)`
  ctx.globalAlpha = 0.5
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.lineWidth = 0.01
  ctx.strokeStyle = baseColor
  outlinePath()
  ctx.filter = `blur(${4 * size / 512}px)`
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(start.x, start.y, 0.4, 0, 2 * Math.PI)
  ctx.fillStyle = '#faa'
  ctx.filter = `blur(${64 * size / 512}px)`
  ctx.fill()

  ctx.restore()

  ;[upShadow, downShadow].forEach((shadow, i) => {
    if (!shadow) return
    ctx.save()
    ctx.translate(-15 / 16, 0)
    ctx.rotate(2 * Math.PI / 5 * (2 * i - 1))
    ctx.translate(1, 0)
    ctx.fillStyle = 'black'
    outlinePath()
    ctx.globalAlpha = 0.25
    ctx.filter = `blur(${16 * size / 512}px)`
    ctx.fill()
    ctx.restore()
  })
  ctx.restore()
}

export function createShadowedSakuraTexture(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.save()
  ctx.scale(size, size)
  for (let i = 0; i < 4; i++) {
    ctx.save()
    ctx.translate(1 / 4 + i % 2 / 2, 1 / 4 + (i - i % 2) / 4)
    ctx.scale(1 / 4, 1 / 4)
    ctx.beginPath()
    ctx.rect(-1, -1, 3, 2)
    ctx.clip()
    renderSakura(ctx, size / 2, i % 2 === 1, i >= 2)
    ctx.restore()
  }
  ctx.restore()
  const stemGradient = ctx.createLinearGradient(0, 0, size, 0)
  stemGradient.addColorStop(0, '#d44')
  stemGradient.addColorStop(1 / 4, '#882')
  stemGradient.addColorStop(7 / 8, '#241')
  stemGradient.addColorStop(1, '#221')
  ctx.fillStyle = stemGradient
  ctx.fillRect(0, 0, size, size / 64)

  const innerGradient = ctx.createLinearGradient(0, 0, size, 0)
  innerGradient.addColorStop(0, '#fcc')
  innerGradient.addColorStop(3 / 4, '#fcc')
  innerGradient.addColorStop(1, '#ff8')
  ctx.fillStyle = innerGradient
  ctx.fillRect(0, size, size, -size / 64)
  return canvas
}

export function createSakuraTexture(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.scale(size, size)
  ctx.scale(0.5, 0.5)
  ctx.translate(1, 1)
  renderSakura(ctx, size)
  return canvas
}

const T2A: Triangle2D = [{ x: 0.8, y: 0 }, { x: 0.1, y: 0.8 }, { x: -8 / 9, y: 0 }]
const T2B: Triangle2D = [T2A[2], { x: T2A[1].x, y: -T2A[1].y }, T2A[0]]
export const TriangleLevels: [Triangle2D[], Triangle2D[], Triangle2D[], Triangle2D[]] = [
  [T2A, T2B],
  sakuraOutlineTriangles(5),
  sakuraTriangles(3, 5, 12),
  sakuraTriangles(6, 10, 24)
]
