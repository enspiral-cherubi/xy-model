const THREE = require('three')
var i
var j
var disp
var e0, e1
var p

class Physics {

    constructor (horizSize,vertSize,squidSize) {
      this.horizSize = horizSize
      this.vertSize = vertSize
      this.squidSize = squidSize

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
          e0 = this.energy(this.pointsArray[i][j].s, this.pointsArray[i][j].neighbors,appliedField)
          e1 = this.energy(disp,this.pointsArray[i][j].neighbors,appliedField)
          p = 1/(1+Math.exp(-(e1-e0)/temp))
          if(Math.random() < p){
            this.pointsArray[i][j].s = disp
            geometry.colors[i*this.vertSize+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                  + ",100%,50%)")
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

    makePyramids(localMagnetization){
      var k
      var H = new Array(this.horizSize)
      for(i = 0; i<this.horizSize; i++){
        H[i] = new Array(this.vertSize)
        for(j = 0; j<this.vertSize; j++){

        }
      }
    }

    energy(s,neighbors,appliedField) {
      var e = 0
      neighbors.forEach((n) => {e+=Math.cos(2*Math.PI*(n.s-s))})
      e+= (Math.cos(2*Math.PI*s)*appliedField.x + Math.sin(2*Math.PI*s)*appliedField.y)
      return e
    }


}

module.exports = Physics
