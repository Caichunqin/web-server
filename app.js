const Koa = require('koa')
const compress = require('koa-compress')
const koaRouter = require('koa-router')
const koaStatic = require('koa-static')
const proxy = require('koa-proxies')
const koaViews = require('koa-view')
const { historyApiFallback } = require('koa2-connect-history-api-fallback')
const formate = require('date-fns/format')
const getNowString = () => formate(Date.now(), 'YYYY-MM-DDTHH:mm:ss')

const path = require('path')
const { proxyTarget } = require('./config')
const staticPath = path.join(__dirname, './www')

const app = new Koa()
const router = koaRouter()

// 白名单 
app.use(historyApiFallback({ whiteList: Object.keys(proxyTarget) }))
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*");
  await next()
})
app.use(compress())
app.use(router['routes']())
app.use(koaViews(staticPath, { map: { html:'ejs', options: { cache: true } } }))
app.use(async (ctx, next) => {
  // 首页无缓存
  if (['/', '/index', '/index.html'].includes(ctx.path)) {
    ctx.set('Cache-control', 'no-store')
    return await ctx.render('index')
  }
  await next()
})
app.use(koaStatic(staticPath, {
  // 静态资源最大缓存时间：365天
  maxage: 365 * 24 * 3600 * 1000
}))

// 接口请求进行代理
useProxy()

app.listen(3000)
console.log(`${getNowString()}: app start at port 3000...`)

function useProxy () {
  Object.keys(proxyTarget).forEach(i => {
    app.use(proxy(i, {
      target: proxyTarget[i],
      changeOrigin: true,
      logs: true
    }))
  })
}
