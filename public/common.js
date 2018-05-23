layui.use(['element','layer', 'form'], function(){
    var layer = layui.layer
    var element = layui.element
    Vue.component('key-tab', {
        template: '\
        <li v-bind:lay-id="name">\
        {{ name }}\
        <span title="ttl" v-on:click="$emit(\'setttl\')" class="layui-badge layui-bg-gray">{{ ttl }}</span>\
        <span title="size" class="layui-badge layui-bg-gray">{{ size }}</span>\
        <span v-on:click="$emit(\'refresh\')">&nbsp;<i class="layui-icon layui-icon-refresh-1"></i></span>\
        <span title="remove" class="layui-badge layui-bg-gray" v-on:click="$emit(\'remove\')">X</span>\
        </li>\
        ',
        props: ['name','size','ttl']
    })
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
    
    Vue.component('key-item', {
        template: '\
        <li style="width:45%;margin:5px;" class="layui-btn" v-on:click="$emit(\'get\')">\
        {{ name }}\
        </li>\
        ',
        props: ['name']
    })

    var cmdData = {
        cmd : '',
        result: ''
    }
    var keyList = {
        filter: '',
        keys: [
            {
            },
        ],
    }
    var keyData = {
        keys: [
        ]
    }
    var ttlData = {
        ttl : -1,
        show : false,
        key : ''
    }

    function cmd(method, args){
        if(typeof(args) != 'object') args = [args]
        cmdData.result += method + ' ' + args.join(' ') + '\n'
        return axios.post('/', {
            method: method,
            args: args
        })
    }

    function showKey(key, type, method, args){
        cmd(method, args).then((r)=>{
            if(typeof(r.data.data)=='string')r.data.data = [r.data.data]
            var index = -1
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
                "type": 'string',
                "ttl": '--',
                "size": '--'
            })
            }else{
                Vue.set(keyData.keys, index, {
                "name": key,
                "data": r.data.data,
                "type": 'string',
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

    function setData(key, method, value){
        var index = findIndex(key)
        if(key != -1) keyData.keys[index][method] = value
    }
    function findIndex(key){
        for(var i = 0; i < keyData.keys.length; i++){
            if(keyData.keys[i].name == key){
                return i
            }
        }
        return -1
    }

    function getKey(key, type = 'none'){
        if(type == 'none'){
            return cmd('type', key).then(function(result){
                var data = result.data
                if(data.data != 'none')return getKey(key, data.data)
                layer.msg('error type: ' + data.data)
            }).catch(function(err){
                layer.msg(err)
            })
        }else{
           if(type == 'string'){
            showKey(key, type, 'get', key)
           }else if(type == 'list'){
            showKey(key, type, 'lrange', [key, 0, 99])
           }else if(type == 'hash'){
            showKey(key, type, 'hgetall', key)
           }else if(type == 'zset'){
            showKey(key, type, 'zrange', [key, 0, 99, 'WITHSCORES'])
           }else{
               layer.msg('unknow type: ' + type)
           }

        }
    }
    
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
    //ttl框,透明底框
    new Vue({
        el : "#fade",
        data: ttlData
    })
    //ttl框,主框
    function focusText(_self){
        return function(){
            _self.$refs.t_ttl.focus()
            _self.$refs.t_ttl.select()
        }
    }
    new Vue({
        el : "#light",
        data: ttlData,
        watch:{
            show:function(){
                if(this.show) setTimeout(focusText(this),100)
            }
        },
        methods:{
            ok:function(){
                this.show = false
                cmd('EXPIRE', [this.key, this.ttl]).then((r)=>{
                    if(r.data.success) return layer.msg('设置TTL 成功!')
                    layer.msg(r.data.msg)
                }).catch((e)=>{
                    layer.msg(e.data)
                })
            },
            cancel:function(){
                this.show = false
            }
        }
    })

    //命令框
    new Vue({
        el: '#exec',
        data:cmdData,
        methods: {
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
            result: function(){
                this.$el.children[1].scrollTop = this.$el.children[1].scrollHeight
            }
        }
    })

    //信息选项卡
    new Vue({
        el: '#mainTab',
        data:keyData,
        methods: {
            refresh: function(key){
                getKey(key)
            },
            setttl: function(key, ttl){
                ttlData.key = key
                ttlData.ttl = ttl
                ttlData.show = true
            }
        }
    })
    
    //数据库选择加刷新
    new Vue({
        el: '#naav',
        data:{
            showSub: false,
            dbs:[0,1,2,3,4,5,6,7,8,9,10]
        },
        methods: {
            refreshKeys: refreshKeys,
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

 refreshKeys()
});
