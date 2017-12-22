const THREE = require('three')
const $ = require('jquery')
const OrbitControls = require('three-orbit-controls')(THREE)
const WindowResize = require('three-window-resize')
var i, j
var disp
var e0, e1
var w,a,s,d,x
var p
const horizSize = 100
const vertSize = 50
var temp = 0.3

class Environment {

  constructor () {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000)
    this.camera.position.z = 40

    // this.controls = new OrbitControls(this.camera)

    this.renderer = new THREE.WebGLRenderer({alpha: true, canvas: $('#three-canvas')[0]})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0xffffff, 1)

    const windowResize = new WindowResize(this.renderer, this.camera)
    console.log({ windowResize })

    this.createXY(horizSize,vertSize)
  }

  render () {
    this.updateXYPeriodic(horizSize,vertSize,temp)
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
            this.pointsArray[i][j].s = 1/2
        } else {
          this.pointsArray[i][j].s = Math.random()
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

}

module.exports = Environment