import { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import { MeshPhongMaterial, Mesh, LOD } from 'three'
import { BufferGeometry, BufferAttribute } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
import { Branch } from './Branch'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 0.1, 1000)
const renderer = new WebGLRenderer()
const material = new MeshPhongMaterial({ color: 0xffffff })
const light = new DirectionalLight(0xffffaa, 1)
const alight = new AmbientLight(0x202040, 1)
scene.add(light, alight)

const lods: LOD[] = []
for (let i = 0; i < 5; i++) {
  const branch = new Branch({ r1: 0.04 * (i + 1), r2: 0.04 * i, rscale: 0.02/(1+0.1 * i), length: 1, seed: 1 + i})
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

const a = lods[2].clone()
scene.add(a)
for(let i = 0; i < 2; i++) {
  const b = lods[i].clone()
  scene.add(b)
  b.position.z = 1
  b.rotation.x = Math.random() - 0.5
  b.rotation.y = Math.random() - 0.5
}


camera.position.z = 2
camera.position.y = 0.5
renderer.setSize(800, 600)

function genGeometry([vertices, normals]: [number[], number[]]) {
  const geom = new BufferGeometry()
  geom.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geom.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  // geom.computeVertexNormals()
  return geom
}

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
onload = () => {
  new OrbitControls(camera, renderer.domElement)
  document.body.appendChild(renderer.domElement)
  animate()
}

