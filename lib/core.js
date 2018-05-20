var redis = require('redis')

var _private

var Core = function(port = 6379, host = '127.0.0.1', config = {}, auth){
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


