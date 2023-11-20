const { logsMethodsTemplate, logsMountedTemplate } = require('./script.js')

const renderScriptTemplate = (selector) => {
  return `
    <script module="collectLogs" lang="renderjs">
    export default {
      ${logsMountedTemplate}
      ${logsMethodsTemplate(selector)}
    }
    </script>
  `
}

module.exports = {
  renderScriptTemplate
}
