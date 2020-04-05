export function sakuraRadius(th: number) {
  return 0.5 + th / 4 - 1 / 4 / (4 * th + 1) ** 4 + Math.cos(2 * th) / 10
}

export function sakuraHalfPolarCoords(n: number) {
  const coords: { r: number, th: number }[] = []
  for (let i = 0; i <= n; i++) {
    const th = Math.PI * (i / n) ** 1.25
    const r = sakuraRadius(th)
    coords.push({ r, th })
  }
  return coords
}

export function sakuraHalfOutline(n: number) {
  return sakuraHalfPolarCoords(n).map(({ r, th }) => ({
    x: 0.3 + r * Math.cos(th),
    y: r * Math.sin(th)
  }))
}

export function sakuraOutline(n: number) {
  const coords = sakuraHalfOutline(n)
  for (let i = n - 1; i > 0; i--) {
    const { x, y } = coords[i]
    coords.push({ x, y: -y })
  }
  return coords
}
