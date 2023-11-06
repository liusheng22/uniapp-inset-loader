
# wxb-uniapp-inset-loader
#### 编译阶段在sfc模板指定位置插入自定义内容，适用于webpack构建的vue应用，常用于小程序需要全局引入组件的场景。（由于小程序没有开放根标签，没有办法在根标签下追加全局标签，所以要使用组件必须在当前页面引入组件标签）

### 第一步 安装
```bash
npm install wxb-uniapp-inset-loader --save-dev
```

### 第二步 vue.config.js注入loader
```javascript
// vue.config.js file
const path = require('path')
module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: {
            loader: path.resolve(__dirname, '../node_modules/wxb-uniapp-inset-loader/src/index.js'),
            options: {
              // 根据自己项目需要配置的平台进行填写，比如 ['app-plus','mp-weixin']
              VUE_APP_PLATFORMS: ['app-plus']
            }
          }
        }
      ]
    }
  }
}
```
```javascript
// 支持自定义pages.json文件路径
options: {
  pagesPath: path.resolve(__dirname,'./src/pages.json')
}
```

### 第三步 pages.json配置文件中添加insetLoader
```json
// pages.json file
"insetLoader": {
  "config":{
    "componentName": "<custom-global-component></custom-global-component>",
  },
  // 全局配置
  "label":["componentName"],
  "rootEle":"div"
},
"pages": [
  {
    "path": "pages/test/index",
    "style": {
      "navigationBarTitleText": "测试页面",
      // 单独配置，用法跟全局配置一致，优先级高于全局
      "label": ["componentName"],
      "rootEle":"div"
    }
  }
]
```

###  配置说明

- `config` (default: `{}`)
  定义标签名称和内容的键值对
- `label`(default: `[]`)
  需要全局引入的标签，打包后会在所有页面引入此标签
- `rootEle`(default: `"div"`)
  根元素的标签类型，缺省值为div，支持正则，比如匹配任意标签 ".*"

✔ `label` 和 `rootEle` 支持在单独页面的style里配置，优先级高于全局配置
