const THREE = require('three')
const $ = require('jquery')
const OrbitControls = require('three-orbit-controls')(THREE)
const WindowResize = require('three-window-resize')
var i, j
var disp
var e0, e1
var w,a,s,d,x
var p
const horizSize = 200
const vertSize = 100
var temp = 0.3

class Environment {

  constructor () {
    this.scene = new THREE.Scene()



    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: $('#three-canvas')[0]})
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight
    // this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setSize(width,height)
    this.renderer.setClearColor(0x000000, 1)

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000)
    this.camera.position.z = width/25

    this.controls = new OrbitControls(this.camera)

    const windowResize = new WindowResize(this.renderer, this.camera)
    console.log({ windowResize })

    this.createXY(horizSize,vertSize)
    this.resizeCanvasToDisplaySize(true)
  }

  render () {
    this.updateXYPeriodic(horizSize,vertSize,temp)
    this.resizeCanvasToDisplaySize(true)
    this.renderer.render(this.scene, this.camera)
  }

  // 'private'

  createXY (xLen,yLen) {
    var geometry = new THREE.Geometry()
    this.pointsArray = new Array(xLen)
    for(i = 0; i<xLen; i++){
      this.pointsArray[i] = new Array(yLen)
      for(j = 0; j<yLen; j++){
        this.pointsArray[i][j] = new THREE.Vector3(i/2-xLen/4,j/2-yLen/4,0)
        if(i == 0 || j == 0 || i == xLen-1 || j == yLen-1){
            //useful to set boundary values separately,
            //especially when using Dirichlet boundary conditions
            // this.pointsArray[i][j].s = Math.random()
            this.pointsArray[i][j].s = 0
        } else {
          // this.pointsArray[i][j].s = Math.random()
          this.pointsArray[i][j].s = 0
        }
        geometry.vertices.push(this.pointsArray[i][j])
        geometry.colors.push(new THREE.Color("hsl(" + 360*this.pointsArray[i][j].s
                              + ",100%,50%)"))
      }
    }
    const pointsMaterial = new THREE.PointsMaterial({vertexColors:THREE.VertexColors})
    this.points = new THREE.Points(geometry,pointsMaterial)
    this.points.geometry.colorsNeedUpdate = true
    this.scene.add(this.points)
  }

  updateXYDirichlet (xLen,yLen,temp) {
    //uses Dirichlet boundary conditions and Glauber dynamics
    for(i = 1; i<xLen-1; i++){
      for(j = 1; j<yLen-1; j++){
        disp = Math.random()
        w = this.pointsArray[i][j+1].s
        a = this.pointsArray[i-1][j].s
        s = this.pointsArray[i][j].s
        d = this.pointsArray[i+1][j].s
        x = this.pointsArray[i][j-1].s
        e0 = this.energy(w,a,s,d,x)
        e1 = this.energy(w,a,disp,d,x)
        p = 1/(1+Math.exp(-(e1-e0)/temp))
        if(Math.random() < p){
          this.pointsArray[i][j].s = disp
          this.points.geometry.colors[i*yLen+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                + ",100%,50%)")
        }
      }
    }
    this.points.geometry.colorsNeedUpdate = true
  }

  updateXYPeriodic (xLen,yLen,temp) {
    //uses Periodic boundary conditions and Glauber dynamics
    for(i = 0; i<xLen; i++){
      for(j = 0; j<yLen; j++){
        disp = Math.random()
        w = this.pointsArray[i][(j+1)%yLen].s
        a = this.pointsArray[(i-1+xLen)%xLen][j].s
        s = this.pointsArray[i][j].s
        d = this.pointsArray[(i+1)%xLen][j].s
        x = this.pointsArray[i][(j-1+yLen)%yLen].s
        e0 = this.energy(w,a,s,d,x)
        e1 = this.energy(w,a,disp,d,x)
        p = 1/(1+Math.exp(-(e1-e0)/temp))
        if(Math.random() < p){
          this.pointsArray[i][j].s = disp
          this.points.geometry.colors[i*yLen+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                + ",100%,50%)")
        }
      }
    }
    this.points.geometry.colorsNeedUpdate = true
  }

  energy(w,a,s,d,x) {
    return Math.cos(2*Math.PI*(w-s)) + Math.cos(2*Math.PI*(a-s)) + Math.cos(2*Math.PI*(d-s)) + Math.cos(2*Math.PI*(x-s))
  }

  keypress(e) {
    if(e.key == "h"){
      temp+=0.05
    } else if (e.key == "c") {
      temp-=0.05
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
