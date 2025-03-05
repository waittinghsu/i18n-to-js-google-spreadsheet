// google-spreadsheet modules 宣告
const {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheetRow,
} = require('google-spreadsheet');
const ExcelJS = require('exceljs');
const XLSX =  require('xlsx');
const _ = require('lodash');

// 做error handler
class ParseExcelError extends Error {
  constructor(message, missingFields) {
    super(message);
    this.name = 'ConfigValidationError';
    this.missingFields = missingFields;
  }
}

/**
 * @brief 打 google sheet api
 * @return 無.
 * @date 2020-07-31 */
async function getGoogleExcel(config) {
  const mySheet = new GoogleSpreadsheet(config.excelProjectToken);
  await mySheet.useApiKey(config.useApiKey);
  await mySheet.loadInfo(1); // loads document properties and worksheets
  console.log('google sheet api 擷取完成 ..');
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
              (fileKey) => (output[fileKey] = []),
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
    }),
  );
  return output;
}

/**
 * 讀取本地 Excel 檔案
 * @param {Object} config 配置對象
 * @returns {Promise<ExcelJS.Workbook>} Excel 工作簿
 */
async function getLocalExcel(config) {
  const { sourceFilePath } = config;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourceFilePath);
  return workbook;
}

/**
 * 解析 Excel 檔案，將多語系資料轉換為巢狀結構對象
 *
 * @param {ExcelJS.Workbook} mySheetData - Excel 工作簿實例
 * @param {string[]} findSheet - 要處理的工作表名稱陣列
 * @returns {Object} 解析後的多語系巢狀結構對象
 */
async function parseLocalExcel(mySheetData, findSheet = []) {
  // 初始化最終語系合併結果的物件
  const mergeLang = {};

  // 取得所有工作表名稱
  const sheetNames = mySheetData.worksheets.map(worksheet => worksheet.name);

  // 過濾出存在於 Excel 中的指定工作表
   const isExistSheets = findSheet.length === 0 ? sheetNames : findSheet.filter((configSheetName) => sheetNames.includes(configSheetName));


  // 遍歷每個匹配的工作表
  for (const sheetName of isExistSheets) {
    const worksheet = mySheetData.getWorksheet(sheetName);
    // 獲取標題列
    const headerRow = worksheet.getRow(1);
    // 把首行的key 轉成 map 並對照 index直
    const headerRowKeyMapIndex = headerRow.values.reduce((map, value, index) => {
      const trimmedValue = String(value || '').trim();
      trimmedValue && map.set(trimmedValue, index);
      return map; // 返回同一個 map 引用
    }, new Map());
    // 檢查key是否存在
    if (!headerRowKeyMapIndex.get('key')) {
      throw new ParseExcelError('缺少重要欄位', 'key');
    }
    // 要產生檔案的 名稱 列表
    const langNameKeys = headerRow.values.filter((header) => header && header !== 'key' && header !== 'structure');
    // 初始化每種語系的基礎結構
    langNameKeys.forEach(lang => {
      mergeLang[lang] = mergeLang[lang] || {};
    });
    // 遍歷每一列資料（跳過標題列）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      // 取得當前列的 key 和結構
      const key = String(row.getCell(headerRowKeyMapIndex.get('key')).value || '').trim();
      const structure = headerRowKeyMapIndex.get('structure') ? String(row.getCell(headerRowKeyMapIndex.get('structure')).value || '').trim() : '';

      // 處理每種語系的單元格值
      langNameKeys.forEach((lang, index) => {
        // 第三個之後 都算語言包代號
        const cellValue = row.getCell(headerRowKeyMapIndex.get(lang)).value;
        // 如果是字串才進行 trim
        const trimmedValue = typeof cellValue === 'string' ? cellValue.trim() : cellValue;

        // 忽略空值
        if (trimmedValue !== null && trimmedValue !== undefined) {
          // 結構路徑[structure] 為空時
          if(!structure) {
            mergeLang[lang][key] = trimmedValue;
            return
          }
          // 拆分結構路徑（支援多層巢狀）
          const structureParts = structure.split('.');
          // 指向當前語系的物件
          let currentLangObj = mergeLang[lang];
          // 動態創建巢狀結構
          structureParts.forEach((part, idx) => {
            // 最後一層：放置具體的鍵值對
            if (idx === structureParts.length - 1) {
              currentLangObj[part] = currentLangObj[part] || {};
              currentLangObj[part][key] = trimmedValue;
            } else {
              // 中間層：創建物件結構
              currentLangObj[part] = currentLangObj[part] || {};
              currentLangObj = currentLangObj[part];
            }
          });
        }
      });
    });
  }
  return mergeLang;
}


module.exports = {
  getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel,
};




