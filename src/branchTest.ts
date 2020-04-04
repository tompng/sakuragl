import { Scene, PerspectiveCamera, WebGLRenderer, Vector3 } from 'three'
import { MeshPhongMaterial, Mesh, LOD } from 'three'
import { BufferGeometry, BufferAttribute } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
import { Branch } from './Branch'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { normalize, cross } from './util'
export function start() {
  const scene = new Scene()
  const camera = new PerspectiveCamera(75, 4 / 3, 0.1, 1000)
  const renderer = new WebGLRenderer()
  const material = new MeshPhongMaterial({ color: 0xffffff })
  const light = new DirectionalLight(0xffffaa, 1)
  const alight = new AmbientLight(0x202040, 1)
  scene.add(light, alight)

  const lods: LOD[] = []
  function lengthOf(i: number) {
    return 0.5 + 0.1 * i
  }
  for (let i = 0; i < 12; i++) {
    const branch = new Branch({ r1: 0.025 * (i + 1), r2: 0.025 * i, rscale: 0.015 + 0.001 * i, length: lengthOf(i), seed: 1 + i})
    const lod = new LOD()
    ;[[128, 256], [96, 192], [64, 128], [48, 96], [32, 64], [24, 48], [16, 32], [12, 24], [8, 16], [6, 12], [4, 8], [3, 6]].forEach(([rlevel, zlevel], level) => {
      const mesh = new Mesh(genGeometry(branch.generateCoords(rlevel, zlevel)), material)
      lod.addLevel(mesh, level)
    })
    lods.push(lod.clone())
    lod.rotation.x = -Math.PI / 2
    lod.position.x = 0.4 * (i - 2)
    scene.add(lod)
  }

  function constructTree(x: number, y: number, z: number, dx: number, dy: number, dz: number, level: number) {
    if (level < 0) return
    const obj = lods[Math.floor(level)].clone()
    const length = lengthOf(Math.floor(level))
    obj.position.x = x
    obj.position.y = y
    obj.position.z = z
    const angle = Math.PI / 2 - Math.asin(dz)
    obj.rotateOnAxis(new Vector3(...normalize([-dy, dx, 0]) ), angle)//180 * angle / Math.PI)
    const [vx, vy, vz] = normalize(cross([2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1], [dx, dy, dz]))
    const nextVec = (a: number): [number, number, number] => {
      const [dx2, dy2, dz2] = normalize([dx + vx * a, dy + vy * a, dz + vz * a])
      return normalize([dx2, dy2, Math.max(dz2 - 0.1, -0.25)])
    }

    scene.add(obj)
    if (Math.random() < 0.2) {
      const [dx2, dy2, dz2] = nextVec(0.3 * (2 * Math.random() - 1))
      constructTree(x + length * dx, y + length * dy, z + length * dz, dx2, dy2, dz2, level - 1)
      return
    }
    for (let i = 0; i < 2; i++) {
      const [dx2, dy2, dz2] = nextVec((i === 0 ? -1 : 0.2) * (0.5 + 0.5 * Math.random()))
      constructTree(x + length * dx, y + length * dy, z + length * dz, dx2, dy2, dz2, level - 1)
    }
  }
  constructTree(0, 0, 0, 0, 0, 1, 11)


  camera.position.z = 2
  camera.position.y = 0.5
  renderer.setSize(800, 600)

  function genGeometry([vertices, normals]: [number[], number[]]) {
    const geom = new BufferGeometry()
    geom.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geom.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    return geom
  }

  function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  new OrbitControls(camera, renderer.domElement)
  document.body.appendChild(renderer.domElement)
  animate()
}