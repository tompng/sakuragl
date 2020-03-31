import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh } from 'three'
const scene = new Scene()
const camera = new PerspectiveCamera(75, 4 / 3, 1, 1000)
const renderer = new WebGLRenderer()
const geometry = new BoxGeometry()
const material = new MeshBasicMaterial({ color: 0x00ff00 })
const cube = new Mesh(geometry, material);
scene.add(cube)
camera.position.z = 4
renderer.setSize(800, 600)
function animate() {
  requestAnimationFrame(animate)
  cube.rotation.x += 0.01
  cube.rotation.y += 0.02
  cube.rotation.z += 0.03
  renderer.render(scene, camera)
}
onload = () => {
  document.body.appendChild(renderer.domElement)
  animate()
}
