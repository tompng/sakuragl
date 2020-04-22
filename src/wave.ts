import { periodicSmooth } from './util'

export function create2DWave(size: number, scale: number) {
  const out: number[][] = []
  for (let i = 0; i < size; i++) {
    const line: number[] = []
    for (let j = 0; j < size; j++) line.push(Math.random())
    out.push(line)
  }
  const smooth2D = (scale: number) => {
    const arr = out.map(a => periodicSmooth(a, scale))
    for (let i = 1; i < size; i++) {
      for (let j = 0; j < i; j++) {
        [arr[i][j], arr[j][i]] = [arr[j][i], arr[i][j]]
      }
    }
    return arr.map(a => periodicSmooth(a, scale))
  }
  const w1 = smooth2D(scale)
  const w2 = smooth2D(2 * scale)
  let sum = 0
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    const w = w1[i][j] - w2[i][j]
    sum += w
    out[i][j] = w
  }
  const av = sum / size / size
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) out[i][j] -= av
  return out
}

export function createWaveTexture(size: number, scale: number) {
  const array = create2DWave(size, scale)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imgdata = ctx.createImageData(size, size)
  let max = 0
  let dmax = 0
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    const v = array[i][j]
    max = Math.max(max, Math.abs(v))
    dmax = Math.max(
      dmax,
      array[(i + 1) % size][j] - array[(i + size - 1) % size][j],
      array[i][(j + 1) % size] - array[i][(j + size - 1) % size]
    )
  }
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    const v = array[i][j]
    const dx = array[(i + 1) % size][j] - array[(i + size - 1) % size][j]
    const dy = array[i][(j + 1) % size] - array[i][(j + size - 1) % size]
    const idx = (imgdata.width * j + i) * 4
    imgdata.data[idx] = Math.round(0xff * (1 + dx / dmax) / 2)
    imgdata.data[idx + 1] = Math.round(0xff * (1 + dy / dmax) / 2)
    imgdata.data[idx + 2] = Math.round(0xff * (1 + v / max) / 2)
    imgdata.data[idx + 3] = 0xff
  }
  ctx.putImageData(imgdata, 0, 0)
  return canvas
}