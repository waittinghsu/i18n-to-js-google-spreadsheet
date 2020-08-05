const fs = require("fs");
const path = require("path");
const deleteDir = require("./deleteDir");
const mkDirByPathSync = require("./mkdir");
const genCode = require("./genCode");
const config = require("./config");
// google-spreadsheet modules 宣告
const {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheetRow,
} = require("google-spreadsheet");
const _ = require("lodash");

module.exports = core;

/**
 * @brief 核心 controller 程式流程
 * 1. 與外部合併 設定檔 i18n-to-js.config.js
 * 2. checkConfig() 判斷特定欄位正確性
 * 3. 重建folder
 * @param option 取得當前目錄下的設定黨 做合併
 * @return 無.
 * @author 作者名稱 (spidergod23@gmail.com或P0029)
 * @date 2020-08-05 */
async function core(option = {}) {
  Object.assign(config, option); // 全局變數
  //判斷
  checkConfig();
  await deleteDir(config.distFolder); // 除指定資料夾
  await getExcel().then(async mySheet => {
    if(config.sheet.constructor === Object) {
      await Promise.all( _.map(config.sheet, async (findSheet, path) => {
        await parseExcel(mySheet, findSheet).then(i18ns => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            mkFile(`${config.distFolder}/${path}`, genCode(fileInfo), fileName);
          });
        });
        return findSheet;
      }));
    }
    if(config.sheet.constructor === Array || config.sheet.constructor === String) {
        await parseExcel(mySheet, config.sheet).then((i18ns) => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            mkFile(config.distFolder, genCode(fileInfo), fileName);
          });
        });
    }
  })
}

/**
 * @brief 解析Excel
 * Promise 搭配 map 用法 讓async await運作
 * 1. 擷取表頭 建立 output 檔名key 預設值
 * 2. getRows 建立多國語系mapping 物件
 * @return 無.
 * @date 2020-07-31 */
async function parseExcel(mySheet, findSheet = []) {
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
            if (!row.key) {
              return false;
            }
            _.map(output, (fileCollection, fileKey) => {
              // todo 物件版本 key唯一
              // fileCollection[row.key] = row[fileKey];
              // todo 陣列版本 全塞
              fileCollection.push({ key: row.key, text: row[fileKey] });
            });
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
 * @brief 打 google sheet api
 * @return 無.
 * @date 2020-07-31 */
async function getExcel() {
  const mySheet = new GoogleSpreadsheet(config.excelProjectToken);
  mySheet.useApiKey(config.useApiKey);
  await mySheet.loadInfo(1); // loads document properties and worksheets
  return mySheet;
}

/**
 * @brief 建立檔案
 * 1. 與外部合併 設定檔 i18n-to-js.config.js
 * 2. checkConfig() 判斷特定欄位正確性
 * 3. 重建folder
 * @param distPath
 * @param content
 * @param fileName
 * @return 無.
 * @date 2020-08-05 */
async function mkFile(distPath, content, fileName) {
  await mkDirByPathSync(distPath); // 再重新創建資料夾
  fs.writeFile(`${distPath}/${fileName}.js`, content, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`Write operation complete 💪🤗🤗.  ${distPath}/${fileName}.js`);
    }
  });
}

/**
 * @brief 檢測config 參數是否有誤
 * @date 2020-08-05 */
function checkConfig() {
  const findEmpty = _.pickBy(config, (value, configKey) => {
    return ['excelProjectToken', 'useApiKey', 'sheet'].includes(configKey) && _.isEmpty(value);
  });
  if (!_.isEmpty(findEmpty) ) {
    console.log('請檢查設定檔欄位 不可為空值', findEmpty);
    throw 'plz check params';
  }
}
