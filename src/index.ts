import { Scene, PerspectiveCamera, WebGLRenderer, Vector3 } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { start } from './branchTest'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 0.1, 1000)
const renderer = new WebGLRenderer()
new OrbitControls(camera, renderer.domElement)
const light = new DirectionalLight(0xffffaa, 1)
const alight = new AmbientLight(0x202040, 1)
scene.add(light, alight)
camera.position.z = 2
camera.position.y = 0.5
renderer.setSize(800, 600)

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
onload = () => {
  start(scene)
  document.body.appendChild(renderer.domElement)
  animate()
  // update()
}