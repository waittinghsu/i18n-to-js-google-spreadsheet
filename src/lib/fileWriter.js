const fs = require('fs').promises;
const DirectoryManager = require('./directoryManager');

/**
 * 將內容寫入指定路徑的 JavaScript 文件
 *
 * @description
 * - 確保目標目錄存在
 * - 非同步寫入文件
 * - 處理文件寫入可能的錯誤
 *
 * @param {string} outputDirectory - 目標資料夾路徑
 * @param {string} fileContent - 要寫入的文件內容
 * @param {string} fileName - 文件名（不包含副檔名）
 * @returns {Promise<void>} 文件寫入完成的 Promise
 * @throws {Error} 文件寫入失敗時拋出錯誤
 */
const writeJavaScriptFile = async (outputDirectory, fileContent, fileName) => {
  try {
    // 遞迴創建目錄
    await DirectoryManager.createDirectoryRecursively(outputDirectory);
    // 構建完整檔案路徑
    const fullFilePath = `${outputDirectory}/${fileName}.js`;
    // 寫入檔案
    await fs.writeFile(fullFilePath, fileContent);
    console.log(`文件写入成功 💪🤗🤗✅: ${fullFilePath}.js`);
  } catch (err) {
    console.error(`文件写入失败👹👹: ${fileName}`, err);
    throw err; // 重新拋出錯誤，讓調用者處理
  }
};

module.exports = {
  writeJavaScriptFile,
};
