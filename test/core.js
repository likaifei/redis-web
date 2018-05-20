var core = require('../lib/core')

var c =new core()
c.cmd('keys', ['*'], function(Err, result){
    console.log(Err, JSON.stringify(result))
})
