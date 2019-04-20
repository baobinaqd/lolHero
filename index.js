//导入模块
const express = require('express')
const dbHelper = require('./libs/dbHelper')
const multer = require('multer')
const path = require('path')

//实例化服务器对象
const app = express()
//托管静态资源
app.use(express.static('views'))
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
    const id=req.query.id
    dbHelper.find('cqlist',{
        _id:dbHelper.ObjectId(id)
    },result=>{
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
    const heroIcon = path.join('img', req.file.filename)
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
    //拼接路径
    const heroIcon = path.join('img', req.file.filename)
    //保存到数据库中
    dbHelper.updateOne('cqlist', {
        _id: dbHelper.ObjectId(id)
    }, {
        heroName,
        heroIcon,
        skillName,

    }, result => {
        res.send({
            code: 200,
            msg: '添加成功!'
        })
    })
})
//5.英雄删除
app.get('/heroDelete',(req,res)=>{
    const id=req.query.id
    dbHelper.deleteOne('cqlist',{
        _id:dbHelper.ObjectId(id)
    },result=>{
        res.send({
            msg:'删除成功',
            code:200
        })
    })
})
//开启监听
app.listen(8848)