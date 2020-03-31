import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import { BoxGeometry, MeshPhongMaterial, MeshBasicMaterial, Mesh } from 'three'
import { BufferGeometry, BufferAttribute } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
import { Random } from './util'


const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 1, 1000)
const renderer = new WebGLRenderer()
const geometry = new BoxGeometry()
const material = new MeshPhongMaterial({ color: 0xffffff })
const cube = new Mesh(geometry, material)
const light = new DirectionalLight(0xffffaa, 1)
const alight = new AmbientLight(0x202040, 1)
scene.add(light, alight)
// scene.add(cube)
for (let i = 0; i < 9; i++) {
  const branch = new Mesh(genBranch({ r1: 0.05+0.01*i, r2: 0.01*i, rlevel: 16, dr: 0.05/(1+0.5 * i), zlevel: 32, seed: 1 + i}), material || new MeshBasicMaterial({ color: 0xff0000 }))
  branch.rotation.x = -Math.PI / 2
  branch.position.x = 0.4 * (i - 4)
  scene.add(branch)
}
camera.position.z = 2
camera.position.y = 0.5
renderer.setSize(800, 600)

function genBranch({ r1 = 0.2, r2 = 0.2, rlevel = 5, zlevel = 5, dr = 0.1, seed = 0 } = {}) {
  const random = new Random(seed)
  const seriesX = random.smooth(64)
  const seriesY = random.smooth(64)
  const geom = new BufferGeometry()
  const vertices: number[] = []
  const interpolate = (arr: number[], t: number) => {
    const ti = Math.floor(t)
    t -= ti
    return arr[ti % arr.length] * (1 - t) + t * arr[(ti + 1) % arr.length]
  }
  const centerAt = (z: number) => [
    dr * (interpolate(seriesX, z * seriesX.length) - seriesX[0]),
    dr * (interpolate(seriesY, z * seriesY.length) - seriesY[0])
  ]
  for (let i = 0; i < rlevel; i++) {
    const th1 = 2 * Math.PI * i / rlevel
    const th2 = 2 * Math.PI * (i + 1) / rlevel
    const c1 = Math.cos(th1), s1 = Math.sin(th1)
    const c2 = Math.cos(th2), s2 = Math.sin(th2)
    if (r1) vertices.push(0, 0, -r1, r1 * c2, r1 * s2, 0, r1 * c1, r1 * s1, 0)
    if (r2) vertices.push(0, 0, 1 + r2, r2 * c1, r2 * s1, 1, r2 * c2, r2 * s2, 1)
    for (let j = 0; j < zlevel; j++) {
      const za = j / zlevel
      const zb = (j + 1) / zlevel
      const ra = r1 + (r2 - r1) * za
      const rb = r1 + (r2 - r1) * zb
      const [xa, ya] = centerAt(za)
      const [xb, yb] = centerAt(zb)
      if (ra) vertices.push(
        xa + ra * c1, ya + ra * s1, za,
        xa + ra * c2, ya + ra * s2, za,
        xb + rb * c1, yb + rb * s1, zb
      )
      if (rb) vertices.push(
        xa + ra * c2, ya + ra * s2, za,
        xb + rb * c2, yb + rb * s2, zb,
        xb + rb * c1, yb + rb * s1, zb
      )
    }
  }
  geom.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geom.computeVertexNormals()
  return geom
}

function animate() {
  requestAnimationFrame(() => setTimeout(animate, 200))
  cube.rotation.x += 0.01
  cube.rotation.y += 0.02
  cube.rotation.z += 0.03
  renderer.render(scene, camera)
}
onload = () => {
  document.body.appendChild(renderer.domElement)
  animate()
}

