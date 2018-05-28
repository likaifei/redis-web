layui.use(['element','layer', 'form'], function(){
    //弹框提示依赖
    var layer = layui.layer
    //选项卡依赖
    var element = layui.element
    //选项卡模板
    Vue.component('key-tab', {
        template: '\
        <li v-bind:lay-id="name">\
        <span :title="t_cmd" @dblclick="edit(true)" v-if="!editing">{{ name }}</span>\
        <input v-model="t_cmd" v-if="editing" @keyup.enter="edit(false)" @blur="cancel">\
        <span title="ttl" v-on:click="changettl(true)" class="layui-badge layui-bg-gray" v-if="!editttl">{{ ttl }}</span>\
        <input v-model="t_ttl" v-if="editttl" @blur="cancel" @keyup.enter="changettl(false)">\
        <span title="size" class="layui-badge layui-bg-gray">{{ size }}</span>\
        <span v-on:click="$emit(\'refresh\')">&nbsp;<i class="layui-icon layui-icon-refresh-1"></i></span>\
        <span title="remove" class="layui-badge layui-bg-gray" v-on:click="$emit(\'remove\')">X</span>\
        </li>\
        ',
        props: ['name','size','ttl','cmd','index'],
        data: function(){
            return{ t_cmd: this.cmd, editing: false, editttl: false,t_ttl: this.ttl}
        },
        methods:{
            //修改命令并执行  在命令框敲回车触发
            edit: function(tof){
                this.editing = tof
                if(!tof){
                    this.$emit('edit',this.index, this.t_cmd)
                }else{
                    this.$nextTick(function(){
                        this.$el.firstElementChild.focus()
                    })
                }
                
            },
            //修改过期时间
            changettl:function(tof){
                this.editttl = tof
                if(!tof){
                    this.$emit('setttl',this.name, this.t_ttl)
                }else{
                    this.$nextTick(function(){
                        this.$el.childNodes[6].select()
                    })
                }
            },
            //取消编辑, 焦点离开输入框时触发
            cancel: function(){
                this.editing = false
                this.editttl = false
            }
        },
        watch:{
            //监听过期时间变化, 触发更新
            ttl:function(){
                this.t_ttl = this.ttl
            }
        }
    })
    //数据显示模板
    Vue.component('key-info', {
        template: '\
        <div class="layui-tab-item" style="overflow:auto;height:600px">\
        <table style="word-wrap:break-word;word-break:break-all;width:95%" border="1"><tr><th>key</th><th>value</th></tr>\
        <tr\
            v-for="(v, key) in context"\
            >\
        <td>{{ key }}</td><td>{{ v }}</td> \
        </tr>\
        </table>\
        </div>\
        ',
        props: ['context']
    })
    //键列表模板
    Vue.component('key-item', {
        template: '\
        <li style="width:45%;margin:5px;" class="layui-btn" v-on:click="$emit(\'get\')">\
        {{ name }}\
        </li>\
        ',
        props: ['name']
    })
    //命令行数据
    var cmdData = {
        cmd : '',
        result: ''
    }
    //键列表数据
    var keyList = {
        filter: '',
        keys: [
            {
            },
        ],
    }
    //键数据
    var keyData = {
        keys: [
        ]
    }
    //封装命令请求
    function cmd(method, args){
        if(typeof(args) != 'object') args = [args]
        cmdData.result += method + ' ' + args.join(' ') + '\n'
        return axios.post('/', {
            method: method,
            args: args
        })
    }
    //命令返回后显示到数据区域
    function showKey(key, type, method, args){
        cmd(method, args).then((r)=>{
            if(typeof(r.data.data)=='string')r.data.data = [r.data.data]
            var index = -1
            var t_cmd = args.slice()
            t_cmd.unshift(method)
            t_cmd = t_cmd.join(' ')
            for(var i = 0; i < keyData.keys.length; i++){
                if(keyData.keys[i].name == key){
                    index=i
                    break;
                }
            }
            if(index == -1){
                keyData.keys.push( {
                "name": key,
                "data": r.data.data,
                "type": type,
                "cmd": t_cmd,
                "ttl": '--',
                "size": '--'
            })
            }else{
                Vue.set(keyData.keys, index, {
                "name": key,
                "data": r.data.data,
                "type": type,
                "cmd": cmd,
                "ttl": '--',
                "size": '--'
            })
            }
            function later(filter, key){
                return function(){
                    element.tabChange('tab', key)
                }
            }
            ttl(key, type)
            setTimeout(later('tab', key),300)
        }).catch((e)=>{layer.msg(e.data)})
    }
    //获取过期时间及键大小
    function ttl(key, type){
        var index
        cmd('ttl', key).then((r)=>{
            if(r.data.success){
                setData(key,'ttl',r.data.data)
            }
        })
        if(type == 'list'){
            cmd('llen', key).then((r)=>{
                if(r.data.success){
                    setData(key,'size',r.data.data)
                }
            })
        }else if(type == 'zset'){
            cmd('zcard', key).then((r)=>{
                if(r.data.success){
                    setData(key,'size',r.data.data)
                }
            })
        }else if(type == 'hash'){
            cmd('hlen', key).then((r)=>{
                if(r.data.success){
                    setData(key,'size',r.data.data)
                }
            })
        }
    }
    //设置键数据的某个字段
    function setData(key, method, value){
        var index = findIndex(key)
        if(key != -1) keyData.keys[index][method] = value
    }
    //查找某键在键数据的index
    function findIndex(key){
        for(var i = 0; i < keyData.keys.length; i++){
            if(keyData.keys[i].name == key){
                return i
            }
        }
        return -1
    }
    //获取某个键的数据
    function getKey(key, type = 'none', method = null, args = null){
        if(type == 'none'){
            return cmd('type', key).then(function(result){
                var data = result.data
                if(data.data != 'none')return getKey(key, data.data, method, args)
                layer.msg('error type: ' + data.data)
            }).catch(function(err){
                layer.msg(err)
            })
        }else{
            if(method && args){
                return showKey(key, type, method, args)
            }
           if(type == 'string'){
            showKey(key, type, 'get', [key])
           }else if(type == 'list'){
            showKey(key, type, 'lrange', [key, 0, 99])
           }else if(type == 'hash'){
            showKey(key, type, 'hgetall', [key])
           }else if(type == 'zset'){
            showKey(key, type, 'zrange', [key, 0, 99, 'WITHSCORES'])
           }else{
               layer.msg('unknow type: ' + type)
           }

        }
    }
    //更新键列表
    function refreshKeys(){
        cmd("keys", "*").then(function(response){
            if(response.status == 200 && response.data.success){
                keyList.keys = response.data.data.map(function(item){
                    return {type: 'none',
                        name: item
                    }
                })
            }else{
            layer.msg(response.data.msg)
            }
        }).catch(function(err){
            layer.msg(err.response.data)
        })
    } 
  
    //初始化命令框
    new Vue({
        el: '#exec',
        data:cmdData,
        methods: {
            //执行命令行文本
            exec: function(){
                var args = this.cmd.trim().split(' ')
                var method = args.shift()
                var self = this
                cmd(method, args).then((r)=>{
                    if(r.data.success) return self.result += JSON.stringify(r.data.data) + '\n'
                    self.result += r.data.msg
                }).catch((e)=>{
                    self.result += JSON.stringify(e.data)
                })
        }},
        watch:{
            //监听返回数据变动,显示到数据尾
            result: function(){
                this.$el.children[1].scrollTop = this.$el.children[1].scrollHeight
            }
        }
    })

    //初始化键选项卡
    new Vue({
        el: '#mainTab',
        data:keyData,
        methods: {
            //更新一个键
            refresh: function(key){
                getKey(key)
            },
            //设置一个键的过期时间
            setttl: function(key, t_ttl){
                cmd('EXPIRE', [key, t_ttl]).then((r)=>{
                    if(r.data.success){
                        ttl(key)
                        return layer.msg('设置TTL 成功!')
                    } 
                    layer.msg(r.data.msg)
                    
                }).catch((e)=>{
                    layer.msg(e.data)
                })
            },
            //修改一个键的查询命令并执行
            edit: function(index, t_cmd){
                var args = t_cmd.trim().split(' ')
                var method = args.shift()
                getKey(args[0], 'none', method, args)
            }
        }
    })
    
    //数据库选择加刷新
    new Vue({
        el: '#naav',
        data:{
            showSub: false,
            dbs:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
        },
        methods: {
            //更新键列表
            refreshKeys: refreshKeys,
            //修改数据库
            changeDB: function(db){
                this.showSub = false
                cmd('select', db).then((r)=>{
                    if(r.data.success) {
                        refreshKeys()
                        return layer.msg('切换成功')
                    }
                    layer.msg('切换失败: ' + r.data.msg)
                }).catch((e)=>{
                    layer.msg(e.data)
                })
            },
        }
    })
    
    //KEY列表
    new Vue({
        el: '#key-list',
        data:keyList,
        methods: {
            refreshKeys: refreshKeys,
            getKey: getKey,
        },
        computed:{
            //键列表筛选
            filted: function(){
                var filtedKeys = this.keys.slice()
                var filter = this.filter.trim()
                if(filter == '') return filtedKeys
                for(var i = filtedKeys.length - 1; i >= 0; i--){
                    if(filtedKeys[i].name.indexOf(filter) == -1) filtedKeys.splice(i, 1)
                }
                return filtedKeys
            }
        }
    })
 //页面完成后更新一次键列表
 refreshKeys()
});
