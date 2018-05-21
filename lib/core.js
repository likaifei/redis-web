var redis = require('redis')
var c = require('../config')
var _private

var Core = function(port = c.PORT, host = c.HOST, config = {}, auth = c.AUTH){
    self = this
    this.cli = redis.createClient(port, host, config)
    if(auth)this.cli.auth(auth)
    this.ready = true 
}


Core.prototype.cmd = function(method, args = [], cb){
    if(!this.ready) return cb('Not ready')
    this.cli[method](args, cb)
}

module.exports = Core


