export type Point2D = { x: number; y: number }
export type Polar2D = { r: number ;th: number }
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
  for (let i = n - 1; i >= 0; i--) {
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
    const inner: Point2D[] = [];
    for (let j = 0; j <= n; j++) {
      const { x, y } = coords[n === 0 ? 0 : Math.round(j * (coords.length - 1) / n)]
      inner.push({ x: sakuraXOffset + r * (x - sakuraXOffset), y: r * y })
    }
    let a = 0, b = 0
    const tmp: any[] = []
    while (true) {
      if (a + 1 < outer.length && (b + 1 >= inner.length || (a + 1) / (outer.length - 1) < (b + 1) / (inner.length - 1))) {
        triangles.push([outer[a], inner[b], outer[a + 1]])
        tmp.push({ a1: a, a2: a + 1, b })
        a += 1
      } else if (b + 1 < inner.length) {
        triangles.push([inner[b], inner[b + 1], outer[a]])
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

export function createSakuraTexture(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const outline = sakuraOutline(128)
  const baseColor = '#fdd'
  ctx.scale(size, size)
  ctx.scale(0.5, 0.5)
  ctx.translate(1, 1)
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
  ctx.filter = "blur(2px)";
  ctx.globalAlpha = 0.5
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.beginPath()
  ctx.lineWidth = 0.01
  ctx.strokeStyle = baseColor
  outline.forEach(({ x, y }, i) => i == 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
  ctx.closePath()
  ctx.filter = "blur(4px)";
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(start.x, start.y, 0.4, 0, 2 * Math.PI)
  ctx.fillStyle = '#faa'
  ctx.filter = "blur(64px)";
  ctx.fill()

  canvas.style.boxShadow = '0 0 1px red'
  return canvas
}