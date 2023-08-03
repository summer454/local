const express = require('express')
const mysql = require('mysql')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const Random = require('random-js');
const { v4: uuidv4 } = require('uuid');


const router = express.Router()

const db = mysql.createPool({
  host: '127.0.0.1',
  // 指定mysql数据库的端口3306
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'db_paper',
})

// 登录接口配置
router.post('/login', (req, res) => {
  const { username, password } = req.body
  const sql = 'SELECT token  from users WHERE username = ? AND password = ?'
  // 根据username和password查询数据库users, 如果没有, 返回提示错误的信息, 如果有, 返回登陆成功信息
  db.query(sql, [username, password], (err, results) => {
    if (err || results.length == 0) {
      res.send({
        status: 1,
        msg: '用户名或密码不正确!'
      })
    } else {
      res.send({
        status: 0,
        data: {
          token: results[0].token
        }
      })
    }
  })
})

// 获取用户信息接口配置
router.get('/userInfo', (req, res) => {
  const { token } = req.headers
  // console.log(token)
  // 'SELECT users._id, users.password, users.username, users.createTime, users.__v, users.token ,role.menus FROM users JOIN role ON users.role_id = role._id WHERE users.token = ?'
  const sql = 'SELECT username FROM users  WHERE users.token = ?'
  db.query(sql, [token], (err, results) => {
    if (err || results.length == 0) {
      console.log(err)
      res.send({
        status: 1,
        msg: '用户名或密码不正确!'
      })
    } else {
      res.send({
        status: 0,
        data: {
          username: results[0].username,
        }
      })
    }
  })
})

//分页获取品牌信息列表接口配置
router.get('/product/baseTrademark', (req, res) => {
  const { page, limit } = req.query
  const sql = `select * from tradeMark `
  db.query(sql, (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      res.send({
        status: 0,
        data: {
          total: results.length,
          records: results.slice(page * limit - limit, page * limit)
        }
      })
    }
  })
})


// 上传图片接口配置
// 1.设置图片上传目录和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    // 生成唯一的文件名
    const uniqueSuffix = 'images-' + Date.now()
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
})

// 创建multer中间件
const upload = multer({ storage: storage })

