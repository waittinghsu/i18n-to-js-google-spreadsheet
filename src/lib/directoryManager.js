const fs = require('fs').promises;
const path = require('path');

class DirectoryManager {
  /**
   * 安全地解析目標路徑
   * @param {string} targetPath - 目標路徑
   * @returns {string} 完整的絕對路徑
   */
  static resolveSafePath(targetPath) {
    return path.resolve(process.cwd(), targetPath);
  }

  /**
   * 遞迴創建目錄
   * @param {string} targetDir - 目標目錄路徑
   * @returns {Promise<string>} 創建的目錄路徑
   */
  static async createDirectoryRecursively(targetDir) {
    const fullPath = this.resolveSafePath(targetDir);

    try {
      await fs.mkdir(fullPath, { recursive: true });
      return fullPath;
    } catch (err) {
      // 忽略目錄已存在的錯誤
      if (err.code !== 'EEXIST') {
        console.error(`目錄創建失敗👹: ${fullPath}`, err);
        throw err;
      }
      return fullPath;
    }
  }

  /**
   * 遞迴刪除目錄
   * @param {string} deletePath - 要刪除的目錄路徑
   */
  static async removeDirectoryRecursively(deletePath) {
    const fullPath = this.resolveSafePath(deletePath);

    try {
      // 檢查目錄是否存在
      await fs.access(fullPath);

      // 讀取目錄內容
      const files = await fs.readdir(fullPath);

      // 並行處理刪除任務
      await Promise.all(
        files.map(async (file) => {
          const curPath = path.join(fullPath, file);
          /**
           * lstat: 獲取文件/目錄的詳細信息，不解析符號鏈接
           * - 與 stat 不同，lstat 直接返回符號鏈接本身的信息，而不是鏈接指向的實際文件
           *
           * @example
           * // 獲取文件/目錄的詳細信息
           * const stats = await fs.lstat('/path/to/file');
           *
           * 主要屬性：
           * - size: 文件大小（字節）
           * - mode: 文件權限
           * - mtime: 最後修改時間
           * - isDirectory(): 判斷是否為目錄的方法
           */
          const stat = await fs.lstat(curPath);
          /**
           * isDirectory(): 判斷是否為目錄的方法
           * - 返回 true/false
           * - 用於區分文件和目錄
           *
           * @example
           * if (stat.isDirectory()) {
           *   // 處理目錄
           *   await removeDirectoryRecursively(curPath);
           * } else {
           *   // 處理文件
           *   await fs.unlink(curPath);
           * }
           */

          if (stat.isDirectory()) {
            // 如果是目錄，執行遞迴刪除
            await this.removeDirectoryRecursively(curPath);
          } else {
            // 如果是文件，直接刪除
            await fs.unlink(curPath);
          }
        }),
      );

      // 刪除空目錄
      await fs.rmdir(fullPath);
    } catch (err) {
      // 忽略目錄不存在的錯誤
      if (err.code !== 'ENOENT') {
        console.error(`目錄刪除失敗: ${fullPath}`, err);
      }
    }
  }
}

module.exports = DirectoryManager;
