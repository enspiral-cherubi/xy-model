const THREE = require('three')
const Squid = require('./squid.js')
var i
var j
var disp
var e, e0, e1
var p
var m = new THREE.Vector2(0,0)

class Physics {

    constructor (horizSize,vertSize,squidSize,initialSpin) {
      this.horizSize = horizSize
      this.vertSize = vertSize
      this.squidSize = squidSize
      this.numSquidsHoriz = Math.floor(horizSize/squidSize)
      this.numSquidsVert = Math.floor(vertSize/squidSize)
      this.feedbackMode = 'direct'

      this.pointsArray = new Array(horizSize)
      for(i = 0; i<horizSize; i++){
        this.pointsArray[i] = new Array(vertSize)
        for(j = 0; j<vertSize; j++){
          this.pointsArray[i][j] = new THREE.Vector3(i*0.5-horizSize*0.25,j*0.5-vertSize*0.25,0)
          if(i == 0 || j == 0 || i == horizSize-1 || j == vertSize-1){
              //useful to set boundary values separately,
              //especially when using Dirichlet boundary conditions
              // this.pointsArray[i][j].s = Math.random()
              this.pointsArray[i][j].s = i/horizSize
          } else {
            this.pointsArray[i][j].s = initialSpin || Math.random()
          }
        }
      }
      for(i = 0; i<horizSize; i++){
        for(j = 0; j<vertSize; j++){
          this.pointsArray[i][j].neighbors = []
          this.pointsArray[i][j].neighbors.push(this.pointsArray[i][(j+1)%vertSize])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[(i-1+horizSize)%horizSize][j])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[(i+1)%horizSize][j])
          this.pointsArray[i][j].neighbors.push(this.pointsArray[i][(j-1+vertSize)%vertSize])
        }
      }

      this.squids = new Array(Math.floor(this.numSquidsHoriz))
      for(i = 0; i<Math.floor(this.numSquidsHoriz); i++){
        this.squids[i] = new Array(Math.floor(this.numSquidsVert))
        for(j = 0; j<Math.floor(this.numSquidsVert); j++){
          this.squids[i][j] = new Squid()
          this.squids[i][j].m = new THREE.Vector2(0,0)
          this.squids[i][j].h = new THREE.Vector2(0,0)
        }
      }
      for(i = 0; i<this.numSquidsHoriz; i++){
        for(j = 0; j<this.numSquidsVert; j++){
          this.squids[i][j].neighbors = []
          this.squids[i][j].neighbors.push(this.squids[i][(j+1)%this.numSquidsVert])
          this.squids[i][j].neighbors.push(this.squids[(i-1+this.numSquidsHoriz)%this.numSquidsHoriz][j])
          this.squids[i][j].neighbors.push(this.squids[(i+1)%this.numSquidsHoriz][j])
          this.squids[i][j].neighbors.push(this.squids[i][(j-1+this.numSquidsVert)%this.numSquidsVert])
        }
      }

      //print total magnetization, for reference
      this.totalMagnetization = new THREE.Vector2(0,0)
      this.getTotalMagnetization()
      this.getAppliedFields(0.1)
    }

    updateXYDirichlet(temp,feedback,geometry) {
      //updates the XY model using Glauber dynamics and Dirichlet boundary conditions

      //first compute applied fields, this will simulate some intrinsic time delay
      this.getAppliedFields(feedback)

      //iterate over all sites using Glauber algorithm
      for(i = 1; i<this.horizSize-1; i++){
        for(j = 1; j<this.vertSize-1; j++){
          disp = Math.random()
          e0 = this.energy(
            this.pointsArray[i][j].s,
            this.pointsArray[i][j].neighbors,
            this.squids[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].h)
          e1 = this.energy(
            disp,
            this.pointsArray[i][j].neighbors,
            this.squids[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].h)
          p = 1/(1+Math.exp(-(e1-e0)/temp))
          if(Math.random() < p){
            this.pointsArray[i][j].s = disp
            geometry.colors[i*this.vertSize+j].set("hsl(" + 360*this.pointsArray[i][j].s
                                  + ",100%,50%)")
          }
        }
      }
    }

    updateXYPeriodic(temp,feedback,geometry) {
      //updates the XY model using Glauber dynamics and Dirichlet boundary conditions

      //first compute applied fields, this will simulate some intrinsic time delay
      this.getAppliedFields(feedback)

      //iterate over all sites using Glauber algorithm
      for(i = 0; i<this.horizSize; i++){
        for(j = 0; j<this.vertSize; j++){
          disp = Math.random()
          e0 = this.energy(
            this.pointsArray[i][j].s,
            this.pointsArray[i][j].neighbors,
            this.squids[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].h)
          e1 = this.energy(
            disp,
            this.pointsArray[i][j].neighbors,
            this.squids[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].h)
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
      this.squids.forEach((squidArray) => squidArray.forEach((squid) => {
        squid.h.set(0,0)
      }))
      //
      if(this.feedbackMode == 'direct'){
        //basic pattern
        this.squids.forEach((squidArray) => squidArray.forEach((squid) => {
          squid.h.set(squid.m.x*feedback,squid.m.y*feedback)
        }))
      } else if (this.feedbackMode == 'checker') {
        //checker pattern
        this.squids.forEach((squidArray) => squidArray.forEach((squid) => {
          squid.neighbors.forEach((neighborSquid) => {
            squid.h.addScaledVector(neighborSquid.m,feedback)
          })
        }))
      }
      this.getLocalMagnetizations()
    }

    getLocalMagnetizations(){
      this.squids.forEach((a) => a.forEach((squid) => squid.m.set(0,0)))
      for(i = 0; i<this.horizSize; i++){
        for(j = 0; j<this.vertSize; j++){
          m.set(
            Math.cos(2*Math.PI*this.pointsArray[i][j].s),
            Math.sin(2*Math.PI*this.pointsArray[i][j].s)
          )
          this.squids[Math.floor(i/this.squidSize)][Math.floor(j/this.squidSize)].m.add(m)
        }
      }
      this.squids.map(a => a.map(squid => squid.m.multiplyScalar(1/this.squidSize)))
    }

    getTotalMagnetization(){
      this.getLocalMagnetizations()
      this.totalMagnetization.set(0,0)
      this.squids.forEach((a) => {a.forEach((squid) => {this.totalMagnetization.add(squid.m)})})
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

    switchMode(){
      if (this.feedbackMode == 'direct'){
        this.feedbackMode = 'checker'
        console.log(this.feedbackMode + 'feedback mode')
      } else if (this.feedbackMode == 'checker') {
        this.feedbackMode = 'direct'
        console.log(this.feedbackMode + 'feedback mode')
      }
    }

}

module.exports = Physics
