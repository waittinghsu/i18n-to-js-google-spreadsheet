const fs = require('fs').promises;
const DirectoryManager = require('./directoryManager');

/**
 * 將內容寫入指定路徑的檔案（支援多種格式）
 *
 * @description
 * - 確保目標目錄存在
 * - 非同步寫入檔案
 * - 根據格式自動選擇副檔名
 * - 處理檔案寫入可能的錯誤
 *
 * @param {string} outputDirectory - 目標資料夾路徑
 * @param {string} fileContent - 要寫入的檔案內容
 * @param {string} fileName - 檔案名（不包含副檔名）
 * @param {string} format - 輸出格式: 'js' | 'json'（預設 'js'）
 * @returns {Promise<void>} 檔案寫入完成的 Promise
 * @throws {Error} 檔案寫入失敗時拋出錯誤
 */
const writeJavaScriptFile = async (outputDirectory, fileContent, fileName, format = 'js') => {
  try {
    // 遞迴創建目錄
    await DirectoryManager.createDirectoryRecursively(outputDirectory);

    // 防呆機制：根據格式決定副檔名
    const validFormats = ['js', 'json'];
    const outputFormat = validFormats.includes(format) ? format : 'js';
    const fileExtension = outputFormat === 'json' ? 'json' : 'js';

    // 構建完整檔案路徑
    const fullFilePath = `${outputDirectory}/${fileName}.${fileExtension}`;

    // 寫入檔案
    await fs.writeFile(fullFilePath, fileContent);
    console.log(`檔案寫入成功 💪🤗🤗✅: ${fullFilePath}`);
  } catch (err) {
    console.error(`檔案寫入失敗👹👹: ${fileName}`, err);
    throw err; // 重新拋出錯誤，讓調用者處理
  }
};

module.exports = {
  writeJavaScriptFile,
};
