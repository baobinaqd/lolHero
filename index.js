//导入模块
const express = require('express')
const dbHelper = require('./libs/dbHelper')
const multer = require('multer')
const path = require('path')
const bodyParser = require('body-parser')
//导入验证码模块
const svgCaptcha = require('svg-captcha');
//导入cookie-session模块
const cookieSession=require('cookie-session')
//实例化服务器对象
const app = express()
//托管静态资源
app.use(express.static('views'))

//注册中间件
app.use(bodyParser.urlencoded({ extended: false }))
//注册中间件
app.use(cookieSession({
    name:'session',
    keys:['key1','key2'],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//请求中多了一个session
app.use((req,res,next)=>{
    if(req.url.indexOf('/hero')===0){
        //需要验证
        if(req.session.username){
            next();
        }else{
            res.send({
                msg:'请先登录',
                code:400
            })
        }
    }else{
        next();
    }
})
const upload = multer({
    dest: 'views/imgs/'
})

//1.英雄列表接口(路由) 带分页
app.get('/heroList', (req, res) => {
    // 接收数据 页码
    const pagenum = parseInt(req.query.pagenum)
    // 接收数据 页容量
    const pagesize = parseInt(req.query.pagesize)

    // 接收数据 查询条件
    const query = req.query.query

    // 获取所有数据
    dbHelper.find('cqlist', {}, result => {
        //查询出来要倒序
        result = result.reverse()
        // 检索出符合查询条件的数据
        const temArr = result.filter(v => {
            if (v.heroName.indexOf(query) != -1 || v.skillName.indexOf(query) != -1) {
                return true
            }
        })
        // 返回的数据
        let list = []
        // 计算起始索引
        const startIndex = (pagenum - 1) * pagesize
        // 计算结束索引
        const endIndex = startIndex + pagesize
        // 获取当前这一页的数据
        for (let i = startIndex; i < endIndex; i++) {
            if (temArr[i]) {
                list.push(temArr[i])
            }
        }
        // 获取总页数
        const totalPage = Math.ceil(temArr.length / pagesize)
        // 返回数据
        res.send({
            totalPage,
            list
        })
    })
})
//2.英雄详情接口
app.get('/heroDetail', (req, res) => {
    const id = req.query.id
    dbHelper.find('cqlist', {
        _id: dbHelper.ObjectId(id)
    }, result => {
        //取下标0
        res.send(result[0])
    })
})
//3.英雄新增
app.post('/heroAdd', upload.single('heroIcon'), (req, res) => {
    //文件信息
    // console.log(req.file);
    // console.log(req.body);
    const skillName = req.body.skillName
    const heroName = req.body.heroName
    //拼接路径
    const heroIcon = path.join('imgs', req.file.filename)
    //保存到数据库中
    dbHelper.insertOne('cqlist', {
        heroName,
        heroIcon,
        skillName
    }, result => {
        res.send({
            code: 200,
            msg: '添加成功!'
        })
    })
})
//4.英雄修改
app.post('/heroUpdate', upload.single('heroIcon'), (req, res) => {
    //文件信息
    // console.log(req.file);
    // console.log(req.body);
    const skillName = req.body.skillName
    const heroName = req.body.heroName
    const id = req.body.id
    const obj = {
        heroName,
        skillName,
    }
    //拼接路径
    if (req.file) {
        const heroIcon = path.join('imgs', req.file.filename)
        //添加到obj里面
        obj.heroIcon = heroIcon
    }

    //保存到数据库中
    dbHelper.updateOne('cqlist', {
        _id: dbHelper.ObjectId(id)
    }, obj, result => {
        res.send({
            code: 200,
            msg: '添加成功!'
        })
    })
})
//5.英雄删除
app.get('/heroDelete', (req, res) => {
    const id = req.query.id
    dbHelper.deleteOne('cqlist', {
        _id: dbHelper.ObjectId(id)
    }, result => {
        res.send({
            msg: '删除成功',
            code: 200
        })
    })
})

//6.用户注册路由
app.post('/register', (req, res) => {
    //post数据,通过req.body接收
    //查询
    dbHelper.find('userlist', {
        username: req.body.username
    }, result => {
        if (result.length == 0) {
            //说明数据库不存在,该用户名可以注册
            dbHelper.insertOne('userlist', req.body, result => {
                res.send({
                    msg: '欢迎你加入我们',
                    code: 200
                })
            })
        } else {
            //已经被注册
            res.send({
                msg: '用户名已经被注册,请换一个',
                code: 400
            })
        }
    })
})

//7.登录验证码 路由
app.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create();
    // console.log(captcha.text);
    req.session.vcode = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
})

//8用户登录 路由
app.post('/login',(req,res)=>{
    const username=req.body.username;
    const userpass=req.body.userpass;
    const vcode=req.body.vcode;
    //判断用户的验证码是否正确
    if(req.session.vcode.toLowerCase()===vcode.toLowerCase()){
        //验证码正确  判断用户名和密码
        dbHelper.find('userlist',{
            username,
            userpass
        },result=>{
            if(result.length!=0){
                req.session.username=username;
                //登录成功
                res.send({//携带用户信息回去
                    msg:'欢迎回来',
                    code:200,
                    username
                })
            }else{
                res.send({
                    msg:'用户名或密码错误',
                    code:400,
                }) 
            }
        })

    }else{
        res.send({
            msg:'验证码错误',
            code:401
        })
    }
})

//9用户登出 路由
app.get('/logout',(req,res)=>{
    //清空session
    req.session=null;
    //返回信息
    res.send({
        msg:'拜拜',
        code:200
    })
})

//开启监听
app.listen(8848)