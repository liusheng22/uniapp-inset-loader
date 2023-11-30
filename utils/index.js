const fs = require('fs')
const path = require('path')
const stripJsonComments = require('strip-json-comments')
const { toCamelCase } = require('./format')

// 反序列化后的pages.json对象
let pagesJson = {}
// 此loader配置对象
let insetLoader = {}
// pages.json文件所在目录
let rootPath = process.env.UNI_INPUT_DIR || `${process.env.INIT_CWD}\\src`

// 在template中用正则匹配并替换一段代码
const generateHtmlCode = (template, labelCode, regLabel) => {
  // 去除html所有注释和首尾空白
  const regNotes = /<!--((?!(#ifdef|#ifndef|#endif)).|[\r\n])*?-->/g
  const regBlank = /^\s+|\s+$/g
  return template
    .replace(regNotes, '')
    .replace(regBlank, '')
    .replace(regLabel, `${labelCode}$1`)
}

// 获取到需要插入的所有label标签
// const generateLabelCode = (labelArr) => labelArr.map(e => insetLoader.config[e] || '').join('')

const generateLabelCode = (labelArr) => {
  let labelCode = ''
  labelArr.forEach((label) => {
    const labelCamelCase = toCamelCase(label)
    labelCode += `<${label} ref="${labelCamelCase}"></${label}>`
  })
  return labelCode
}

// 根据compiler组合成style标签字符串代码
const generateStyleCode = (styles) =>
  styles.reduce((str, item) => {
    const { lang, scoped, content } = item || {}
    const langStr = lang ? `lang='${lang}'` : ''
    const scopedStr = scoped ? `scoped='${scoped}'` : ''
    return (str += `<style ${langStr} ${scopedStr}>
    ${content}
  </style>`)
  }, '')

// 分析pages.json，生成路由和配置的映射对象
const getPagesMap = () => {
  // 获取主包路由配置
  const pages = pagesJson.pages || []
  // console.log("🚀 ~ file: index.js:47 ~ getPagesMap ~ pages:", pages)
  const subpackages = pagesJson.subpackages || pagesJson.subPackages || []
  return pages.reduce(
    (obj, item) => {
      const curPage = getLabelConfig(item)
      curPage.isInset && (obj[`/${item.path}`] = curPage)
      return obj
    },
    subpackages.reduce((obj, item) => {
      // 获取分包路由配置
      const root = item.root
      item.pages.forEach((item) => {
        const curPage = getLabelConfig(item)
        curPage.isInset && (obj[`/${root}/${item.path}`] = curPage)
      })
      return obj
    }, {})
  )
}

// 生成path对应的对象结构
const getLabelConfig = (json) => {
  const isCurrInset =
    json.style && (json.style.insetLabel || json.style.insetCode)
  const isInset =
    isCurrInset || insetLoader.insetLabel.length || insetLoader.insetCode.length
  return {
    isInset,
    insetLabel: (json.style && json.style.insetLabel) || insetLoader.insetLabel,
    insetCode: (json.style && json.style.insetCode) || insetLoader.insetCode,
    ele: (json.style && json.style.rootEle) || insetLoader.rootEle
  }
}

// 反序列化page.json并缓存，
// 并根据page.json分析是否有效并且需要后续逻辑处理
const initPages = (that) => {
  let pagesPath = (that.query || {}).pagesPath
  if (!pagesPath) {
    // 默认读取pages.json
    pagesPath = path.resolve(rootPath, 'pages.json')
  } else {
    // 如有传自定义pagesPath，则截取出所在目录作为rootPath，用于后续匹配路由
    rootPath = path.resolve(pagesPath, '../')
  }
  pagesJson = JSON.parse(stripJsonComments(fs.readFileSync(pagesPath, 'utf8')))
  return initInsetLoader()
}

// 给非必填项设置缺省值，缺少主要对象返回false
const initInsetLoader = () => {
  insetLoader = pagesJson.insetLoader || {}
  // label：全局标签配置
  // rootEle：根元素的类型,也支持正则,如匹配任意标签.*
  insetLoader.insetLabel = insetLoader.insetLabel || []
  insetLoader.insetCode = insetLoader.insetCode || []
  insetLoader.rootEle = insetLoader.rootEle || 'view'
  // const { insetLabel, insetCode } = insetLoader

  // 无配置则不予处理
  // const effective = insetCode.length || insetLabel.length
  // return effective
  return true
}

// 根据resourcePath获取路由
const getRoute = (resourcePath) =>
  resourcePath.replace(rootPath, '').replace('.vue', '').replace(/\\/g, '/')

module.exports = {
  generateHtmlCode,
  generateLabelCode,
  generateStyleCode,
  initInsetLoader,
  getPagesMap,
  initPages,
  getRoute
}
