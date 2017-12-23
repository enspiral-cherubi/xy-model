const Environment = require('./environment')
const View = require('./view')
const $ = require('jquery')
const loop = require('raf-loop')

class Engine {

  constructor () {
    this.environment = new Environment()
    this.view = new View()
  }

  bindEventListeners () {
    $(window).load(this.view.closeLoadingScreen)
    $(window).on("keypress",(e) => this.environment.keypress(e))
    $(window).on("keydown",(e) => this.environment.keydown(e))
    $(window).on("mousemove", (e) => this.environment.mousemove(e))
    $(window).on("keyup", (e) => this.environment.keyup(e))
  }

  start () {
    loop(t => {
      this.environment.render()
    }).start()
  }

}

module.exports = Engine
