# google-spreadsheet-to-js 

## 多國語系檔案生成

擷取google sheet excel 並 轉換成key:value 的js檔案


|  key   |  zh-CN	|    en   |
| ------ | ------ | ------- |
| login  |   登入  | LOGIN   |
|  |   登出  | LOGOUT  |

=>
### zh-CN.js
export default {
  login: '登入',
  logout: '登出',
};


### en.js
export default {
  login: 'LOGIN',
  logout: 'LOGOUT',
};
