export type Point2D = { x: number; y: number }
export type Polar2D = { r: number ;th: number }
export type Triangle2D = [Point2D, Point2D, Point2D]
export function sakuraRadius(th: number) {
  return 0.5 + th / 4 - 1 / 4 / (4 * th + 1) ** 4 + Math.cos(2 * th) / 10
}

const sakuraXOffset = 0.3
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
