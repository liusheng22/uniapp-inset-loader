const getClassNameTitle = (selector) => {
  const querySelector = selector || '.title'
  return `
    () => {
      const el = document.querySelector('${querySelector}')
      return el ? el.innerText : ''
    }
  `
}

const logsMethods = (selector) => {
  return `
    isBoolean(bool) {
      return Object.prototype.toString.call(bool) === '[object Boolean]'
    },
    setCustomTitle() {
      const getClassNameTitle = ${getClassNameTitle(selector)}
      const title = getClassNameTitle()
      this.$ownerInstance.callMethod('updateCustomTitle', title)
    },
    clickHandler(e) {
      const { target, touches, pageX, pageY } = e
      const tapsInfo = {}
      let elInnerText = ''
      var dataset = {}

      const { tagName } = target
      if (['UNI-BUTTON', 'UNI-NAVIGATOR', 'BUTTON', 'A'].includes(tagName)) {
        elInnerText = this.getElInnerText(target)
      }

      if (['IMG'].includes(tagName)) {
        var { dataset } = target.parentElement
      } else {
        var { dataset } = target
      }

      const { logs, type } = dataset
      tapsInfo.tapType = this.isBoolean(type) ? '' : type
      tapsInfo.tapText = this.isBoolean(logs) ? '' : logs
      tapsInfo.tapText = tapsInfo.tapText || elInnerText

      tapsInfo.tapText && this.$ownerInstance.callMethod('tapEventReport', {
        eventType: tapsInfo.tapType || 'button_click',
        extendFields: {
          button_title: tapsInfo.tapText,
          abscissa: pageX,
          ordinate: pageY,
        }
      })
    },
    getElInnerText(el) {
      return el.innerText || el.textContent || el.nodeValue || el.value || ''
    },
  `
}

const logsMounted = `
// 监听全局点击事件
document.addEventListener('click', this.clickHandler)

// 获取 APP自定义标题
this.setCustomTitle()
`

const compilerScript = `
tapEventReport(params) {
  const customTitle = this.logsCustomTitle
  this.$collectLogs.reportLog({
    ...params,
    customTitle
  })
},
updateCustomTitle(title) {
  this.logsCustomTitle = title
},
`

const logsMethodsTemplate = (selector) => {
  return `
    methods: {
      ${logsMethods(selector)}
    },
  `
}

const logsMountedTemplate = `
mounted() {
  ${logsMounted}
},
`

const compilerScriptTemplate = `
methods: {
  ${compilerScript}
},
`

module.exports = {
  logsMethods,
  logsMounted,
  compilerScript,
  logsMethodsTemplate,
  logsMountedTemplate,
  compilerScriptTemplate
}

