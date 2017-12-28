const THREE = require('three')
var i
var j
var disp
var e, e0, e1
var p

class Physics {

    constructor (horizSize,vertSize,squidSize,initialSpin) {
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

      //prepare local magnetizations array
      this.localMagnetizations = new Array(Math.floor(this.horizSize/this.squidSize))
      for(i = 0; i<Math.floor(this.horizSize/this.squidSize); i++){
        this.localMagnetizations[i] = new Array(Math.floor(this.vertSize/this.squidSize))
        for(j = 0; j<Math.floor(this.vertSize/this.squidSize); j++){
          this.localMagnetizations[i][j] = new THREE.Vector2(0,0)
        }
      }

      //prepare applied fields array, with same coarseness
      this.appliedFields = new Array(Math.floor(this.horizSize/this.squidSize))
      for(i = 0; i<Math.floor(this.horizSize/this.squidSize); i++){
        this.appliedFields[i] = new Array(Math.floor(this.vertSize/this.squidSize))
        for(j = 0; j<Math.floor(this.vertSize/this.squidSize); j++){
          this.appliedFields[i][j] = new THREE.Vector2(0,0)
        }
      }

      //print total magnetization, for reference
      this.totalMagnetization = new THREE.Vector2(0,0)
      this.getTotalMagnetization()
    }

    updateXYDirichlet(temp,feedback,geometry) {
      //updates the XY model using Glauber dynamics and Dirichlet boundary conditions

      //first compute applied fields, this will simulate some intrinsic time delay
      this.getAppliedFields(feedback)

      //iterate over all sites using Glauber algorithm
      for(i = 1; i<this.horizSize-1; i++){
        for(j = 1; j<this.vertSize-1; j++){
          disp = Math.random()
          e0 = this.energy(this.pointsArray[i][j].s, this.pointsArray[i][j].neighbors,this.appliedFields[i][j])
          e1 = this.energy(disp,this.pointsArray[i][j].neighbors,this.appliedFields[i][j])
          p = 1/(1+Math.exp(-(e1-e0)/temp))
          if(Math.random() < p){
            this.pointsArray[i][j].s = disp
            geometry.colors[i*this.vertSize+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                  + ",100%,50%)")
          }
        }
      }
    }

    getAppliedFields(feedback){
      //first compute local magnetizations
      this.getLocalMagnetizations()

      //checker pattern
      this.appliedFields.forEach((a) => {a.forEach((v) => v.set(0,0))})
      for(i = this.squidSize; i<this.horizSize-this.squidSize; i++){
        for(j = this.squidSize; j<this.vertSize-this.squidSize; j++){
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)+1],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)-1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)+1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)-1],1)
        }
      }
      for(i = 0; i<this.squidSize; i++){
        for(j = this.squidSize; j<this.vertSize-this.squidSize; j++){
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)+1],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)+1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)-1],1)
        }
      }
      for(i = this.vertSize-this.squidSize; i<this.vertSize; i++){
        for(j = this.squidSize; j<this.vertSize-this.squidSize; j++){
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)+1],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)-1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)-1],1)
        }
      }
      for(i = this.squidSize; i<this.horizSize-this.squidSize; i++){
        for(j = 0; j<this.squidSize; j++){
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)+1],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)-1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)+1][Math.floor(j/this.squidSize)],1)
        }
      }
      for(i = this.squidSize; i<this.horizSize-this.squidSize; i++){
        for(j = this.vertSize-this.squidSize; j<this.vertSize; j++){
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)-1],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)-1][Math.floor(j/this.squidSize)],1)
          appliedFields[i][j].addScaledVector(
            this.localMagnetizations[Math.floor(i/this.squidSize)+1][Math.floor(j/this.squidSize)],1)
        }
      }

    }

    getLocalMagnetizations(){
      for(i = 0; i<this.horizSize; i++){
        for(j = 0; j<this.vertSize; j++){
          this.localMagnetizations[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].set(
              Math.cos(2*Math.PI*this.pointsArray[i][j].s),
              Math.sin(2*Math.PI*this.pointsArray[i][j].s))
        }
      }
      this.localMagnetizations.map(a => a.map(v => v.multiplyScalar(1/this.squidSize)))
    }

    getTotalMagnetization(){
      this.totalMagnetization.set(0,0)
      this.localMagnetizations.forEach((a) => {a.forEach((v) => {this.totalMagnetization.add(v)})})
      console.log(this.totalMagnetization)
    }

    pyramid(x,y){
      var bigx = Math.floor(x/this.squidSize)+1/2
      var bigy = Math.floor(y/this.squidSize)+1/2
      return this.squidSize - Math.abs(x - bigx*this.squidSize)-Math.abs(y - bigy*this.squidSize)
    }

    energy(s,neighbors,appliedField) {
      e = 0
      neighbors.forEach((n) => {e+=Math.cos(2*Math.PI*(n.s-s))})
      e+= (Math.cos(2*Math.PI*s)*appliedField.x + Math.sin(2*Math.PI*s)*appliedField.y)
      return e
    }


}

module.exports = Physics
