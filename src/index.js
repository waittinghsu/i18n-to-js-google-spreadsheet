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

async function core(option = {}) {
  Object.assign(config, option);
  if (config.excelProjectToken === "" || config.useApiKey === "") {
    return false;
  }
  await getExcel().then((i18ns) => {
    _.forEach(i18ns, (fileInfo, fileName) => {
      mkFile(genCode(fileInfo), fileName);
    });
  });
}

async function getExcel() {
  // mySheet = new GoogleSpreadsheet('1TffMGlRQ28DBwQLXipJzH4LNFVz2L3-ek_KDpqdjuWE');
  console.log(config);
  const mySheet = new GoogleSpreadsheet(config.excelProjectToken);
  mySheet.useApiKey(config.useApiKey);
  await mySheet.loadInfo(1); // loads document properties and worksheets
  const output = {}; // { en: {}, 'zh-CN': {} }
  await Promise.all(
    _.map(mySheet.sheetsByIndex, async (sheet) => {
      if (config.sheet.includes(sheet.title)) {
        // 取得表頭 設定 output 預設值
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
  //     e {
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

async function mkFile(info, fileName) {
  await deleteDir(config.distFolder); // 除指定資料夾
  await mkDirByPathSync(config.distFolder); // 再重新創建資料夾
  fs.writeFile(`${config.distFolder}/${fileName}.js`, info, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`Write operation complete.  ${fileName}.js`);
    }
  });
}
