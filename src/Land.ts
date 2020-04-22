import {
  Scene,
  Camera,
  BufferGeometry,
  PlaneBufferGeometry,
  ShaderMaterial,
  Points,
  Mesh,
  Texture,
  AdditiveBlending
} from 'three'
import vertexShader from './shaders/land.vert'
import fragmentShader from './shaders/land.frag'

export class Land {
  geometries: BufferGeometry[]
  shader: ShaderMaterial
  mesh: Mesh
  constructor() {
    this.geometries = [8, 16, 32, 64, 128].map(size => 
      new PlaneBufferGeometry((size + 2) / size, size + 2, size + 2)
    )
    this.shader = new ShaderMaterial({
      uniforms: {},
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })
    const mesh = new Mesh(
      new PlaneBufferGeometry(16, 16, 256, 256),
      this.shader
    )
    this.mesh = mesh
  }
}
