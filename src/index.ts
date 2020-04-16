import { Scene, PerspectiveCamera, WebGLRenderer, Vector3 } from 'three'
import { AmbientLight, DirectionalLight } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
//import { start } from './branchTest'
import { start, update } from './Particle'

const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 0.01, 100)
const renderer = new WebGLRenderer({ antialias: true })
new OrbitControls(camera, renderer.domElement)
const light = new DirectionalLight(0xffffaa, 1)
const alight = new AmbientLight(0x202040, 1)
scene.add(light, alight)
camera.position.z = 2
renderer.setSize(800, 600)

function animate() {
  update(scene, camera)
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