const fs = require('fs');
const path = require('path');

/**
 * 刪除路徑
 * @param {String} deletePath
 */
module.exports = function deleteDir(deletePath) {
  let files = [];

  if (fs.existsSync(deletePath)) {
    // 判定給定路徑是否存在

    files = fs.readdirSync(deletePath); // 返回文件和子目錄的陣列
    files.forEach((file, index) => {
      const curPath = path.join(deletePath, file);

      if (fs.statSync(curPath).isDirectory()) {
        // 同步讀取資料夾內資料，如果為資料夾，則回調自身
        deleteDir(curPath);
      } else {
        fs.unlinkSync(curPath); // 是指定文件則刪除
      }
    });

    fs.rmdirSync(deletePath); // 資料夾
  }
};
