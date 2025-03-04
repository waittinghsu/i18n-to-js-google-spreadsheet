# google-spreadsheet-to-js 

## 多國語系檔案生成
根據 i18n-to-js.config 配置檔案 mdoe 直選擇不同轉換方式
擷取google sheet excel 並 轉換成key:value 的js檔案



```bash
i18n-to-js.config.js 專案下建立此檔案
const path = require("path");
module.exports = {
  mode: "LOCAL",
  excelProjectToken: "",
  useApiKey: "",
  sheet: [],
  distFolder: "src/i18n/lang", // 檔案輸出資料夾
  sourceFilePath: "src/i19n/xxx.xlsx",
};

```

| key    | description |
|--------|--|
| mode   | LOCAL: 讀取本地EXCEL , GOOGLE_SHEET: 使用google api | 
| excelProjectToken | 專案的token | 
| useApiKey | googleapi key | 
| sheet | 選擇excel 表內sheet | 
| distFolder | 登出 | 
| sourceFilePath | 讀取的EXCEL路徑 | 


excel 表格長這樣

| key    | structure	   | zh-CN | en     |
|--------|--------------|-------|--------|
| login  | login        | 登入    | LOGIN  |
| logout | login        | 登出    | LOGOUT |
| name   | user.columns | 名稱    | LOGOUT |

structure 能夠細分多層結構

會生成下面兩檔案
=>
### zh-CN.js
`
export default {
  login: {
    login: '登入',
    logout: '登出',
  },
  user: {
    columns: {name: '名稱'}
  }
};
`


### en.js
`
export default {
  login: {
    login: 'LOGIN',
    logout: 'LOGOUT',
  },
  user: {
    columns: {name: 'Name'}
  }
};
`
