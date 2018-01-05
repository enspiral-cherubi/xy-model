const THREE = require('three')

class Squid {
  constructor () {
    this.m = new THREE.Vector2(0,0)
    this.h = new THREE.Vector2(0,0)
    this.neighbors = []
    this.threshold = Math.random()
    this.on = true
  }

  addNeighbor (squid) {
    this.neighbors.push(squid)
  }
}

module.exports = Squid
