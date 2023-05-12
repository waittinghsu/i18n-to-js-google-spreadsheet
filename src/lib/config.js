const path = require("path");

module.exports = {
  mode: "LOCAL",
  excelProjectToken: "",
  useApiKey: "",
  sheet: [],
  distFile: path.resolve(process.cwd(), "lang.js"), // 檔案輸出至單一檔案 (moduleMode為true時會自動省略)
  distFolder: "src/i18n/lang", // 檔案輸出資料夾
  sourceFilePath: "",
};
