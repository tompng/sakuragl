import * as THREE from 'three'
import { Scene, PerspectiveCamera, WebGLRenderer, Vector3 } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
//import { start } from './branchTest'
import { start, update } from './Particle'
import { Land, landZ } from './Land'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 0.01, 100)
const renderer = new WebGLRenderer({ antialias: true })


const canvas = renderer.domElement
canvas.onclick = () => {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock()
}
let xyrot = 0
let zrot = 0
canvas.onmousemove = e => {
  xyrot -= 0.01 * e.movementX
  zrot -= 0.01 * e.movementY
  if (zrot > Math.PI / 2) zrot = Math.PI / 2
  if (zrot < -Math.PI / 2) zrot = -Math.PI / 2
}

const keypad: Record<string, boolean | undefined> = {}
window.onkeydown = (e: KeyboardEvent) => { keypad[e.key.toLowerCase()] = true }
window.onkeyup = (e: KeyboardEvent) => { keypad[e.key.toLowerCase()] = false }
let cpos = { x: 0, y: 0, z: 1 }
let fw = 0.1
function updateCamera() {
  const forward = (keypad['w'] ? 1 : 0) - (keypad['s'] ? 1 : 0)
  fw = fw * 0.9 + 0.1 * forward

  const lr = (keypad['d'] ? 1 : 0) - (keypad['a'] ? 1 : 0)
  const zcos = Math.cos(zrot)
  const zsin = Math.sin(zrot)
  const dirx = zcos * Math.cos(xyrot)
  const diry = zcos * Math.sin(xyrot)
  const dirz = zsin
  const vf = 0.02 * Math.max(fw, fw * 2)
  const vlr = 0.02 * lr
  camera.setRotationFromEuler(new THREE.Euler(Math.PI / 2 + zrot, 0, -Math.PI / 2 + xyrot, 'ZXY'))
  cpos.x += vf * dirx + vlr * diry
  cpos.y += vf * diry - vlr * dirx
  cpos.z += vf * dirz
  cpos.z = Math.max(cpos.z, landZ(cpos.x, cpos.y) + 0.1)
  if (cpos.z > 8) cpos.z = 8
  camera.position.x = cpos.x
  camera.position.y = cpos.y
  camera.position.z = cpos.z
}


const light = new DirectionalLight(0xffffaa, 1)
const alight = new AmbientLight(0x202040, 1)
scene.add(light, alight)
camera.position.z = 2
renderer.setSize(800, 600)

const land = new Land()
function animate() {
  updateCamera()
  update(scene, camera)
  land.update()
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
onload = () => {
  start(scene)
  scene.add(land.riverMesh)
  scene.add(land.landMeshU)
  scene.add(land.landMeshD)

  renderer.domElement.style.width = '800px'
  renderer.domElement.style.height = '600px'
  document.body.appendChild(renderer.domElement)
  animate()
}