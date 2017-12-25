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

    this.createXY()
    this.resizeCanvasToDisplaySize(true)
  }

  render () {
    // this.updateXYPeriodic(horizSize,vertSize)
    this.updateXYDirichlet(horizSize,vertSize)
    this.resizeCanvasToDisplaySize(true)
    this.renderer.render(this.scene, this.camera)
  }

  // 'private'

  createXY () {
    var geometry = new THREE.Geometry()
    this.pointsArray = new Array(horizSize)
    for(i = 0; i<horizSize; i++){
      this.pointsArray[i] = new Array(vertSize)
      for(j = 0; j<vertSize; j++){
        this.pointsArray[i][j] = new THREE.Vector3(i*0.5-horizSize*0.25,j*0.5-vertSize*0.25,0)
        if(i == 0 || j == 0 || i == horizSize-1 || j == vertSize-1){
            //useful to set boundary values separately,
            //especially when using Dirichlet boundary conditions
            // this.pointsArray[i][j].s = Math.random()
            // this.pointsArray[i][j].s = i/horizSize
            this.pointsArray[i][j].s = i/horizSize
        } else {
          this.pointsArray[i][j].s = Math.random()
          // this.pointsArray[i][j].s = i/horizSize
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

  updateXYDirichlet () {
    //uses Dirichlet boundary conditions and Glauber dynamics
    var B
    var averageMagnetization = this.getAverageMagnetization()
    for(i = 1; i<horizSize-1; i++){
      for(j = 1; j<vertSize-1; j++){
        disp = Math.random()
        w = this.pointsArray[i][j+1].s
        a = this.pointsArray[i-1][j].s
        s = this.pointsArray[i][j].s
        d = this.pointsArray[i+1][j].s
        x = this.pointsArray[i][j-1].s
        B = averageMagnetization[Math.floor(i/size)][Math.floor(j/size)]
        e0 = this.energy(w,a,s,d,x,B)
        e1 = this.energy(w,a,disp,d,x,B)
        p = 1/(1+Math.exp(-(e1-e0)/temp))
        if(Math.random() < p){
          this.pointsArray[i][j].s = disp
          this.points.geometry.colors[i*vertSize+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                + ",100%,50%)")
        }
      }
    }
    this.points.geometry.colorsNeedUpdate = true
  }

  updateXYPeriodic () {
    //uses Periodic boundary conditions and Glauber dynamics
    for(i = 0; i<horizSize; i++){
      for(j = 0; j<vertSize; j++){
        disp = Math.random()
        w = this.pointsArray[i][(j+1)%vertSize].s
        a = this.pointsArray[(i-1+horizSize)%horizSize][j].s
        s = this.pointsArray[i][j].s
        d = this.pointsArray[(i+1)%horizSize][j].s
        x = this.pointsArray[i][(j-1+vertSize)%vertSize].s
        e0 = this.energy(w,a,s,d,x)
        e1 = this.energy(w,a,disp,d,x)
        p = 1/(1+Math.exp(-(e1-e0)/temp))
        if(Math.random() < p){
          this.pointsArray[i][j].s = disp
          this.points.geometry.colors[i*vertSize+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                + ",100%,50%)")
        }
      }
    }
    this.points.geometry.colorsNeedUpdate = true
  }

  getAverageMagnetization(){
    var s = 0
    var averageMagnetization = new Array(Math.floor(horizSize/size))
    for(i = 0; i<Math.floor(horizSize/size); i++){
      averageMagnetization[i] = new Array(Math.floor(vertSize/size))
      for(j = 0; j<Math.floor(vertSize/size); j++){
        averageMagnetization[i][j] = new THREE.Vector2(0,0)
      }
    }
    for(i = 0; i<horizSize; i++){
      for(j = 0; j<vertSize; j++){
        s = this.pointsArray[i][j].s
        averageMagnetization[Math.floor(i/size)][Math.floor(j/size)].add(
          new THREE.Vector2(Math.cos(2*Math.PI*s),Math.sin(2*Math.PI*s)))
      }
    }
    averageMagnetization.map(a => a.map(v => v.multiplyScalar(1/size)))
    return averageMagnetization
  }

  energy(w,a,s,d,x,B) {
    var e = Math.cos(2*Math.PI*(w-s)) + Math.cos(2*Math.PI*(a-s)) + Math.cos(2*Math.PI*(d-s)) + Math.cos(2*Math.PI*(x-s))
    e-= feedback*(Math.cos(2*Math.PI*s)*B.x + Math.sin(2*Math.PI*s)*B.y)
    return e
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
    } else if (e.key == "l") {
      feedback -= 0.05
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
