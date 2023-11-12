const { parseComponent } = require('vue-template-compiler')
const {
  generateHtmlCode,
  generateLabelCode,
  generateStyleCode,
  getPagesMap,
  initPages,
  getRoute
} = require('./utils')

// 是否初始化过
let _init = false
// 是否需要做处理
let needHandle = false
// 路由和配置的映射关系
let pagesMap = {}

const { methods, mounted, reportScript, methodsTemplate, mountedTemplate, reportScriptTemplate } = require('./template.js')

module.exports = function(content) {
  if (!_init) {
    _init = true
    init(this)
  }

  // 配置无效不予处理
  if (!needHandle) {
    return content
  }

  // 获取当前文件的小程序路由
  const route = getRoute(this.resourcePath)
  // 根据路由并找到对应配置
  const curPage = pagesMap[route]
  if (curPage) {
    // 解析sfc
    const compiler = parseComponent(content)
    Object.keys(pagesMap).forEach(() => {
      const { customBlocks, script } = compiler || {}
      if (customBlocks && customBlocks.length) {
        const rewriteBlocks = []
        customBlocks.forEach((customBlock) => {
          const { content: customContent, attrs } = customBlock || {}
          const { lang } = attrs || {}
          if (lang !== 'renderjs') {
            rewriteBlocks.push(customBlock)
            return
          }
          if (!customContent) {
            rewriteBlocks.push(customBlock)
            return
          }
          let newContent = ''
          const defaultReg = new RegExp(/export\s*default\s*{/g)
          // 正则找到 `mounted() {` 字符串
          const mountedReg = new RegExp(/mounted\s*\(\)\s*{/g)
          // 判断是否已经存在mounted方法
          if (mountedReg.test(customContent)) {
            // 在该字符串之后插入我们的代码
            newContent = customContent.replace(mountedReg, `mounted() {${mounted}`)
          } else {
            // 在该字符串之后插入我们的代码
            newContent = customContent.replace(defaultReg, `export default {${mountedTemplate}`)
          }
          // 正则找到 `methods: {/` 字符串
          const methodsReg = new RegExp(/methods\s*:\s*{/g)
          // 判断是否已经存在methods方法
          if (methodsReg.test(customContent)) {
            // 在该字符串之后插入我们的代码
            newContent = newContent.replace(methodsReg, `methods:{${methods}`)
          } else {
            // 在该字符串之后插入我们的代码
            newContent = newContent.replace(defaultReg, `export default {${methodsTemplate}`)
          }

          // script 中的 methods: { 插入代码
          const scriptReg = new RegExp(/methods\s*:\s*{/g)
          // 判断是否已经存在methods方法
          if (scriptReg.test(script.content)) {
            // 在该字符串之后插入我们的代码
            compiler.script.content = script.content.replace(scriptReg, `methods: {${reportScript}`)
          } else {
            // 在该字符串之后插入我们的代码
            compiler.script.content = script.content.replace(defaultReg, `export default {${reportScriptTemplate}`)
          }

          rewriteBlocks.push({
            ...customBlock,
            content: newContent
          })
        })

        const customTemplate = rewriteBlocks.reduce((str, item) => {
          return str += `<script ${item.attrs.module ? (`module='${item.attrs.module}'`) : ''} ${item.attrs.lang ? (`lang='${item.attrs.lang}'`) : ''}>
          ${item.content}
          </script>`
        })

        // 重新赋值
        content = `
          <template>
            ${compiler.template.content}
          </template>
          <script>
            ${compiler.script.content}
          </script>
          ${customTemplate}
          </script>
          ${generateStyleCode(compiler.styles || [])}
        `
      } else {
        // 生成标签代码
        const labelCode = generateLabelCode(curPage.label)
        // 匹配标签位置
        // eslint-disable-next-line no-useless-escape
        const insertReg = new RegExp(`(<\/${curPage.ele}>$)`)
        // 在匹配的标签之前插入额外标签代码
        const templateCode = generateHtmlCode(
          compiler.template.content,
          labelCode,
          insertReg
        )
        // 重组style标签及内容
        const style = generateStyleCode(compiler.styles || [])
        content = `
          <template>
            ${templateCode}
          </template>
          <script>
            ${compiler.script.content}
          </script>
          ${style}
        `
      }
    })
  }
  return content
}

function init(that) {
  const platform = process.env.VUE_APP_PLATFORM
  const { VUE_APP_PLATFORMS = [] } = that.query || {}
  // 平台不一致不予处理
  if (!VUE_APP_PLATFORMS.includes(platform)) {
    return
  }
  // 允许的平台 app-plus mp-weixin mp-alipay mp-baidu mp-toutiao
  const allowPlatform = [/mp-[\w]+/, /app-plus/]
  const isLoader = allowPlatform.some(e => e.test(platform))
  // 首次需要对pages配置文件做解析，并判断是否为有效配置
  needHandle = isLoader && initPages(that)
  // 转换为路由和配置的映射对象
  needHandle && (pagesMap = getPagesMap())
}
