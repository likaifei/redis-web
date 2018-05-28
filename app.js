var core = require('./lib/core')
var bodyParser = require('body-parser') 
var fs = require('fs')
//var multer = require('multer')
var express = require('express')
var app = express()
var log = console.log

//接受JSON格式的POST
//前端js使用的是这种POST方式
app.use(bodyParser.json())
//接受URLENCODED格式的POST
app.use(bodyParser.urlencoded({extended: true}))

//启动REDIS客户端
var cli = new core() 
//PUBLIC目录下放的是一个html 和一个js 可以看做客户端
app.use(express.static('public'))
//下面的可以支持多字段POST POSTMAN默认是使用这种POST方式  CURL -F 是这种方式
//app.use(multer())

//唯一调用
app.post('/', 
        function(req, res){
        var body = req.body
        //请求格式判断, 必须有method(命令) args(参数)
        if(!body || !body.method|| !body.args) return res.end(JSON.stringify({success: false, data: 'error post format!'}))
        //调用redis客户端执行并返回
        cli.cmd(body.method, body.args, function(err, result){
            if(err) return res.end(JSON.stringify({success: false, data: 'error: ' + err}))
            var r = {success: true, data: result}
            return res.end(JSON.stringify(r))
        })
        })
        
//开启服务 监听1000端口
 app.listen(1000)
