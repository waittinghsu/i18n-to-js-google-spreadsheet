const fs = require("fs");
const { getGoogleExcel, parseGoogleExcel, getLocalExcel, parseLocalExcel } = require("./parseExcel");
const deleteDir = require("./deleteDir");
const mkDirByPathSync = require("./mkdir");
const { genCodeByObj, genCodeByArrayObj  } = require("./genCode");
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
  checkConfig(config);
  await deleteDir(config.distFolder); // 除指定資料夾
  await getGoogleExcel(config).then(async mySheet => {
    if(config.sheet.constructor === Object) {
      await Promise.all( _.map(config.sheet, async (findSheet, path) => {
        await parseGoogleExcel(mySheet, findSheet).then(i18ns => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            mkFile(`${config.distFolder}/${path}`, genCodeByArrayObj(fileInfo), fileName);
          });
        });
        return findSheet;
      }));
    }
    if(config.sheet.constructor === Array || config.sheet.constructor === String) {
        await parseGoogleExcel(mySheet, config.sheet).then((i18ns) => {
          _.forEach(i18ns, (fileInfo, fileName) => {
            mkFile(config.distFolder, genCodeByArrayObj(fileInfo), fileName);
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
  checkConfig(config);
  await deleteDir(config.distFolder); // 除指定資料夾
  const { sheet: findSheet } = config;
  const fileData = await getLocalExcel(config);
  const fileContent = await parseLocalExcel(fileData, findSheet);
  await Promise.all(Object.keys(fileContent).map((fileName) => {
    mkFile(config.distFolder, genCodeByObj(fileContent[fileName]), fileName);
    return fileName;
  }));
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
  fs.writeFile(`${distPath}/${fileName}.js`, content, err => {
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
function checkConfig(config) {
  const { mode = 'LOCAL' } = config;
  const rules = {
    GOOGLE_SHEET: ['excelProjectToken', 'useApiKey', 'sheet'],
    LOCAL: ['sourceFilePath', 'distFolder', 'sheet'],
  };

  const findEmpty = _.pickBy(config, (value, configKey) => {
    return rules[mode].includes(configKey) && _.isEmpty(value);
  });
  if (!_.isEmpty(findEmpty) ) {
    console.log('請檢查設定檔欄位 不可為空值', findEmpty);
    throw 'plz check params';
  }
}

module.exports = { coreForGoogle, coreForLocal };
