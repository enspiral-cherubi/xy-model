const THREE = require('three')
const $ = require('jquery')
const OrbitControls = require('three-orbit-controls')(THREE)
const WindowResize = require('three-window-resize')
const Physics = require('./physics.js')
var i, j
var disp
var e0, e1
var p
var temp = 0.3
var poking = false
var feedback = 0
var size = 5

class Environment {

  constructor () {
    this.scene = new THREE.Scene()



    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: $('#three-canvas')[0]})
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    // this.renderer.setSize(width,height)
    this.renderer.setClearColor(0x000000, 1)

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000)
    this.camera.position.z = width/25

    this.controls = new OrbitControls(this.camera)

    const windowResize = new WindowResize(this.renderer, this.camera)
    console.log({ windowResize })

    this.text2 = document.createElement('div');
    this.text2.style.position = 'absolute';
    //this.text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
    this.text2.style.width = 100;
    this.text2.style.height = 100;
    this.text2.style.backgroundColor = "white";
    this.text2.innerHTML = Math.floor(20*temp);
    this.text2.style.top = height + 'px';
    this.text2.style.left = 20 + 'px';
    document.body.appendChild(this.text2);

    this.physics = new Physics(200,100,5)
    this.makePhysicsMesh(this.physics)

    this.resizeCanvasToDisplaySize(true)
  }

  render () {
    // this.updateXYPeriodic(horizSize,vertSize)
    this.physics.updateXYDirichlet(temp,feedback,this.physicsMesh.geometry)
    this.physicsMesh.geometry.colorsNeedUpdate = true
    this.resizeCanvasToDisplaySize(true)
    this.renderer.render(this.scene, this.camera)
  }

  // 'private'

  makePhysicsMesh() {
    var geometry = new THREE.Geometry()
    this.physics.pointsArray.forEach((a) => a.forEach((p) => {
      geometry.vertices.push(p)
      geometry.colors.push(new THREE.Color("hsl(" + 360*p.s
                            + ",100%,50%)"))
    }))
    const pointsMaterial = new THREE.PointsMaterial({vertexColors:THREE.VertexColors})
    this.physicsMesh = new THREE.Points(geometry,pointsMaterial)
    this.physicsMesh.geometry.colorsNeedUpdate = true
    this.scene.add(this.physicsMesh)
  }

  keypress(e) {
    if(e.key == "h"){
      temp+=0.05
      this.text2.innerHTML = Math.floor(20*temp)
    } else if (e.key == "c") {
      temp-=0.05
      this.text2.innerHTML = Math.floor(20*temp)
    } else if (e.key == "m") {
      feedback += 0.05
      console.log(feedback)
    } else if (e.key == "l") {
      feedback -= 0.05
      console.log(feedback)
    }
  }

  keydown(e) {
    if(e.key == " "){
      poking = true
    }
  }

  keyup(e) {
    if(e.key ==" "){
      poking = false
    }
  }

  mousemove(e) {
    if(poking){
      var vector = new THREE.Vector3(2*e.clientX/window.innerWidth - 1,
                                    -2*e.clientY/window.innerHeight + 1,
                                    0.5
                                  )
      vector.unproject( this.camera )
      var direction = vector.sub( this.camera.position ).normalize()
      var distance = - this.camera.position.z / direction.z
      var position = this.camera.position.clone().add( direction.multiplyScalar( distance ) )
      if(-horizSize/4 < position.x && position.x < horizSize/4 && -vertSize/4 < position.y && position.y < vertSize/4){
        i = Math.floor(position.x*2) + horizSize/2
        j = Math.floor(position.y*2) + vertSize/2
        for(var k = -8; k<9;k++){
          for(var l = -8; l<9;l++){
            this.pointsArray[i+k][j+l].s = Math.random()
          }
        }
      }
    }
  }

  resizeCanvasToDisplaySize(force) {
    //thx to gman on stackexchange for this hack
    const canvas = this.renderer.domElement;
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // adjust displayBuffer size to match
    if (force || canvas.width !== width || canvas.height !== height) {
      // you must pass false here or three.js sadly fights the browser
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      // update any render target sizes here
    }
  }

}

module.exports = Environment
