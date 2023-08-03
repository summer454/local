const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')


const router = require('./router/index.js')

const app = express()

app.use(cors())



// 使用body-parser解析x-www-form-urlencoded格式(表单数据)请求体
app.use(bodyParser.urlencoded({ extended: false })); 
// 解析JSON 格式请求体
app.use(bodyParser.json()); 

app.use(router)


app.listen(4000, () => {
  console.log("api server running at http://127.0.0.1:4000");
})