// 上传图片的路由
router.post('/manage/img/upload', upload.single('image'), (req, res) => {
  const imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`
  //console.log(imageUrl)
  if (!req.file) {
    return res.send({
      status: 1,
      error: '没有上传文件'
    })
  } else {
    res.send({
      status: 0,
      data: imageUrl
    })
  }

})

// 设置静态文件目录
router.use('/upload', express.static('uploads'))


//添加品牌接口配置
router.post('/product/baseTrademark/save', (req, res) => {
  const id = uuidv4()
  const createTime = Date.now()
  // console.log(id);
  const { tmName, logoUrl } = req.body

  db.query('insert into trademark(_id,tmName,logoUrl,createTime) values(?,?,?,?)', [id, tmName, logoUrl, createTime], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        message: '数据插入失败!'
      })
    } else {
      res.send({
        status: 0,
        msg: '数据添加成功',
        // data: {
        //   ...results
        // }
      })
    }
  })
})

// 更新品牌的接口配置
router.post('/product/baseTrademark/update', (req, res) => {
  const { id, tmName, logoUrl } = req.body
  const updateTime = Date.now()
  const sql = 'update trademark set tmName=? ,logoUrl=?,updateTime=? where _id=?'
  db.query(sql, [tmName, logoUrl, updateTime, id], (err, results) => {
    if (err || results.changedRows === 0) {
      res.send({
        status: 1,
        message: '该数据不存在,或未更新数据!'
      })
    } else {
      // console.log(results)
      res.send({
        status: 0,
        message: '数据更新成功!',
        //affectedRows:results.affectedRows,
      })
    }
  })
})

// 删除品牌接口配置
router.post('/product/baseTrademark/delete', (req, res) => {
  const { id } = req.body
  const sql = 'delete from trademark where _id = ?'
  db.query(sql, [id], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        message: '品牌删除失败!'
      })
    } else {
      res.send({
        status: 0,
        message: '品牌删除成功!'
      })
    }
  })
})

//删除图片的接口配置
router.post('/manage/img/delete', (req, res) => {
  const { imgName } = req.body
  // 这里根据图片文件名进行删除操作，可以是你具体的实现
  // 图片文件存储在一个名为/uploads的文件夹中
  const imagePath = path.resolve('./uploads', imgName)
  // 检查文件是否存在
  if (fs.existsSync(imagePath)) {
    // 删除文件
    fs.unlinkSync(imagePath)
    res.send({
      status: 0,
      message: '图片删除成功'
    })
  } else {
    res.send({
      status: 1,
      message: '图片删除失败'
    })
  }
})

//获取一级商品的接口配置
router.get('/admin/product/getCategory1', (req, res) => {
  const sql = `select * from category where category1Id = id and category2Id = '0' and category3Id = '0'`
  db.query(sql, (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      // results:  [ { name: '手机', parentId: '0' },{ name: '手机', parentId: '0' } ]
      // 得到results里的 name-->results[0].name
      // console.log(results)
      res.send({
        status: 0,
        data: [
          ...results
        ]
      })
    }
  })

})
//获取二级商品的接口配置
router.get('/admin/product/getCategory2', (req, res) => {
  const { category1Id } = req.query
  const sql = `select * from category where category1Id = ? and category2Id = id and category3Id = '0'`
  db.query(sql, [category1Id], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      res.send({
        status: 0,
        data: [
          ...results
        ]
      })
    }
  })

})
//获取三级商品的接口配置
router.get('/admin/product/getCategory3', (req, res) => {
  const { category2Id } = req.query
  const sql = `select * from category where category2Id = ? and category3Id = id`
  db.query(sql, [category2Id], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      // results:  [ { name: '手机', parentId: '0' },{ name: '手机', parentId: '0' } ]
      // 得到results里的 name-->results[0].name
      // console.log(results)
      res.send({
        status: 0,
        data: [
          ...results
        ]
      })
    }
  })

})

//获取对应分类下已有的属性与属性值接口配置
router.get('/admin/product/attrInfoList', (req, res) => {
  const { category1Id, category2Id, category3Id } = req.query
  const sql = 'select * from attribute where category1Id = ? and category2Id= ? and category3Id= ?'
  db.query(sql, [category1Id, category2Id, category3Id], (err, results) => {
    if (err) {
      // console.log(err)
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      // results = results.map((item,index)=>{
      // itemId = item.id
      // item.attrValueList =  item.attrValueList.split(',')
      // for(var i = 0;i < item.attrValueList.length;i++){ 
      //   item.attrValueList[i] = {
      //       id:uuidv4(),
      //       attrId:itemId,
      //       valueName :item.attrValueList[i],
      //       createTime:Date.now(),
      //       updateTime:Date.now()
      //   }
      // }
      // return item
      // })
      res.send({
        status: 0,
        data: [
          //results是数组
          ...results
        ]
      })
    }
  })
})

//添加属性接口配置
router.post('/admin/product/saveAttrInfo', (req, res) => {
  const { attrName, category1Id, category2Id, category3Id, categoryLevel, attrValueList } = req.body
  const id = uuidv4()
  const sql = 'insert into attribute(id,category1Id,category2Id,category3Id,attrName,attrValueList,categoryLevel) values(?,?,?,?,?,?,?)'
  db.query(sql, [id, category1Id, category2Id, category3Id, attrName, attrValueList, categoryLevel], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        message: '数据添加失败,或数据已存在!'
      })
    } else {
      res.send({
        status: 0,
        message: '数据添加成功!'
      })
    }
  })
})

//更新属性接口配置 update trademark set tmName=? ,logoUrl=?,updateTime=? where _id=?
router.post('/admin/product/editAttrInfo', (req, res) => {
  const { attrName, category1Id, category2Id, category3Id, categoryLevel, attrValueList, id } = req.body
  const sql = 'update attribute set category1Id = ?,category2Id = ?,category3Id = ?,attrName = ?,attrValueList = ?,categoryLevel = ? where id = ?'
  db.query(sql, [category1Id, category2Id, category3Id, attrName, attrValueList, categoryLevel, id], (err, results) => {
    if (err || results.changedRows === 0) {
      console.log(err)
      res.send({
        status: 1,
        message: '数据更新改失败，或未更新数据!'
      })
    } else {
      res.send({
        status: 0,
        message: '数据更新成功!'
      })
    }
  })
})


//删除属性接口配置
router.post('/admin/product/deleteAttr', (req, res) => {
  const { id } = req.body
  const sql = 'delete  from attribute where id = ?'
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        message: '数据删除失败!'
      })
    } else {
      res.send({
        status: 0,
        message: '数据删除成功!'
      })
    }
  })
})



//获取用户列表接口配置
router.get('/admin/acl/user', (req, res) => {
  const { page, limit, username } = req.query
  let sql = ''
  if (username) sql = 'select * from users where username like ?'
  else sql = 'select * from users '

  db.query(sql, [`%${username}%`], (err, results) => {
    if (err) {
      // console.log(err)
      res.send({
        status: 1,
        message: '获取用户列表异常, 请重新尝试'
      })
    } else {
      res.send({
        status: 0,
        data: {
          total: results.length,
          records: results.slice(page * limit - limit, page * limit)
        }
      })
    }
  })
})


//添加用户接口配置
router.post('/admin/acl/user/save', (req, res) => {
  const { username, password, nickName } = req.body
  const token = username + ' token'
  const createTime = new Date().toLocaleString()
  const allRolesList = '超级管理员,前台,运营,产品,前端,后端,测试,财务,运维,销售'
  // console.log( typeof createTime)
  const sql = 'insert into users(username ,password,nickName,createTime,token,allRolesList) values(?,?,?,?,?,?)'
  //判断用户是否已经存在, 如果存在, 返回提示错误的信息, 如果不存在, 保存到数据库
  db.query(sql, [username, password, nickName, createTime, token, allRolesList], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        message: '添加用户失败，用户已存在!'
      })
    } else {
      res.send({
        status: 0,
        message: '添加用户成功!'
      })
    }
  })
})


//更新用户接口配置
router.post('/admin/acl/user/update', (req, res) => {
  const { _id, username, password, nickName } = req.body
  const sql = 'update users set username = ?,password=?,nickName= ?  where _id = ?'
  db.query(sql, [username, password, nickName, _id], (err, results) => {
    if (err) {
      // console.log(err);
      res.send({
        status: 1,
        msg: '更新用户异常, 请重新尝试'
      })
    } else {
      res.send({
        status: 0,
        msg: '更新用户成功！'
      })
    }
  })
})


// 删除指定用户接口配置
router.post('/admin/acl/user/remove', (req, res) => {
  const { _id } = req.body
  const sql = 'delete from users where _id = ?'
  db.query(sql, [_id], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        message: '用户删除失败!'
      })
    } else {
      res.send({
        status: 0,
        message: '用户删除成功!'
      })
    }
  })
})


// 批量删除指定用户接口配置
router.post('/admin/acl/user/batchRemove', (req, res) => {
  const { idList } = req.body
  console.log(idList)
  const sql = `delete from users where _id in ( ${idList} )`
  db.query(sql, (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        message: '用户删除失败!'
      })
    } else {
      res.send({
        status: 0,
        message: '用户删除成功!'
      })
    }
  })
})

//获取职位列表接口配置
router.get('/admin/acl/user/toAssignRole', (req, res) => {
  const { _id } = req.query
  const sql = 'select allRolesList , assignRoles from users where _id = ?'
  db.query(sql, [_id], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '获取职位列表失败'
      })
    } else {
      res.send({
        status: 0,
        data: {
          allRolesList: results[0].allRolesList ? results[0].allRolesList.split(','):[],
          assignRoles: results[0].assignRoles? results[0].assignRoles.split(','):[]
        }
      })
    }

  })
})

//设置职位列表接口配置
router.post('/admin/acl/user/doAssignRole', (req, res) => {
  const { _id} = req.body
  let { assignRoles } = req.body
  // if(assignRoles) 
  assignRoles = assignRoles.join(',')
  // else assignRoles = ''
  const sql = 'update users set assignRoles = ?  where _id = ?'
  db.query(sql, [assignRoles,_id], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        msg: '设置职位列表失败'
      })
    } else {
      // console.log(  results[0]);
      res.send({
        status: 0,
        msg: '设置职位列表成功'
      })
    }

  })
})




// router.get('/admin/acl/user', (req, res) => {
//   const {page, limit, username} = req.query
//   const sql = 'select * from users where username = ?'
//   db.query(sql, [username],(err, users) => {
//     if (err) {
//       console.log(err)
//       res.send({
//         status: 1,
//         message: '获取用户列表异常, 请重新尝试'
//       })
//     } else {

//       const sql = 'select * from role'
//       db.query(sql, (err, roles) => {
//         if (err) {
//           // console.log(err)
//           res.send({
//             status: 2,
//             message: '获取用户角色列表异常, 请重新尝试'
//           })
//         } else {
//           res.send({
//             status: 0,
//             data: {
//               users: [...users],
//               roles: [...roles]
//             }
//           })
//         }
//       })

//     }
//   })
// })


// 显示分类列表的接口配置

router.get('/manage/category/list', (req, res) => {
  const { parentId } = req.query
  const sql = `select * from category where parentId = ?`
  db.query(sql, [parentId], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      res.send({
        status: 0,
        data: [
          ...results
        ]
      })
    }
  })
})



// 获取商品分页列表接口配置
router.get('/manage/product/list', (req, res) => {
  const { pageNum, pageSize } = req.query
  const sql = 'select * from product'
  db.query(sql, (err, results) => {
    // err, results 都是对象
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      res.send({
        status: 0,
        data: {
          pageNum: pageNum, //页码 0-2 / 3-5
          total: results.length,
          pages: 3,
          pageSize: pageSize,//每页条目数 = 3 规定
          list: results.slice(pageSize * pageNum - pageSize, pageSize * pageNum)
        }
      })
    }
  })

})

// 根据searchName搜索产品分页列表接口配置
router.get('/manage/product/search', (req, res) => {
  const { pageNum, pageSize, productName, productDesc } = req.query
  let sql
  if (productName) { sql = 'select * from product where  name like ?' }
  // MySQL 就会将 desc 视为字段名，而不会将其解释为关键字。需要注意的是，反引号是一种 MySQL 特有的语法，如果你在其他 SQL 实现中运行上面的查询语句，可能需要使用其他方式来解决保留关键字和 SQL 语法冲突的问题。
  if (productDesc) { sql = 'select * from product where `desc` like ?' }
  db.query(sql, [`%${productDesc || productName}%`], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        msg: '请求出错了'
      })
    } else {
      res.send({
        status: 0,
        data: {
          pageNum: pageNum, //页码
          total: 3,
          pages: 1,
          pageSize: pageSize,//每页条目数
          list: [...results]
        }
      })
    }
  })

})

// 根据分类ID获取分类接口配置


//对商品进行上架/下架处理接口配置
router.post('/manage/product/updateStatus', (req, res) => {
  // 配置 Content-Type 为json格式，不配置也可以，因为响应数据是以大括号{}开头的字符串，通常会默认转为json类型给客户端。
  // res.set('Content-Type', 'application/json')
  const { productId, status } = req.body
  const sql = 'update product set status = ? where _id = ?'
  db.query(sql, [status, productId], (err, results) => {
    if (err) {
      res.send({
        status: 1,
        message: '该数据不存在!'
      })
    } else {
      res.send({
        status: 0
      })
    }
  })
})





//添加商品的接口配置
router.post('/manage/product/add', (req, res) => {
  const id = uuidv4()
  const { categoryId, pCategoryId, name, desc, price, detail, imgs } = req.body
  const sql = 'insert into product(_id,categoryId, pCategoryId, name, `desc`, price, detail, imgs) values(?,?,?,?,?,?,?,?)'
  db.query(sql, [id, categoryId, pCategoryId, name, desc, price, detail, imgs], (err, results) => {
    if (err) {
      res.send({
        status: 1
      })
    } else {
      res.send({
        status: 0,
        data: {
          status: 1,
          imgs: imgs,
          _id: id,
          name: name,
          desc: desc,
          price: price,
          detail: detail,
          pCategoryId: pCategoryId,
          categoryId: categoryId,
          __v: 0
        }
      })
    }
  })
})

//更新商品的接口配置
router.post('/manage/product/update', (req, res) => {
  const { _id, categoryId, pCategoryId, name, desc, price, detail, imgs } = req.body

  const sql =
    'update product set _id = ?,categoryId = ?,pCategoryId = ?,name = ?,`desc` = ?,price = ?,detail = ?,imgs = ? where _id = ?'
  db.query(sql, [_id, categoryId, pCategoryId, name, desc, price, detail, imgs, _id], (err, results) => {
    if (err) {
      res.send({
        status: 1
      })
    } else {
      res.send({
        status: 0
      })
    }
  })
})



//添加角色列表接口配置
router.post('/manage/role/add', (req, res) => {
  const { roleName } = req.body
  const id = uuidv4()
  const create_time = Date.now()
  const sql = 'insert into role(name,_id,create_time,__v) values(?,?,?,?)'

  db.query(sql, [roleName, id, create_time, 0], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        status: 1,
        msg: '添加角色异常, 请重新尝试'
      })
    } else {
      res.send({
        status: 0,
        data: {
          menus: [],
          _id: id,
          name: roleName,
          create_time: create_time,
          __v: 0
        }
      })
    }
  })


})

// 更新角色（给角色设置权限）接口配置
router.post('/manage/role/update', (req, res) => {
  const { auth_name, auth_time, _id, } = req.body
  let { menus } = req.body //array 类型
  menus = menus.join(',')
  const sql = 'update role set menus = ?,auth_time=?,auth_name=? where _id = ?'
  db.query(sql, [menus, auth_time, auth_name, _id], (err, results) => {
    if (err) {
      // console.log(err)
      res.send({ status: 1, msg: '更新角色异常, 请重新尝试' })
    }
    else {
      res.send({
        status: 0,
        data: {
          menus: menus,
          _id: _id,
          __v: 0,
          auth_time: auth_time,
          auth_name: auth_name
        }
      })
    }
  })
})

module.exports = router