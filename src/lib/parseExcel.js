// google-spreadsheet modules 宣告
const {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheetRow,
} = require("google-spreadsheet");
const XLSX =  require("xlsx");
const _ = require("lodash");

/**
 * @brief 打 google sheet api
 * @return 無.
 * @date 2020-07-31 */
async function getGoogleExcel(config) {
  const mySheet = new GoogleSpreadsheet(config.excelProjectToken);
  mySheet.useApiKey(config.useApiKey);
  await mySheet.loadInfo(1); // loads document properties and worksheets
  console.log('google sheet api 擷取完成 ..')
  return mySheet;
}

/**
 * @brief 解析Excel
 * Promise 搭配 map 用法 讓async await運作
 * 1. 擷取表頭 建立 output 檔名key 預設值
 * 2. getRows 建立多國語系mapping 物件
 * @return {Object}  { en: {}, 'zh-CN': {} }
 * @date 2020-07-31 */
async function parseGoogleExcel(mySheet, findSheet = []) {
  const output = {}; // { en: {}, 'zh-CN': {} }
  await Promise.all(
    _.map(mySheet.sheetsByIndex, async (sheet) => {
      if (findSheet.includes(sheet.title)) {
        // 取得表頭 設定 output 預設值 todo 這邊跑了兩次 不憂之後優化
        await sheet.loadHeaderRow().then(() => {
          // todo 物件版本 key唯一
          // _.filter(sheet.headerValues, text => text !== 'key').forEach(fileKey => (output[fileKey] = {}));
          // todo 陣列版本 全塞
          _.filter(sheet.headerValues, (text) => text !== "key").forEach(
              (fileKey) => (output[fileKey] = [])
          );
          // _.filter(sheet.headerValues, text => text !== 'key').forEach(fileKey => (output[fileKey] = []));
        });
        // 取得列表資料
        await sheet.getRows().then((sheetData) => {
          _.forEach(sheetData, (row, index) => {
            if (row.key) {
              _.map(output, (fileCollection, fileKey) => {
                // todo 物件版本 key唯一
                // fileCollection[row.key] = row[fileKey];
                // todo 陣列版本 全塞
                fileCollection.push({ key: row.key, text: row[fileKey] });
              });
            }
          });
        });
      }
      return sheet;
    })
  );
  // const columnKey = {}; // A: key, B: zh-CN,C: en, D: EU
  // _.each(mySheet.sheetsByIndex, sheet => {
  //   if (sheet.title === 'BMS') {
  //     sheet._cells.forEach((rowItem, rowIndex) => {
  //       if (!rowItem[0].formattedValue) {
  //         return false;
  //       }
  //       if (rowIndex === 0) {
  //         rowItem.forEach(item => {
  //           columnKey[item.a1Column] = item.formattedValue;
  //         });
  //       else {
  //         let keyQ = '';
  //         rowItem.forEach(item => {
  //           if (item.a1Column === 'A') {
  //             keyQ = item.formattedValue;
  //           }
  //           if (item.a1Column !== 'A') {
  //             output[columnKey[item.a1Column]][keyQ] = item.formattedValue;
  //           }
  //         });
  //       }
  //     });
  //   }
  // });
  return output;
}

/**
 * @brief 讀取excel
 * @return {Object}
 * @date 2023-05-20 */
async function getLocalExcel(config) {
  const { sourceFilePath } = config;
  return XLSX.readFile(sourceFilePath, { type: 'array' })
}

/**
 * @brief 解析Excel
 * Promise 搭配 map 用法 讓async await運作
 * 1. 擷取表頭 建立 output 檔名key 預設值
 * 2. getRows 建立多國語系mapping 物件
 * @return {Object}  { en: {}, 'zh-CN': {} }
 * @date 2020-07-31 */
async parseLocalExcel(mySheetData, findSheet = []) {
  const { SheetName, Sheets } = mySheetData;
  const isExistSheets = findSheet.filter((configSheetName) => SheetName.includes(configSheetName));
  return isExistSheets.reduce((mergeLang, sheetName) => {
    // header: 1 回傳的array 第一筆為所有column的第一筆資料 定義為key
    let [headerKeys] = XLSX.utils.sheet_to_json(Sheets[sheetName], { header: 1 });
    headerKeys = headerKeys.filter((headerKey) => headerKey !== 'key'); //移除關鍵字key e.g. ['key', 'en', 'zh-cn']  => ['en', 'zh-cn']
    // 建立 headerKey 的 Object 格式作為初始化 return {en: {}}
    const headerObj = headerKeys.reduce((accHeader, headerK)=> ({ ...accHeader, [headerK]: {} }), {});
    
  }, {})
}
module.exports = {
  getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel,
};




