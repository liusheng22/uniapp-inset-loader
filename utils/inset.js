// const { compile, parseComponent } = require('vue-template-compiler')
const deepmerge = require('deepmerge')
var serialize = require('serialize-javascript')
const { compile, parseComponent } = require('vue-template-compiler')
const { renderScriptTemplate } = require('../snippet/render.js')
const {
  logsMethods,
  logsMounted,
  compilerScript,
  logsMethodsTemplate,
  logsMountedTemplate,
  compilerScriptTemplate
} = require('../snippet/script.js')
const { generateStyleCode, generateHtmlCode } = require('./index')

const titleSelector = ''

const pageInsetCode = (sourceCompiler, content, insetCompiler, curPage) => {
  const compiler = {}
  const {
    template: sourceTemplate,
    script: sourceScript,
    styles: sourceStyles,
    customBlocks: sourceCustomBlocks
  } = sourceCompiler || {}
  const {
    template: insetTemplate,
    script: insetScript,
    styles: insetStyles,
    customBlocks: insetCustomBlocks
  } = insetCompiler || {}
  const scriptDefaultReg = new RegExp(/(export\s*default\s*{)([\s\S]*)(})/g)
  const sourceScriptDefaultContent = sourceScript.content.replace(
    scriptDefaultReg,
    '$2'
  )
  const insetScriptDefaultContent = insetScript.content.replace(
    scriptDefaultReg,
    '$2'
  )
  const insetFn = new Function(`return {${insetScriptDefaultContent}}`)
  const sourceFn = new Function(`return {${sourceScriptDefaultContent}}`)
  const insetFnResult = insetFn()
  const sourceFnResult = sourceFn()
  const { data: insetFnData = () => ({}) } = insetFnResult || {}
  const { data: sourceFnData = () => ({}) } = sourceFnResult || {}
  const newFnData = deepmerge.all([insetFnData(), sourceFnData()])
  const defaultData = newFnData || {}
  const newScripts = deepmerge.all([sourceFnResult, insetFnResult])
  delete newScripts.data
  let scriptsStr = serialize(newScripts, {
    space: 2,
    unsafe: true
  })
  scriptsStr = scriptsStr.replace(/"([^"]+)":/g, '$1:')
  console.log(
    '🚀 ~ file: inset.js:81 ~ pageInsetCode ~ scriptsStr:',
    scriptsStr
  )
  // `data: function()` 改为 `data()`
  scriptsStr = scriptsStr.replace(/data\s*:\s*function\s*\(/g, 'data(')

  // template
  // eslint-disable-next-line
  const insertReg = new RegExp(`(<\/${curPage.ele}>$)`)
  const templateCode = generateHtmlCode(
    sourceTemplate.content,
    insetTemplate.content,
    insertReg
  )

  // style
  const stylesResult = deepmerge.all([sourceStyles, insetStyles])
  const stylesStr = generateStyleCode(stylesResult || [])

  // compiler
  sourceCompiler.script.content = scriptsStr
  sourceCompiler.template.content = templateCode
  sourceCompiler.styles = stylesResult

  return {
    defaultData,
    scripts: scriptsStr,
    styles: stylesStr,
    template: templateCode,
    compiler: sourceCompiler
  }
}

/**
 *
 * @param {*} sourceCompiler 源代码的编译结果
 * @param {*} content 源代码
 * @param {*} insetCompiler 插入代码的编译结果
 * @param {*} curPage 当前页面的信息
 * @returns
 */
