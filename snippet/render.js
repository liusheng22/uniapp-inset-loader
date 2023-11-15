const renderjsTemplate = `
<script module="collectLogs" lang="renderjs">
export default {
  mounted() {
    // 监听全局点击事件
    document.addEventListener('click', this.clickHandler)
  },
  methods: {
    isBoolean(bool) {
      return Object.prototype.toString.call(bool) === '[object Boolean]'
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

      tapsInfo.tapText && this.$ownerInstance.callMethod('reportClick', {
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
  }
}
</script>
`

module.exports = {
  renderjsTemplate
}
