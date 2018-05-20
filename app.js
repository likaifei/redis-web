var core = require('./lib/core')
var bodyParser = require('body-parser') 
var fs = require('fs')
var multer = require('multer')
var express = require('express')
var app = express()
var log = console.log
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
var cli = new core() 
app.use(express.static('public'))
//app.use(multer())
app.post('/', 
        function(req, res){
        var body = req.body
        if(!body || !body.method|| !body.args) return res.end(JSON.stringify({success: false, data: 'error post format!'}))
        cli.cmd(body.method, body.args, function(err, result){
            if(err) return res.end(JSON.stringify({success: false, data: 'error: ' + err}))
            var r = {success: true, data: result}
            return res.end(JSON.stringify(r))

            
        })
        })
        
 app.listen(1000)       