const insetCodeModuleSnippets = (
  sourceCompiler,
  content,
  insetCompiler,
  curPage
) => {
  let compiler = {}
  const {
    template: sourceTemplate,
    script: sourceScript,
    styles: sourceStyles,
    customBlocks: sourceCustomBlocks
  } = sourceCompiler || {}
  const {
    template: insetTemplate,
    script: insetScript,
    styles: insetStyles,
    customBlocks: insetCustomBlocks
  } = insetCompiler || {}

  // 如果有自定义模块(renderjs)模块，则不进行代码何必操作
  const isInsetHasCustomBlocks = insetCustomBlocks && insetCustomBlocks.length
  const isSourceHasCustomBlocks =
    sourceCustomBlocks && sourceCustomBlocks.length
  if (isInsetHasCustomBlocks || isSourceHasCustomBlocks) {
    return {
      content,
      compiler: sourceCompiler
    }
  } else {
    const { insetCode = [], insetLabel = [] } = curPage || {}
    const isPageHasInsetCode = insetCode && insetCode.length
    const isPageHasInsetLabel = insetLabel && insetLabel.length
    // 判断是 插入代码 还是 插入标签
    if (isPageHasInsetCode) {
      const { defaultData, scripts, styles, template } = pageInsetCode(
        sourceCompiler,
        content,
        insetCompiler,
        curPage
      )
      // 字符串scripts = `{}` 在scripts的第一个'{'后面插入我们的代码
      const scriptReg = new RegExp(/({)/)
      const finalScripts = scripts.replace(
        scriptReg,
        `$1 data() {
          return ${JSON.stringify(defaultData)}
        },`
      )

      content = `
        <template>
          ${template}
        </template>
        <script>
        export default ${finalScripts}
        </script>
        ${styles}
      `
    }

    return {
      content,
      compiler: sourceCompiler
    }
  }
  if (sourceCustomBlocks && sourceCustomBlocks.length) {
    const rewriteBlocks = []
    sourceCustomBlocks.forEach((customBlock) => {
      const { content: customContent, attrs } = customBlock || {}
      const { lang } = attrs || {}
      if (!customContent) {
        rewriteBlocks.push(customBlock)
        return
      }
      if (lang !== 'renderjs') {
        rewriteBlocks.push(customBlock)
        return
      }
      if (customBlock.type !== 'script') {
        rewriteBlocks.push(customBlock)
        return
      }

      //   var str = 'export default {\n' +
      // '  data() {\n' +
      // 'console.log(111)' +
      // '  }}\n'
      // 获取 export default { 之后的内容 & 去除最后一个 }
      // const str = str.replace(/(export\s*default\s*{)([\s\S]*)(})/g, '$2')

      // 获取 export default 中的内容
      // const scriptDefaultReg = new RegExp(/(export\s*default\s*{)([\s\S]*)(})/g)
      // const scriptDefaultContent = customContent.replace(scriptDefaultReg, '$2')

      let newContent = ''
      const defaultReg = new RegExp(/(export\s*default\s*{)/g)
      // 正则找到 `mounted() {` 字符串
      const mountedReg = new RegExp(/(mounted\s*\(\)\s*{)/g)
      // 判断是否已经存在mounted方法
      if (mountedReg.test(customContent)) {
        newContent = customContent.replace(mountedReg, `$1 ${logsMounted}`)
      } else {
        newContent = customContent.replace(
          defaultReg,
          `$1 ${logsMountedTemplate}`
        )
      }
      // 正则找到 `methods: {/` 字符串
      const methodsReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (methodsReg.test(customContent)) {
        // 在该字符串之后插入我们的代码
        newContent = newContent.replace(
          methodsReg,
          `$1 ${logsMethods(titleSelector)}`
        )
      } else {
        // 在该字符串之后插入我们的代码
        newContent = newContent.replace(
          defaultReg,
          `$1 ${logsMethodsTemplate(titleSelector)}`
        )
      }

      // script 中的 methods: { 插入代码
      const scriptReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (scriptReg.test(sourceScript.content)) {
        // 在该字符串之后插入我们的代码
        sourceCompiler.sourceScript.content = sourceScript.content.replace(
          scriptReg,
          `$1 ${compilerScript}`
        )
      } else {
        // 在该字符串之后插入我们的代码
        sourceCompiler.sourceScript.content = sourceScript.content.replace(
          defaultReg,
          `$1 ${compilerScriptTemplate}`
        )
      }

      rewriteBlocks.push({
        ...customBlock,
        content: newContent
      })
    })

    const customTemplate = rewriteBlocks
      .map((item) => {
        const { content, attrs } = item || {}
        const { module, lang } = attrs || {}
        const moduleStr = module ? `module='${module}'` : ''
        const langStr = lang ? `lang='${lang}'` : ''
        return `<script ${moduleStr} ${langStr}>
        ${content}
      </script>`
      })
      .join('\n')

    // 重新赋值
    content = `
      <template>
        ${sourceCompiler.template.content}
      </template>
      <script>
        ${sourceCompiler.script.content}
      </script>
      ${customTemplate}
      ${generateStyleCode(sourceCompiler.styles || [])}
    `
  } else {
    const insertReg = new RegExp(`(<\/${curPage.ele}>$)`)
    // 在匹配的标签之前插入组件的代码
    const templateCode = generateHtmlCode(
      sourceTemplate.content,
      insetTemplate.content,
      insertReg
    )
    content = `
      <template>
        ${templateCode}
      </template>
      <script>
        ${sourceScript.content}
      </script>
      ${generateStyleCode(insetStyles || [])}
      ${generateStyleCode(sourceStyles || [])}
    `
    compiler = parseComponent(content)
    // ${renderScriptTemplate(titleSelector)}
  }

  return {
    content,
    compiler
  }
}

module.exports = insetCodeModuleSnippets
