var redis = require('redis')
var c = require('../config')
var _private

//初始化REDIS客户端并连接
var Core = function(port = c.PORT, host = c.HOST, config = {}, auth = c.AUTH){
    self = this
    this.cli = redis.createClient(port, host, config)
    if(auth)this.cli.auth(auth)
    this.ready = true 
}

//执行命令并返回
Core.prototype.cmd = function(method, args = [], cb){
    if(!this.ready) return cb('Not ready')
    this.cli[method](args, cb)
}

module.exports = Core


