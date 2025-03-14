// google-spreadsheet modules 宣告
const { GoogleSpreadsheet } = require('google-spreadsheet');
const ExcelJS = require('exceljs');

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
 * 設置物件的深層屬性值
 * @param {Object} obj - 目標物件
 * @param {string} path - 屬性路徑（用點號分隔）
 * @param {any} value - 要設置的值
 */
function setDeepValue(obj, path, value) {
  // 拆分結構路徑（支援多層巢狀）
  const keys = path.split('.');
  // 指向當前語系的物件
  let current = obj;
  // 動態創建巢狀結構
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] || {};
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 解析 Google Sheet 數據並轉換為多層次語言結構
 * @param {GoogleSpreadsheet} mySheet - Google Sheet 實例
 * @param {string[]|string} findSheet - 要處理的工作表名稱
 * @returns {Promise<Object>} 解析後的多層次語言物件
 */
async function parseGoogleExcel(mySheet, findSheet = []) {
  try {
    const mergeLang = {};

    // 標準化工作表清單
    const sheetNames = mySheet.sheetsByIndex.map(sheet => sheet.title);
    const sheetsToProcess = findSheet.length === 0
        ? sheetNames
        : findSheet.filter(name => {
          const exists = sheetNames.includes(name);
          if (!exists) {
            console.warn(`警告: 找不到工作表 "${name}"`);
          }
          return exists;
        });

    if (sheetsToProcess.length === 0) {
      throw new ParseExcelError('沒有可處理的工作表');
    }

    // 按順序處理每個工作表
    for (const sheetName of sheetsToProcess) {
      const sheet = mySheet.sheetsByTitle[sheetName];
      await sheet.loadHeaderRow();

      // 驗證表頭
      const headers = sheet.headerValues;
      if (!headers.includes('key')) {
        throw new ParseExcelError(`工作表 ${sheetName} 缺少必要欄位 'key'`);
      }

      // 取得語言代碼列表（排除特殊欄位）
      const langKeys = headers.filter(header => header && header !== 'key' && header !== 'structure');

      // 初始化語言結構
      langKeys.forEach(lang => {
        if (!mergeLang[lang]) mergeLang[lang] = {};
      });

      // 處理工作表的所有行
      const rows = await sheet.getRows();
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const key = String(row.key || '').trim();

        if (!key) {
          console.warn(`警告: ${sheetName} 第 ${rowIndex + 2} 行缺少 key`);
          continue;
        }

        const structure = String(row.structure || '').trim();

        // 處理每種語言的翻譯
        for (const lang of langKeys) {
          const value = row[lang];
          if (value === null || value === undefined) continue;

          const trimmedValue = typeof value === 'string' ? value.trim() : value;

          if (!structure) {
            mergeLang[lang][key] = trimmedValue;
          } else {
            setDeepValue(mergeLang[lang], `${structure}.${key}`, trimmedValue);
          }
        }
      }

      console.log(`✓ 完成工作表 "${sheetName}" 的處理`);
    }

    // 驗證輸出
    const hasContent = Object.values(mergeLang).some(lang =>
        Object.keys(lang).length > 0
    );

    if (!hasContent) {
      throw new ParseExcelError('解析結果為空');
    }

    return mergeLang;

  } catch (error) {
    console.error('解析 Google Sheet 失敗:', error.message);
    throw error instanceof ParseExcelError
        ? error
        : new ParseExcelError(`解析失敗: ${error.message}`);
  }
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
        const cellValue = row.getCell(headerRowKeyMapIndex.get(lang)).text;
        // 如果是字串才進行 trim
        const trimmedValue = typeof cellValue === 'string' ? cellValue.trim() : cellValue;

        // 忽略空值
        if (trimmedValue !== null && trimmedValue !== undefined) {
          // 結構路徑[structure] 為空時
          if(!structure) {
            mergeLang[lang][key] = trimmedValue;
            return
          }
          setDeepValue(mergeLang[lang], `${structure}.${key}`, trimmedValue);
        }
      });
    });
  }
  return mergeLang;
}


module.exports = {
  getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel,
};




