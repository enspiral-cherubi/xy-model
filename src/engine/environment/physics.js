const THREE = require('three')
var i
var j
var disp
var e0, e1
var p

class Physics {

    constructor (horizSize,vertSize,squidSize,initialSpin) {
      this.horizSize = horizSize
      this.vertSize = vertSize
      this.squidSize = squidSize
      this.vaporColors = false

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
            this.pointsArray[i][j].s = initialSpin || Math.random()
          }
        }
      }
      //add neighbors, keeping reference to the pointsArray objects so they update automatically,
      //js only passes primitive types as values, all others, eg. THREE.Vector3, are passed
      //by pointers
      for(i = 0; i<horizSize; i++){
        for(j = 0; j<vertSize; j++){
          this.pointsArray[i][j].neighbors = []
          this.pointsArray[i][j].neighbors.push(this.pointsArray[i][(j+1)%vertSize])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[(i-1+horizSize)%horizSize][j])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[(i+1)%horizSize][j])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[i][(j-1+vertSize)%vertSize])
        }
      }
      this.getTotalMagnetization()
    }

    updateXYDirichlet(temp,feedback,geometry) {
      //updates the XY model using Glauber dynamics and Dirichlet boundary conditions
      var localMagnetizations = this.getLocalMagnetizations()
      for(i = 1; i<this.horizSize-1; i++){
        for(j = 1; j<this.vertSize-1; j++){
          disp = Math.random()
          var appliedField = new THREE.Vector2()
          appliedField.copy(localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)])
          appliedField.multiplyScalar(feedback)
          appliedField.multiplyScalar(this.pyramid(i,j))
          e0 = this.energy(this.pointsArray[i][j].s, this.pointsArray[i][j].neighbors,appliedField)
          e1 = this.energy(disp,this.pointsArray[i][j].neighbors,appliedField)
          p = 1/(1+Math.exp(-(e1-e0)/temp))
          if(Math.random() < p){
            this.pointsArray[i][j].s = disp
            geometry.colors[i*this.vertSize+j].set(this.spinToColor(this.pointsArray[i][j].s))
          }
        }
      }
    }

    getLocalMagnetizations(){
      var s = 0
      var localMagnetizations = new Array(Math.floor(this.horizSize/this.squidSize))
      for(i = 0; i<Math.floor(this.horizSize/this.squidSize); i++){
        localMagnetizations[i] = new Array(Math.floor(this.vertSize/this.squidSize))
        for(j = 0; j<Math.floor(this.vertSize/this.squidSize); j++){
          localMagnetizations[i][j] = new THREE.Vector2(0,0)
        }
      }
      for(i = 0; i<this.horizSize; i++){
        for(j = 0; j<this.vertSize; j++){
          s = this.pointsArray[i][j].s
          localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].add(
            new THREE.Vector2(Math.cos(2*Math.PI*s),Math.sin(2*Math.PI*s)))
        }
      }
      localMagnetizations.map(a => a.map(v => v.multiplyScalar(1/this.squidSize)))
      return localMagnetizations
    }

    getTotalMagnetization(){
      var totalMagnetization = new THREE.Vector2(0,0)
      var localMagnetizations = this.getLocalMagnetizations()
      localMagnetizations.forEach((a) => {a.forEach((v) => {totalMagnetization.add(v)})})
      console.log(totalMagnetization)
    }

    pyramid(x,y){
      var bigx = Math.floor(x/this.squidSize)+1/2
      var bigy = Math.floor(y/this.squidSize)+1/2
      return 1 - (Math.abs(x - bigx*this.squidSize) + Math.abs(y - bigy*this.squidSize))/this.squidSize
    }

    energy(s,neighbors,appliedField) {
      var e = 0
      neighbors.forEach((n) => {e+=Math.cos(2*Math.PI*(n.s-s))})
      e+= (Math.cos(2*Math.PI*s)*appliedField.x + Math.sin(2*Math.PI*s)*appliedField.y)
      return e
    }

    spinToColor(s){
      var hue = 360*s
      var saturation = 100
      var lightness = 50

      if(this.vaporColors){
        if(s < 0.3){//yellow band
          hue = s*170+30
          lightness = 50
        } else if(s<0.6){//cyan band
          hue = s*170+120
        } else {//magenta band
          hue = s*170 + 140
          saturation = 100
        }
      }

      // if(s < 0.3){//yellow band
      //   hue = s*360 + 30
      // } else if(s<0.6){//cyan band
      //   hue = s*300 + 100
      // } else {//magenta band
      //   hue = s*300
      // }

       // saturation = Math.floor(Math.cos(Math.PI*s/2)*100) //fire mode

      return "hsl(" + hue + "," + saturation +"%," + lightness + "%)"
      // var r = s
      // var g = 0
      // var b = s
      // return "rgb(" + Math.floor(r*255) +"," + Math.floor(g*255) + "," + Math.floor(b*255) +")"
    }


}

module.exports = Physics
