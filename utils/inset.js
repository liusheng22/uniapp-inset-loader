const { methods, mounted, reportScript, methodsTemplate, mountedTemplate, reportScriptTemplate } = require('../snippet/script.js')
const { renderjsTemplate } = require('../snippet/render.js')
const { generateStyleCode } = require('./index')

const insetCollectLogsSnippets = (compiler, content) => {
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
      // type: 'script'
      if (customBlock.type !== 'script') {
        rewriteBlocks.push(customBlock)
        return
      }
      if (!customContent) {
        rewriteBlocks.push(customBlock)
        return
      }
      let newContent = ''
      // const defaultReg = new RegExp(/export\s*default\s*{/g)
      const defaultReg = new RegExp(/(export\s*default\s*{)/g)
      // 正则找到 `mounted() {` 字符串
      const mountedReg = new RegExp(/(mounted\s*\(\)\s*{)/g)
      // 判断是否已经存在mounted方法
      if (mountedReg.test(customContent)) {
        // 在该字符串之后插入我们的代码
        // newContent = customContent.replace(mountedReg, `mounted() {${mounted}`)
        newContent = customContent.replace(mountedReg, `$1 ${mounted}`)
      } else {
        // 在该字符串之后插入我们的代码
        // newContent = customContent.replace(defaultReg, `export default {${mountedTemplate}`)
        newContent = customContent.replace(defaultReg, `$1 ${mountedTemplate}`)
      }
      // 正则找到 `methods: {/` 字符串
      const methodsReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (methodsReg.test(customContent)) {
        // 在该字符串之后插入我们的代码
        // newContent = newContent.replace(methodsReg, `methods:{${methods}`)
        newContent = newContent.replace(methodsReg, `$1 ${methods}`)
      } else {
        // 在该字符串之后插入我们的代码
        // newContent = newContent.replace(defaultReg, `export default {${methodsTemplate}`)
        newContent = newContent.replace(defaultReg, `$1 ${methodsTemplate}`)
      }

      // script 中的 methods: { 插入代码
      const scriptReg = new RegExp(/(methods\s*:\s*{)/g)
      // 判断是否已经存在methods方法
      if (scriptReg.test(script.content)) {
        // 在该字符串之后插入我们的代码
        // compiler.script.content = script.content.replace(scriptReg, `methods: {${reportScript}`)
        compiler.script.content = script.content.replace(scriptReg, `$1 ${reportScript}`)
      } else {
        // 在该字符串之后插入我们的代码
        // compiler.script.content = script.content.replace(defaultReg, `export default {${reportScriptTemplate}`)
        compiler.script.content = script.content.replace(defaultReg, `$1 ${reportScriptTemplate}`)
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
    content = `
      <template>
        ${compiler.template.content}
      </template>
      <script>
        ${compiler.script.content}
      </script>
      ${renderjsTemplate}
      ${generateStyleCode(compiler.styles || [])}
    `
  }

  return content
}

module.exports = insetCollectLogsSnippets
