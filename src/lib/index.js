const fs = require("fs");
const { getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel } = require("./parseExcel");
const { checkI18nConfig } = require('./configValidator');
const { writeJavaScriptFile } = require('./fileWriter');
const { genCodeByObj } = require("./genCode");
const DirectoryManager = require('./directoryManager');
const defaultConfig = require("./config");


/**
 * 核心處理函數
 * @param {Object} option - 配置選項
 */
async function coreForGoogle(option = {}) {
  try {
    const config = Object.assign({}, defaultConfig, option);

    // 配置驗證
    checkI18nConfig(option, option.mode);

    // 清理目標目錄
    await DirectoryManager.removeDirectoryRecursively(config.distFolder);

    // 獲取並處理 Google Sheet 數據
    const mySheet = await getGoogleExcel(config);
    const i18ns = await parseGoogleExcel(mySheet, config.sheet);

    // 生成檔案
    Object.entries(i18ns).forEach(([fileName, fileInfo]) => {
      writeJavaScriptFile(config.distFolder, genCodeByObj(fileInfo), fileName);
    });

    console.log('✅ 多語言檔案生成完成');

  } catch (error) {
    console.error('❌ 處理失敗:', error.message);
    throw error;
  }
}

/**
 * @brief 核心 controller 程式流程
 * 1. 與外部合併 設定檔 i18n-to-js.config.js
 * 2. checkConfig() 判斷特定欄位正確性
 * 3. 重建folder
 * @param option 取得當前目錄下的設定黨 做合併
 * @return 無.
 * @author 作者名稱 (spidergod23@gmail.com或P0029)
 * @date 2023-05-20 */
async function coreForLocal(option = {}) {
  const config = Object.assign(defaultConfig, option); // 全局變數
  try {
    checkI18nConfig(option, option.mode);
    await DirectoryManager.removeDirectoryRecursively(config.distFolder); // 除指定資料夾
    const workbook = await getLocalExcel(config);
    const result = await parseLocalExcel(workbook, config.sheet);
    // 並行生成語言檔案，使用 Promise.allSettled 提高容錯性
    const fileCreationTasks = Object.keys(result).map(async(fileName) => {
      try {
        return await writeJavaScriptFile(
            config.distFolder,
            genCodeByObj(result[fileName]),
            fileName,
        );
      } catch (fileError) {
        console.error(`文件 ${fileName} 生成失敗:`, fileError);
        return { fileName, error: fileError };
      }
    });

    // 等待所有檔案處理完成
    // 等待所有檔案處理完成
    const results = await Promise.allSettled(fileCreationTasks);

    const successTasks = results.filter((res) => res.status === 'fulfilled');
    const failedTasks = results.filter((res) => res.status === 'rejected');
    console.log('語言檔案生成完成 🎉:', successTasks.length);
    console.log('語言檔案生成失败👹:', failedTasks.length);
    failedTasks.forEach((task) => {
      console.error('文件生成失败👹:', task.reason);
    });
  } catch (error) {
    console.error('失敗👹:', error.message);
    if (error.missingFields) {
      console.error('缺失欄位:', error.missingFields);
    }
    process.exit(1);
  }
}

module.exports = { coreForGoogle, coreForLocal };
