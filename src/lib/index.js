const fs = require("fs");
const { getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel } = require("./parseExcel");
const { checkI18nConfig } = require('./configValidator');
const { writeJavaScriptFile } = require('./fileWriter');
const { genCodeByObj, genCodeByArrayObj  } = require("./genCode");
const DirectoryManager = require('./directoryManager');
const defaultConfig = require("./config");
const _ = require("lodash");

/**
 * @brief 核心 controller 程式流程
 * 1. 與外部合併 設定檔 i18n-to-js.config.js
 * 2. checkConfig() 判斷特定欄位正確性
 * 3. 重建folder
 * @param option 取得當前目錄下的設定黨 做合併
 * @return 無.
 * @author 作者名稱 (spidergod23@gmail.com或P0029)
 * @date 2020-08-05 */
async function coreForGoogle(option = {}) {
  const config = Object.assign(defaultConfig, option); // 全局變數
  //判斷
  checkI18nConfig(option, option.mode);
  await DirectoryManager.removeDirectoryRecursively(config.distFolder); // 除指定資料夾
  await getGoogleExcel(config).then(async mySheet => {
    if(config.sheet.constructor === Object) {
      await Promise.all( _.map(config.sheet, async (findSheet, path) => {
        await parseGoogleExcel(mySheet, findSheet).then(i18ns => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            writeJavaScriptFile(`${config.distFolder}/${path}`, genCodeByArrayObj(fileInfo), fileName);
          });
        });
        return findSheet;
      }));
    }
    if(config.sheet.constructor === Array || config.sheet.constructor === String) {
        await parseGoogleExcel(mySheet, config.sheet).then((i18ns) => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            writeJavaScriptFile(config.distFolder, genCodeByArrayObj(fileInfo), fileName);
          });
        });
    }
  })
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
