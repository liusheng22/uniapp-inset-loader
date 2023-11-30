const { logsMethods, logsMounted, compilerScript, logsMethodsTemplate, logsMountedTemplate, compilerScriptTemplate } = require('../snippet/script.js')
const { renderScriptTemplate } = require('../snippet/render.js')
const { generateStyleCode } = require('./index')

const insetCollectLogsSnippets = (compiler, content, query) => {
  const { titleSelector } = query || {}
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
      if (customBlock.type !== 'script') {
        rewriteBlocks.push(customBlock)
        return
      }
      if (!customContent) {
        rewriteBlocks.push(customBlock)
        return
      }
      let newContent = ''
      const defaultReg = new RegExp(/(export\s*default\s*{)/g)
      // 正则找到 `mounted() {` 字符串
      const mountedReg = new RegExp(/(mounted\s*\(\)\s*{)/g)
      // 判断是否已经存在mounted方法
      if (mountedReg.test(customContent)) {
        newContent = customContent.replace(mountedReg, `$1 ${logsMounted}`)
      } else {
        newContent = customContent.replace(defaultReg, `$1 ${logsMountedTemplate}`)
      }
      // 正则找到 `methods: {/` 字符串
      const methodsReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (methodsReg.test(customContent)) {
        // 在该字符串之后插入我们的代码
        newContent = newContent.replace(methodsReg, `$1 ${logsMethods(titleSelector)}`)
      } else {
        // 在该字符串之后插入我们的代码
        newContent = newContent.replace(defaultReg, `$1 ${logsMethodsTemplate(titleSelector)}`)
      }

      // script 中的 methods: { 插入代码
      const scriptReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (scriptReg.test(script.content)) {
        // 在该字符串之后插入我们的代码
        compiler.script.content = script.content.replace(scriptReg, `$1 ${compilerScript}`)
      } else {
        // 在该字符串之后插入我们的代码
        compiler.script.content = script.content.replace(defaultReg, `$1 ${compilerScriptTemplate}`)
      }

      rewriteBlocks.push({
        ...customBlock,
        content: newContent
      })
    })

    const customTemplate = rewriteBlocks.map((item) => {
      const { content, attrs } = item || {}
      const { module, lang } = attrs || {}
      const moduleStr = module ? (`module='${module}'`) : ''
      const langStr = lang ? (`lang='${lang}'`) : ''
      return `<script ${moduleStr} ${langStr}>
        ${content}
      </script>`
    }).join('\n')

    // 重新赋值
    content = `
      <template>
        ${compiler.template.content}
      </template>
      <script>
        ${compiler.script.content}
      </script>
      ${customTemplate}
      ${generateStyleCode(compiler.styles || [])}
    `
  } else {
    content = `
      <template>
        ${compiler.template.content}
      </template>
      <script>
        ${compiler.script.content}
      </script>
      ${renderScriptTemplate(titleSelector)}
      ${generateStyleCode(compiler.styles || [])}
    `
  }

  return content
}

module.exports = insetCollectLogsSnippets
