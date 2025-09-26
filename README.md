# google-spreadsheet-to-js

## 多國語系檔案生成
根據 i18n-to-js.config 配置檔案 mode 選擇不同轉換方式
擷取google sheet excel 並 轉換成key:value 的js檔案

## 安裝與設定

### 1. 安裝
```bash
npm install excel-to-js-google-spreadsheet
```

### 2. 設定配置檔
```bash
# 複製範例配置檔
cp i18n-to-js.config.example.js i18n-to-js.config.js

# 編輯配置檔，填入你的設定
vim i18n-to-js.config.js
```

### 3. 配置檔說明
```javascript
// i18n-to-js.config.js
const path = require("path");
module.exports = {
  mode: "LOCAL", // LOCAL: 讀取本地Excel | GOOGLE_SHEET: 使用Google API
  excelProjectToken: "YOUR_GOOGLE_SHEET_TOKEN", // Google Sheet 專案 token
  useApiKey: "YOUR_GOOGLE_API_KEY", // Google API key
  sheet: [], // 選擇excel表內sheet，空陣列表示處理所有sheet
  distFolder: "src/i18n/lang", // 檔案輸出資料夾
  sourceFilePath: "src/i18n/xxx.xlsx", // LOCAL模式時的Excel檔案路徑
  outputFormat: "js", // 輸出格式: 'js' JavaScript模組 | 'json' 純JSON檔案（可選，預設 'js'）
};
```

⚠️ **重要**: `i18n-to-js.config.js` 包含敏感資料，已加入 `.gitignore`，請勿提交到版控系統。

| key    | description |
|--------|--|
| mode   | LOCAL: 讀取本地EXCEL , GOOGLE_SHEET: 使用google api |
| excelProjectToken | 專案的token |
| useApiKey | googleapi key |
| sheet | 選擇excel 表內sheet |
| distFolder | 檔案輸出資料夾 |
| sourceFilePath | 讀取的EXCEL路徑 |
| outputFormat | 輸出格式: 'js' JavaScript模組, 'json' 純JSON檔案（可選，預設 'js'） | 


excel 表格長這樣

| key    | structure	   | zh-CN | en     |
|--------|--------------|-------|--------|
| login  | login        | 登入    | LOGIN  |
| logout | login        | 登出    | LOGOUT |
| name   | user.columns | 名稱    | LOGOUT |

structure 能夠細分多層結構

## 輸出格式

### JavaScript 格式 (outputFormat: 'js')
會生成 `.js` 檔案：

**zh-CN.js**
```javascript
export default {
  login: {
    login: '登入',
    logout: '登出',
  },
  user: {
    columns: {name: '名稱'}
  }
};
```

**en.js**
```javascript
export default {
  login: {
    login: 'LOGIN',
    logout: 'LOGOUT',
  },
  user: {
    columns: {name: 'Name'}
  }
};
```

### JSON 格式 (outputFormat: 'json')
會生成 `.json` 檔案：

**zh-CN.json**
```json
{
  "login": {
    "login": "登入",
    "logout": "登出"
  },
  "user": {
    "columns": {
      "name": "名稱"
    }
  }
}
```

**en.json**
```json
{
  "login": {
    "login": "LOGIN",
    "logout": "LOGOUT"
  },
  "user": {
    "columns": {
      "name": "Name"
    }
  }
}
```
