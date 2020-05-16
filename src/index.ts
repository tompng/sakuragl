import * as THREE from 'three'
import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Mesh } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
//import { start } from './branchTest'
import { start, update } from './Particle'
import { Land, landZ } from './Land'
import { Sky } from './Sky'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 0.01, 32)
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
let fw = 0
let lr = 0
function updateCamera() {
  const forward = (keypad['w'] ? 1 : 0) - (keypad['s'] ? 1 : 0)
  fw = fw * 0.9 + 0.1 * forward
  lr = lr * 0.9 + 0.1 * ((keypad['d'] ? 1 : 0) - (keypad['a'] ? 1 : 0))
  const zcos = Math.cos(zrot)
  const zsin = Math.sin(zrot)
  const dirx = Math.cos(xyrot)
  const diry = Math.sin(xyrot)
  const dirz = zsin
  const vf = 0.02 * Math.max(fw, fw * 2)
  const vlr = 0.02 * lr
  camera.setRotationFromEuler(new THREE.Euler(Math.PI / 2 + zrot, 0, -Math.PI / 2 + xyrot, 'ZXY'))
  cpos.x += vf * dirx * zcos + vlr * diry
  cpos.y += vf * diry * zcos - vlr * dirx
  cpos.z += vf * dirz
  cpos.z = Math.max(cpos.z, landZ(cpos.x, cpos.y) + 0.1, 0.1)
  if (cpos.z > 8) cpos.z = 8
  camera.position.x = cpos.x
  camera.position.y = cpos.y
  camera.position.z = cpos.z
}

import { generateBouquets, generateGeometry } from './Flower'
import { createShadowedSakuraTexture } from './sakura'
import vertexShader from './shaders/flower.vert'
import fragmentShader from './shaders/flower.frag'
const texture = new THREE.Texture(createShadowedSakuraTexture(512))
texture.magFilter = THREE.LinearFilter
texture.minFilter = THREE.LinearFilter
texture.format = THREE.RGBFormat
texture.needsUpdate = true
const bouquets = generateBouquets(4)

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: { texture: { value: texture } },
  side: THREE.DoubleSide
})

bouquets.forEach((levels, i) => {
  levels.forEach((attrs, j) => {
    const geometry = generateGeometry(attrs)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.02
    mesh.position.z = 1
    mesh.position.x = 2 + i / 5
    mesh.position.y = j / 5
    scene.add(mesh)
  })
})

const bouquetGeometries = bouquets.map(levels => levels.map(generateGeometry))
import { Branch } from './tree'
for (let i = 0; i < 16; i++) {
  const x = 10 * Math.random()
  const y = 10 * Math.random()
  const z = landZ(x, y)
  const tree = new Branch(
    { x, y, z },
    { x: 0, y: 0, z: 1 },
    Math.floor(5 + 5 * Math.random()),
    {
      dir: { x: 0, y: 0, z: 1 },
      crs: { x: 1, y: 0, z: 0 },
    }
  )
  const positions = tree.positions()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  const treeMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#110804', side: THREE.DoubleSide }))
  scene.add(treeMesh)
  const flowers = tree.collectFlowerPositions()
  flowers.forEach(({ start, xyrot, zrot }) => {
    const levels = bouquetGeometries[Math.floor(4 * Math.random())]
    const lod = new THREE.LOD()
    lod.position.x = start.x
    lod.position.y = start.y
    lod.position.z = start.z
    levels.forEach((geometry, i) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.02
      mesh.rotateOnAxis(new THREE.Vector3(-Math.sin(xyrot), Math.cos(xyrot), 0), zrot)
      lod.addLevel(mesh, [4,2,0.8,0.2,0][i])
    })
    scene.add(lod)
  })
}


const light = new DirectionalLight(0xffffff, 1)
const alight = new AmbientLight(0x202020, 1)
scene.add(light, alight)
camera.position.z = 2
renderer.setSize(800, 600)
let prevKeypad = keypad
const sky = new Sky()
const land = new Land(scene, camera)
scene.add(sky.mesh)
let time = 0
let paused = false
let timeScale = 1
let prevTime = performance.now()
function animate() {
  let current = performance.now()
  if (!prevKeypad[' '] && keypad[' ']) paused = !paused
  prevKeypad = { ...keypad }
  timeScale = timeScale * 0.9 + 0.1 * (paused ? 0 : 1)
  time += (prevTime - current) / 1000 * timeScale
  prevTime = current
  updateCamera()
  update(time, scene, camera)
  land.update(time)
  sky.update(camera)
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
onload = () => {
  start(scene)
  renderer.domElement.style.width = '800px'
  renderer.domElement.style.height = '600px'
  document.body.appendChild(renderer.domElement)
  animate()
}